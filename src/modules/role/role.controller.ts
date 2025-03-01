import { AuthGuard } from '@/common/guards/auth.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';

@Controller('role')
@UseGuards(AuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
  @Get('dict')
  async dict() {
    const dict = await this.roleService.findDict();
    return {
      code: 200,
      data: dict,
      message: '获取角色字典成功',
    };
  }
}
