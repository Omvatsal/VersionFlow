import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

const timestamps = { createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull() };
export const organizationType = pgEnum('organization_type', ['personal', 'team']);
export const membershipRole = pgEnum('membership_role', ['owner', 'admin', 'member']);
export const projectRole = pgEnum('project_role', ['admin', 'editor', 'viewer']);
export const authProvider = pgEnum('auth_provider', ['google', 'github']);

export const users = pgTable('users', { id: uuid('id').defaultRandom().primaryKey(), email: text('email').notNull(), name: text('name').notNull(), passwordHash: text('password_hash').notNull(), ...timestamps }, (t) => [uniqueIndex('users_email_unique').on(t.email)]);
export const oauthAccounts = pgTable('oauth_accounts', { id: uuid('id').defaultRandom().primaryKey(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), provider: authProvider('provider').notNull(), providerAccountId: text('provider_account_id').notNull(), providerEmail: text('provider_email').notNull(), providerUsername: text('provider_username'), profileUrl: text('profile_url'), avatarUrl: text('avatar_url'), ...timestamps }, (t) => [uniqueIndex('oauth_provider_account_unique').on(t.provider, t.providerAccountId), uniqueIndex('oauth_user_provider_unique').on(t.userId, t.provider), index('oauth_user_idx').on(t.userId)]);
export const sessions = pgTable('sessions', { id: uuid('id').defaultRandom().primaryKey(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), tokenHash: text('token_hash').notNull(), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), revokedAt: timestamp('revoked_at', { withTimezone: true }), ...timestamps }, (t) => [uniqueIndex('sessions_token_hash_unique').on(t.tokenHash), index('sessions_user_idx').on(t.userId)]);
export const organizations = pgTable('organizations', { id: uuid('id').defaultRandom().primaryKey(), name: text('name').notNull(), slug: text('slug').notNull(), type: organizationType('type').notNull(), createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }), ...timestamps }, (t) => [uniqueIndex('organizations_slug_unique').on(t.slug), index('organizations_creator_idx').on(t.createdBy)]);
export const organizationMemberships = pgTable('organization_memberships', { id: uuid('id').defaultRandom().primaryKey(), organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), role: membershipRole('role').notNull().default('member'), ...timestamps }, (t) => [uniqueIndex('organization_membership_unique').on(t.organizationId, t.userId), index('memberships_user_idx').on(t.userId), index('memberships_org_idx').on(t.organizationId)]);
export const projects = pgTable('projects', { id: uuid('id').defaultRandom().primaryKey(), organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }), name: text('name').notNull(), slug: text('slug').notNull(), description: text('description'), ...timestamps }, (t) => [uniqueIndex('projects_org_slug_unique').on(t.organizationId, t.slug), index('projects_org_idx').on(t.organizationId)]);
export const projectCollaborators = pgTable('project_collaborators', { id: uuid('id').defaultRandom().primaryKey(), projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), role: projectRole('role').notNull().default('viewer'), ...timestamps }, (t) => [uniqueIndex('project_collaborator_unique').on(t.projectId, t.userId), index('collaborators_user_idx').on(t.userId), index('collaborators_project_idx').on(t.projectId)]);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type OauthAccount = typeof oauthAccounts.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectCollaborator = typeof projectCollaborators.$inferSelect;
