import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { TypeormFilter } from '@/common/filters/typeorm.filter';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { formatResponse } from '@/common/helpers/response.helper';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  AvatarSizeValidationPipe,
  AvatarTypeValidationPipe,
} from './pipe/avatar.pipe';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(AuthGuard)
@UseFilters(TypeormFilter)
export class UserController {
  constructor(private readonly userService: UserService) {}
  // 获取个人信息
  @Get('profile')
  async profileGet(@Req() req: Request) {
    try {
      const profile = await this.userService.getProfile(req.user.userId, req);
      return formatResponse(200, profile, '个人信息获取成功');
    } catch (error) {
      throw error;
    }
  }

  // 更新个人信息
  @Put('profile')
  async profileUpdate(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      await this.userService.updateProfile(req.user.userId, updateProfileDto);
      return formatResponse(200, null, '个人信息更新成功');
    } catch (error) {
      throw error;
    }
  }

  // 上传个人头像
  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!existsSync('uploads/avatar')) {
            mkdirSync('uploads/avatar', { recursive: true });
          }
          cb(null, 'uploads/avatar');
        },
        filename: (req, file, cb) => {
          const uniquePrefix = uuidv4();
          const fileExtension = extname(file.originalname);
          cb(null, `${uniquePrefix}${fileExtension}`);
        },
      }),
    }),
  )
  async uploadAvatar(
    @Req() req,
    @UploadedFile(
      new AvatarSizeValidationPipe(),
      new AvatarTypeValidationPipe(),
    )
    file: Express.Multer.File,
  ) {
    try {
      await this.userService.updateAvatar(req.user.userId, file);
      return formatResponse(HttpStatus.OK, null, '头像上传成功');
    } catch (error) {
      throw error;
    }
  }

  // 获取个人头像
  @Get('avatar/:token')
  async getAvatar(@Param('token') token: string, @Res() res: Response) {
    try {
      const avatarPath = await this.userService.getAvatar(token);
      const filePath = join(process.cwd(), avatarPath);
      if (!existsSync(filePath)) {
        throw new BadRequestException('头像文件不存在');
      }
      // 以文件流方式返回头像
      return res.sendFile(filePath);
    } catch (error) {
      throw error;
    }
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
