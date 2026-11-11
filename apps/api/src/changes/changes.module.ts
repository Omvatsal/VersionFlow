import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ChangesController } from './changes.controller.js';
import { ChangesService } from './changes.service.js';

@Module({ imports: [AccessModule, AuthModule], controllers: [ChangesController], providers: [ChangesService] })
export class ChangesModule {}
