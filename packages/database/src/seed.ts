import { createHash, randomBytes, scryptSync } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { apiActivityEvents, apiDependencies, apiEndpoints, apiVersions, apis, getDatabaseConnection, organizationMemberships, organizations, projectCollaborators, projects, users } from './index.js';

if (process.env['SEED_DEMO'] !== 'true') { console.log('[Database] Demo seed is opt-in. Set SEED_DEMO=true to run it.'); process.exit(0); }
const { db } = getDatabaseConnection();
const hash = scryptSync('demo-password-change-me', randomBytes(16), 64).toString('hex');
const stable = (text: string) => createHash('sha256').update(text).digest('hex');
const ago = (months: number, days = 0) => new Date(Date.now() - months * 30 * 86400000 - days * 86400000);

async function seed() {
  const [existingUser] = await db.select().from(users).where(eq(users.email, 'demo@acme.versionflow.local')).limit(1);
  const user = existingUser ?? (await db.insert(users).values({ email: 'demo@acme.versionflow.local', name: 'Acme Platform Team', passwordHash: hash }).returning())[0]!;
  const [existingOrg] = await db.select().from(organizations).where(eq(organizations.slug, 'acme-technologies')).limit(1);
  const org = existingOrg ?? (await db.insert(organizations).values({ name: 'Acme Technologies', slug: 'acme-technologies', type: 'team', createdBy: user.id }).returning())[0]!;
  await db.insert(organizationMemberships).values({ organizationId: org.id, userId: user.id, role: 'owner' }).onConflictDoNothing();
  const [existingProject] = await db.select().from(projects).where(and(eq(projects.organizationId, org.id), eq(projects.slug, 'acme-api-ecosystem'))).limit(1);
  const project = existingProject ?? (await db.insert(projects).values({ organizationId: org.id, name: 'Acme API Ecosystem', slug: 'acme-api-ecosystem', description: 'Reference API estate for platform teams.' }).returning())[0]!;
  await db.insert(projectCollaborators).values({ projectId: project.id, userId: user.id, role: 'admin' }).onConflictDoNothing();
  const names = ['User', 'Authentication', 'Payment', 'Order Management', 'Notification', 'Inventory', 'Shipping', 'Analytics'];
  for (let index = 0; index < names.length; index++) {
    const name = names[index]!; const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let [api] = await db.select().from(apis).where(and(eq(apis.projectId, project.id), eq(apis.slug, slug))).limit(1);
    if (!api) api = (await db.insert(apis).values({ projectId: project.id, name: `${name} API`, slug, description: `${name} capabilities for Acme products.`, lifecycle: index === 5 ? 'deprecated' : 'active', ownerUserId: user.id, createdAt: ago(11 - index), updatedAt: ago(index) }).returning())[0]!;
    for (const version of index % 3 === 0 ? ['v1', 'v2'] : ['v1']) {
      let [apiVersion] = await db.select().from(apiVersions).where(and(eq(apiVersions.apiId, api.id), eq(apiVersions.version, version))).limit(1);
      if (!apiVersion) apiVersion = (await db.insert(apiVersions).values({ apiId: api.id, version, status: version === 'v2' ? 'published' : 'deprecated', specificationFormat: 'openapi-json', sourceSpecificationVersion: '3.0.3', createdAt: ago(10 - index), updatedAt: ago(1), publishedAt: version === 'v2' ? ago(1) : null, deprecatedAt: version === 'v1' ? ago(2) : null }).returning())[0]!;
      const path = `/${slug}`; const [endpoint] = await db.select().from(apiEndpoints).where(and(eq(apiEndpoints.apiVersionId, apiVersion.id), eq(apiEndpoints.method, 'GET'), eq(apiEndpoints.path, path))).limit(1);
      if (!endpoint) await db.insert(apiEndpoints).values({ apiVersionId: apiVersion.id, method: 'GET', path, operationId: `get${name.replace(/\s/g, '')}`, summary: `Read ${name.toLowerCase()} data`, expectedStatusCodes: ['200'], createdAt: ago(9 - index), updatedAt: ago(1) });
      const seedKey = stable(`api:${project.id}:${slug}:${version}`); await db.insert(apiActivityEvents).values({ projectId: project.id, apiId: api.id, apiVersionId: apiVersion.id, actorUserId: user.id, eventType: version === 'v1' ? 'version_created' : 'version_published', summary: `${name} API ${version} registered`, seedKey, occurredAt: ago(10 - index) }).onConflictDoNothing();
    }
  }
  const all = await db.select().from(apis).where(eq(apis.projectId, project.id));
  for (let i = 0; i < all.length - 1; i++) { const [source] = await db.select().from(apiVersions).where(eq(apiVersions.apiId, all[i]!.id)).orderBy(apiVersions.createdAt).limit(1); const [target] = await db.select().from(apiVersions).where(eq(apiVersions.apiId, all[i + 1]!.id)).orderBy(apiVersions.createdAt).limit(1); if (source && target) await db.insert(apiDependencies).values({ sourceApiVersionId: source.id, targetApiVersionId: target.id, dependencyType: 'internal', relationship: 'calls', description: 'Seeded platform relationship', evidence: 'Acme integration map', reviewStatus: 'confirmed' }).onConflictDoNothing(); }
  console.log(`[Database] Seeded ${org.name} / ${project.name} with ${all.length} APIs.`);
}
seed().catch((error) => { console.error('[Database] Seed failed:', error); process.exitCode = 1; });
