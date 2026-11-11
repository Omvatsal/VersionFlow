import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectsController } from './projects.controller.js';
@Module({ imports: [AccessModule, AuthModule], controllers: [ProjectsController] }) export class ProjectsModule {}
