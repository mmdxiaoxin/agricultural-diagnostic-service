import { Roles } from '@common/decorator/roles.decorator';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { Role } from '@shared/enum/role.enum';
import { TypeormFilter } from '@common/filters/typeorm.filter';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { formatResponse } from '@shared/helpers/response.helper';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
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
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { UpdatePasswordDto } from './dto/change-pass.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-pass.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('用户模块')
@Controller('user')
@UseGuards(AuthGuard)
@UseFilters(TypeormFilter)
export class UserController {
  constructor(private readonly userService: UserService) {}
  // 获取个人信息
  @Get('profile')
  async profileGet(@Req() req: Request) {
    return this.userService.profileGet(req.user.userId);
  }

  // 更新个人信息
  @Put('profile')
  async profileUpdate(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.profileUpdate(req.user.userId, updateProfileDto);
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
      new FileSizeValidationPipe('10MB'),
      new FileTypeValidationPipe([MIME_TYPE.PNG, MIME_TYPE.JPEG]),
    )
    file: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(req.user.userId, file);
  }

  // 获取个人头像
  @Get('avatar')
  async getAvatar(@Req() req: Request, @Res() res: Response) {
    const avatarPath = await this.userService.getAvatar(req.user.userId);
    if (avatarPath) {
      const filePath = join(process.cwd(), avatarPath);
      if (!existsSync(filePath)) {
        throw new BadRequestException('头像文件不存在');
      }
      // 以文件流方式返回头像
      return res.sendFile(filePath);
    } else {
      return formatResponse(404, null, '头像不存在');
    }
  }

  // 修改密码
  @Put('reset/password')
  async updatePassword(
    @Req() req: Request<null, any, UpdatePasswordDto>,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(
      req.user.userId,
      updatePasswordDto.confirmPassword,
    );
  }

  // 退出登陆
  @Post('logout')
  async logout() {
    return formatResponse(200, null, '退出登录成功');
  }

  // 获取用户列表 (需要管理员权限)
  @Get('list')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userListGet(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('username') username?: string,
    @Query('name') name?: string,
    @Query('phone') phone?: string,
    @Query('address') address?: string,
  ) {
    return this.userService.userListGet(page, pageSize, {
      username,
      name,
      phone,
      address,
    });
  }

  // 创建单个用户 (需要管理员权限)
  @Post('create')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async userCreate(@Body() createUserDto: CreateUserDto) {
    const { profile, ...user } = createUserDto;
    await this.userService.setRoles(user as any);
    await this.userService.userCreate(user as any, profile);
    return formatResponse(201, null, '用户创建成功');
  }

  // 获取单个用户信息 (需要管理员权限)
  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userGet(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.userService.userGet(id);
  }

  // 删除单个用户信息 (需要管理员权限)
  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async userDelete(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.userService.userDelete(id);
  }

  // 更新单个用户 (需要管理员权限)
  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userUpdate(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.userUpdate(id, updateUserDto);
  }

  // 重置用户密码 (需要管理员权限)
  @Put(':id/reset/password')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userReset(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.userService.userReset(id, resetPasswordDto.password);
  }
}
