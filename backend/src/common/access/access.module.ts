import { Global, Module } from '@nestjs/common';
import { RoleAccessService } from './role-access.service';

@Global()
@Module({
  providers: [RoleAccessService],
  exports: [RoleAccessService],
})
export class AccessModule {}
