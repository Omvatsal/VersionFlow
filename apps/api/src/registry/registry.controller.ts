import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { apiContractSnapshots, apiEndpoints, apiVersions, apis, getDatabaseConnection, specificationImports } from '@versionflow/database';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { AccessService } from '../access/access.service.js';
import { SpecificationService } from './specification.service.js';

const apiSchema = z.object({ name: z.string().min(1).max(120), description: z.string().max(1000).optional(), baseUrl: z.string().url().optional(), protocol: z.string().max(30).optional(), documentationUrl: z.string().url().optional(), tags: z.array(z.string().max(80)).optional() });
const versionSchema = z.object({ version: z.string().min(1).max(80), specification: z.string().optional(), specificationFormat: z.string().default('xml') });
const endpointSchema = z.object({ method: z.string().min(1).max(12), path: z.string().min(1).max(500), operationId: z.string().max(200).optional(), summary: z.string().max(500).optional(), parameters: z.unknown().optional(), requestSchema: z.unknown().optional(), responseSchema: z.unknown().optional(), security: z.unknown().optional(), expectedStatusCodes: z.array(z.string()).optional() });
const importPreviewSchema = z.object({ filename: z.string().min(1).max(255), content: z.string().min(1).max(5_000_000) });
const importRegisterSchema = z.object({ importId: z.string().uuid(), selectedOperations: z.array(z.number().int().nonnegative()).optional(), apiName: z.string().min(1).max(120).optional(), apiSlug: z.string().max(120).optional(), apiVersion: z.string().min(1).max(80).optional() });

@UseGuards(AuthGuard)
@Controller('projects/:projectId/apis')
export class RegistryController {
  constructor(private readonly access: AccessService, private readonly specifications: SpecificationService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string) {
    await this.access.projectAccess(req.user.id, projectId);
    return getDatabaseConnection().db.select().from(apis).where(eq(apis.projectId, projectId));
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Body() body: unknown) {
    await this.access.projectAccess(req.user.id, projectId, 'editor');
    const input = apiSchema.parse(body);
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [api] = await getDatabaseConnection().db.insert(apis).values({ projectId, name: input.name, slug, description: input.description, baseUrl: input.baseUrl, protocol: input.protocol, documentationUrl: input.documentationUrl, tags: input.tags, ownerUserId: req.user.id }).returning();
    return api;
  }

  @Get(':apiId/versions')
  async versions(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Param('apiId') apiId: string) {
    await this.access.projectAccess(req.user.id, projectId);
    const db = getDatabaseConnection().db;
    const [api] = await db.select({ id: apis.id }).from(apis).where(and(eq(apis.id, apiId), eq(apis.projectId, projectId)));
    if (!api) return [];
    return db.select().from(apiVersions).where(eq(apiVersions.apiId, apiId));
  }

  @Post(':apiId/versions')
  async createVersion(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Param('apiId') apiId: string, @Body() body: unknown) {
    await this.access.projectAccess(req.user.id, projectId, 'editor');
    const input = versionSchema.parse(body);
    const db = getDatabaseConnection().db;
    const [api] = await db.select({ id: apis.id }).from(apis).where(and(eq(apis.id, apiId), eq(apis.projectId, projectId)));
    if (!api) throw new Error('API not found in project');
    const [version] = await db.insert(apiVersions).values({ apiId, version: input.version, specification: input.specification, specificationFormat: input.specificationFormat }).returning();
    if (version) await db.insert(apiContractSnapshots).values({ apiVersionId: version.id, specificationFormat: input.specificationFormat, checksum: this.specifications.checksum(input.specification || ''), originalDocument: input.specification || null, normalizedContract: { api: { id: apiId }, endpoints: [] } });
    return version;
  }

  @Get(':apiId/versions/:versionId/contract')
  async contract(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Param('apiId') apiId: string, @Param('versionId') versionId: string) {
    await this.access.projectAccess(req.user.id, projectId);
    const db = getDatabaseConnection().db;
    const [snapshot] = await db.select({ snapshot: apiContractSnapshots, version: apiVersions, api: apis }).from(apiContractSnapshots).innerJoin(apiVersions, eq(apiVersions.id, apiContractSnapshots.apiVersionId)).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(and(eq(apiContractSnapshots.apiVersionId, versionId), eq(apiVersions.apiId, apiId), eq(apis.projectId, projectId))).limit(1);
    const [versionRow] = await db.select({ version: apiVersions, api: apis }).from(apiVersions).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(and(eq(apiVersions.id, versionId), eq(apiVersions.apiId, apiId), eq(apis.projectId, projectId))).limit(1);
    if (!snapshot && !versionRow) throw new Error('API contract not found in project');
    const endpoints = await db.select().from(apiEndpoints).where(eq(apiEndpoints.apiVersionId, versionId));
    if (snapshot) return { ...snapshot, endpoints };
    if (!versionRow) throw new Error('API contract version not found in project');
    return { snapshot: { id: `legacy-${versionId}`, apiVersionId: versionId, specificationFormat: versionRow.version.specificationFormat, sourceSpecificationVersion: versionRow.version.sourceSpecificationVersion, checksum: this.specifications.checksum(versionRow.version.specification || ''), originalDocument: versionRow.version.specification, normalizedContract: { endpoints }, createdAt: versionRow.version.createdAt }, version: versionRow.version, api: versionRow.api, endpoints };
  }

