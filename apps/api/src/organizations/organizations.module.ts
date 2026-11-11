import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { OrganizationsController } from './organizations.controller.js';
@Module({ imports: [AccessModule, AuthModule], controllers: [OrganizationsController] }) export class OrganizationsModule {}
