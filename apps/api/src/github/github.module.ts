import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { GithubController } from './github.controller.js';
import { GithubService } from './github.service.js';
@Module({ imports: [AccessModule, AuthModule], controllers: [GithubController], providers: [GithubService] }) export class GithubModule {}