  @Post(':apiId/versions/:versionId/endpoints')
  async addEndpoint(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Param('apiId') apiId: string, @Param('versionId') versionId: string, @Body() body: unknown) {
    await this.access.projectAccess(req.user.id, projectId, 'editor');
    const input = endpointSchema.parse(body);
    const db = getDatabaseConnection().db;
    const [version] = await db.select({ id: apiVersions.id }).from(apiVersions).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(and(eq(apiVersions.id, versionId), eq(apiVersions.apiId, apiId), eq(apis.projectId, projectId)));
    if (!version) throw new Error('API version not found in project');
    const [endpoint] = await db.insert(apiEndpoints).values({ apiVersionId: versionId, method: input.method.toUpperCase(), path: input.path, operationId: input.operationId, summary: input.summary, parameters: input.parameters, requestSchema: input.requestSchema, responseSchema: input.responseSchema, security: input.security, expectedStatusCodes: input.expectedStatusCodes }).returning();
    const [snapshot] = await db.select().from(apiContractSnapshots).where(eq(apiContractSnapshots.apiVersionId, versionId)).limit(1);
    if (snapshot) { const contract = snapshot.normalizedContract as { endpoints?: unknown[] }; await db.update(apiContractSnapshots).set({ normalizedContract: { ...contract, endpoints: [...(contract.endpoints || []), endpoint] }, updatedAt: new Date() }).where(eq(apiContractSnapshots.id, snapshot.id)); }
    return endpoint;
  }

  @Get(':apiId/versions/:versionId/endpoints')
  async endpoints(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Param('apiId') apiId: string, @Param('versionId') versionId: string) {
    await this.access.projectAccess(req.user.id, projectId);
    const db = getDatabaseConnection().db;
    const [version] = await db.select({ id: apiVersions.id }).from(apiVersions).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(and(eq(apiVersions.id, versionId), eq(apiVersions.apiId, apiId), eq(apis.projectId, projectId)));
    if (!version) return [];
    return db.select().from(apiEndpoints).where(eq(apiEndpoints.apiVersionId, versionId));
  }

  @Post('imports/preview')
  async previewImport(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Body() body: unknown) {
    await this.access.projectAccess(req.user.id, projectId, 'editor');
    const input = importPreviewSchema.parse(body);
    const normalized = this.specifications.parse(input.filename, input.content);
    const db = getDatabaseConnection().db;
    const checksum = this.specifications.checksum(input.content);
    const [record] = await db.insert(specificationImports).values({ projectId, createdBy: req.user.id, originalFilename: input.filename, format: normalized.format, sourceSpecificationVersion: normalized.sourceVersion, checksum, content: input.content, validationResult: { externalReferences: normalized.externalReferences, operationCount: normalized.operations.length }, status: 'preview' }).onConflictDoNothing().returning();
    const existing = record || (await db.select().from(specificationImports).where(and(eq(specificationImports.projectId, projectId), eq(specificationImports.checksum, checksum))).limit(1))[0];
    return { import: existing, specification: { ...normalized, raw: undefined } };
  }

  @Post('imports/register')
  async registerImport(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string, @Body() body: unknown) {
    await this.access.projectAccess(req.user.id, projectId, 'editor');
    const input = importRegisterSchema.parse(body);
    const db = getDatabaseConnection().db;
    const [record] = await db.select().from(specificationImports).where(and(eq(specificationImports.id, input.importId), eq(specificationImports.projectId, projectId))).limit(1);
    if (!record?.content) throw new Error('Import preview was not found or has expired');
    const normalized = this.specifications.parse(record.originalFilename, record.content);
    const indexes = input.selectedOperations || normalized.operations.map((_, index) => index);
    const operations = indexes.map((index) => normalized.operations[index]).filter((operation): operation is NonNullable<typeof operation> => Boolean(operation));
    if (!operations.length) throw new Error('Select at least one valid operation');
    const result = await db.transaction(async (tx) => {
      const name = input.apiName || normalized.title;
      const slug = input.apiSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const [existing] = await tx.select().from(apis).where(and(eq(apis.projectId, projectId), eq(apis.slug, slug))).limit(1);
      const api = existing || (await tx.insert(apis).values({ projectId, name, slug, description: normalized.description, baseUrl: normalized.baseUrl, protocol: normalized.protocol, tags: normalized.tags, ownerUserId: req.user.id }).returning())[0];
      if (!api) throw new Error('API registration failed');
      const versionValue = input.apiVersion || normalized.apiVersion;
      const [existingVersion] = await tx.select().from(apiVersions).where(and(eq(apiVersions.apiId, api.id), eq(apiVersions.version, versionValue))).limit(1);
      if (existingVersion) throw new Error(`API version ${versionValue} already exists; choose a new version to preserve history`);
      const [version] = await tx.insert(apiVersions).values({ apiId: api.id, version: versionValue, sourceSpecificationVersion: normalized.sourceVersion, specificationFormat: normalized.format, specification: record.content }).returning();
      if (!version) throw new Error('API version registration failed');
      await tx.insert(apiContractSnapshots).values({ apiVersionId: version.id, originalFilename: record.originalFilename, specificationFormat: normalized.format, sourceSpecificationVersion: normalized.sourceVersion, checksum: record.checksum, originalDocument: record.content, normalizedContract: normalized.contract });
      await tx.insert(apiEndpoints).values(operations.map((operation) => ({ apiVersionId: version.id, method: operation.method, path: operation.path, operationId: operation.operationId, summary: operation.description || operation.name, parameters: operation.parameters, requestSchema: operation.requestSchema, responseSchema: operation.responseSchema, security: operation.security, expectedStatusCodes: operation.expectedStatusCodes })));
      await tx.update(specificationImports).set({ status: 'registered', registeredApiId: api.id, registeredVersionId: version.id, updatedAt: new Date() }).where(eq(specificationImports.id, record.id));
      return { api, version };
    });
    return { ...result, registeredOperations: operations.length };
  }
}
