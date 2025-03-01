import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  // 获取个人信息
  @Get('profile')
  async profileGet() {
    return 'Get user profile';
  }

  // 更新个人信息
  @Put('profile')
  async profileUpdate(@Body() updateProfileDto: any) {
    return 'Update user profile';
  }

  // 上传个人头像
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!fs.existsSync('uploads/avatar')) {
            fs.mkdirSync('uploads/avatar', { recursive: true });
          }
          cb(null, 'uploads/avatar');
        },
        filename: (req, file, cb) => {
          const uniquePrefix = uuidv4();
          const fileExtension = path.extname(file.originalname);
          cb(null, `${uniquePrefix}${fileExtension}`);
        },
      }),
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return 'Avatar uploaded';
  }

  // 获取个人头像
  @Get('avatar')
  async getAvatar() {
    return 'Get user avatar';
  }

  // 修改密码
  @Put('reset/password')
  async changePassword(@Body() changePasswordDto: any) {
    return 'Password updated';
  }

  // 退出登陆
  @Post('logout')
  async logout() {
    return 'User logged out';
  }

  // 获取用户列表 (需要管理员权限)
  @Get('list')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard) // Assuming RolesGuard handles role-based access control
  async userListGet() {
    return 'Get users list';
  }

  // 创建单个用户 (需要管理员权限)
  @Post('create')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userCreate(@Body() createUserDto: any) {
    return 'User created';
  }

  // 获取单个用户信息 (需要管理员权限)
  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userGet(@Param('id') id: string) {
    return `Get user with id ${id}`;
  }

  // 删除单个用户信息 (需要管理员权限)
  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userDelete(@Param('id') id: string) {
    return `Delete user with id ${id}`;
  }

  // 更新单个用户 (需要管理员权限)
  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userUpdate(@Param('id') id: string, @Body() updateUserDto: any) {
    return `Update user with id ${id}`;
  }

  // 重置用户密码 (需要管理员权限)
  @Put(':id/reset/password')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async resetPassword(@Param('id') id: string, @Body() resetPasswordDto: any) {
    return `Reset password for user with id ${id}`;
  }
}
