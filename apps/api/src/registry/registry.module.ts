import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RegistryController } from './registry.controller.js';
import { SpecificationService } from './specification.service.js';
@Module({ imports: [AccessModule, AuthModule], controllers: [RegistryController], providers: [SpecificationService] }) export class RegistryModule {}
