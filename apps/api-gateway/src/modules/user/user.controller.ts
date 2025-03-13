import { Roles } from '@common/decorator/roles.decorator';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { Role } from '@shared/enum/role.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { Request, Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { defaultIfEmpty, lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { UpdatePasswordDto } from './dto/change-pass.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-pass.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('用户模块')
@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(
    @Inject(USER_SERVICE_NAME) private readonly userClient: ClientProxy,
  ) {}

  // HTTP GET /user/profile —— 获取个人信息
  @Get('profile')
  async profileGet(@Req() req: Request) {
    const payload = { userId: req.user.userId };
    const result = await lastValueFrom(
      this.userClient.send({ cmd: 'user.profile.get' }, payload),
    );
    return formatResponse(200, result, '获取个人信息成功');
  }

  // HTTP PUT /user/profile —— 更新个人信息
  @Put('profile')
  async profileUpdate(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const payload = { userId: req.user.userId, dto: updateProfileDto };
    const result = await lastValueFrom(
      this.userClient.send({ cmd: 'user.profile.update' }, payload),
    );
    return formatResponse(200, result, '更新个人信息成功');
  }

  // HTTP POST /user/avatar —— 上传个人头像
  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile(
      new FileSizeValidationPipe('1MB'),
      new FileTypeValidationPipe([MIME_TYPE.PNG, MIME_TYPE.JPEG]),
    )
    file: Express.Multer.File,
  ) {
    try {
      await lastValueFrom(
        this.userClient
          .send(
            { cmd: 'user.avatar.upload' },
            {
              userId: req.user.userId,
              fileData: file.buffer.toString('base64'),
              mimetype: file.mimetype,
            },
          )
          .pipe(defaultIfEmpty(null)),
      );
      return formatResponse(200, null, '上传头像成功');
    } catch (error) {
      throw error;
    }
  }

  // HTTP GET /user/avatar —— 获取个人头像
  @Get('avatar')
  async getAvatar(@Req() req: Request, @Res() res: Response) {
    const avatarPath = await lastValueFrom(
      this.userClient.send(
        { cmd: 'user.avatar.get' },
        { userId: req.user.userId },
      ),
    );
    if (avatarPath) {
      if (!existsSync(avatarPath)) {
        throw new BadRequestException('头像文件不存在');
      }
      return res.sendFile(avatarPath);
    } else {
      return formatResponse(404, null, '头像不存在');
    }
  }

  // HTTP PUT /user/reset/password —— 修改密码
  @Put('reset/password')
  async updatePassword(
    @Req() req: Request,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const payload = { userId: req.user.userId, dto: updatePasswordDto };
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.password.update' }, payload)
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(200, null, '修改密码成功');
  }

  // HTTP POST /user/logout —— 退出登录
  @Post('logout')
  async logout() {
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.logout' }, {})
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(200, null, '退出登录成功');
  }

  // HTTP GET /user/list —— 获取用户列表（需要管理员权限）
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
    const payload = { page, pageSize, username, name, phone, address };
    const result = await lastValueFrom(
      this.userClient.send({ cmd: 'user.list.get' }, payload),
    );
    return formatResponse(200, result, '获取用户列表成功');
  }

  // HTTP POST /user/create —— 创建单个用户（需要管理员权限）
  @Post('create')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async userCreate(@Body() createUserDto: CreateUserDto) {
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.create' }, createUserDto)
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(201, null, '创建用户成功');
  }

  // HTTP GET /user/:id —— 获取单个用户信息（需要管理员权限）
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
    const payload = { id };
    const result = await lastValueFrom(
      this.userClient.send({ cmd: 'user.get' }, payload),
    );
    return formatResponse(200, result, '获取用户信息成功');
  }

  // HTTP DELETE /user/:id —— 删除单个用户（需要管理员权限）
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
    const payload = { id };
    return this.userClient
      .send({ cmd: 'user.delete' }, payload)
      .pipe(defaultIfEmpty(null));
  }

  // HTTP PUT /user/:id —— 更新单个用户（需要管理员权限）
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
    const payload = { id, dto: updateUserDto };
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.update' }, payload)
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(200, null, '更新用户信息成功');
  }

  // HTTP PUT /user/:id/reset/password —— 重置用户密码（需要管理员权限）
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
    const payload = { id, dto: resetPasswordDto };
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.password.reset' }, payload)
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(200, null, '重置用户密码成功');
  }
}
