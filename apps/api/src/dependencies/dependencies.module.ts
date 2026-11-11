import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DependenciesController } from './dependencies.controller.js';
@Module({ imports: [AccessModule, AuthModule], controllers: [DependenciesController] }) export class DependenciesModule {}
