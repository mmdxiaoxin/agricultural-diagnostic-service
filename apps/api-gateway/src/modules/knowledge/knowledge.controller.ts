import { Roles } from '@common/decorator/roles.decorator';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { KnowledgeService } from './knowledge.service';

@ApiTags('病害知识库管理')
@Controller('knowledge')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class KnowledgeController {
  constructor(private readonly KnowledgeService: KnowledgeService) {}
}
