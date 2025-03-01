import { AuthGuard } from '@/common/guards/auth.guard';
import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { TypeormFilter } from '@/common/filters/typeorm.filter';
import { formatResponse } from '@/common/helpers/response.helper';

@Controller('role')
@UseGuards(AuthGuard)
@UseFilters(TypeormFilter)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
  @Get('dict')
  async dict() {
    const dict = await this.roleService.findDict();
    return formatResponse(200, dict, '角色字典获取成功');
  }
}
