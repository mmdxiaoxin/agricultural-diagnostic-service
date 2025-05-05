import { Roles } from '@common/decorator/roles.decorator';
import {
  ApiErrorResponse,
  ApiResponse,
  ApiNullResponse,
  ApiBinaryResponse,
} from '@common/decorator/api-response.decorator';
import { UpdatePasswordDto } from '@common/dto/user/change-pass.dto';
import { CreateUserDto } from '@common/dto/user/create-user.dto';
import { ResetPasswordDto } from '@common/dto/user/reset-pass.dto';
import { UpdateProfileDto } from '@common/dto/user/update-profile.dto';
import { UpdateUserStatusDto } from '@common/dto/user/update-user-status.dto';
import { UpdateUserDto } from '@common/dto/user/update-user.dto';
import { UserPageQueryDto } from '@common/dto/user/user-page-query.dto';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { Role } from '@shared/enum/role.enum';
import { Request, Response } from 'express';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { UserService } from './user.service';

@ApiTags('用户模块')
@Controller('user')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({
    summary: '获取用户资料',
    description: '获取当前登录用户的个人资料',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async profileGet(@Req() req: Request) {
    return this.userService.getProfile(req.user.userId);
  }

  @Put('profile')
  @ApiOperation({
    summary: '更新用户资料',
    description: '更新当前登录用户的个人资料',
  })
  @ApiResponse(HttpStatus.OK, '更新成功', UpdateProfileDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async profileUpdate(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传头像', description: '上传当前登录用户的头像' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '头像图片（支持PNG、JPEG格式，最大1MB）',
        },
      },
    },
  })
  @ApiResponse(HttpStatus.OK, '上传成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '文件格式或大小不符合要求')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile(
      new FileSizeValidationPipe('1MB'),
      new FileTypeValidationPipe([MIME_TYPE.PNG, MIME_TYPE.JPEG]),
    )
    file: Express.Multer.File,
  ) {
    return this.userService.uploadAvatar(req.user.userId, file);
  }

  @Get('avatar')
  @ApiOperation({ summary: '获取头像', description: '获取当前登录用户的头像' })
  @ApiBinaryResponse(HttpStatus.OK, '获取成功', 'image/*')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '头像不存在')
  async getAvatar(@Req() req: Request, @Res() res: Response) {
    return this.userService.getAvatar(req.user.userId, res);
  }

  @Put('reset/password')
  @ApiOperation({ summary: '修改密码', description: '修改当前登录用户的密码' })
  @ApiResponse(HttpStatus.OK, '修改成功', UpdatePasswordDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async updatePassword(@Req() req: Request, @Body() dto: UpdatePasswordDto) {
    return this.userService.updatePassword(req.user.userId, dto);
  }

  @Get('list')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '获取用户列表',
    description: '分页获取系统中的用户列表（仅管理员可访问）',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async userListGet(@Query() query: UserPageQueryDto) {
    return this.userService.getUserList(query);
  }

  @Post('create')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '创建用户',
    description: '创建新用户（仅管理员可访问）',
  })
  @ApiResponse(HttpStatus.CREATED, '创建成功', CreateUserDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async userCreate(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '获取用户信息',
    description: '获取指定用户的详细信息（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '用户不存在')
  async userGet(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUser(id);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '删除用户',
    description: '删除指定的用户（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '用户不存在')
  async userDelete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }

  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '更新用户信息',
    description: '更新指定用户的信息（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功', UpdateUserDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '用户不存在')
  async userUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, dto);
  }

  @Put(':id/status')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '更新用户状态',
    description: '更新指定用户的状态（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功', UpdateUserStatusDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '用户不存在')
  async userStatusUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserStatus(id, dto);
  }

  @Put(':id/reset/password')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '重置用户密码',
    description: '重置指定用户的密码（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '重置成功', ResetPasswordDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '用户不存在')
  async userReset(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.userService.resetUserPassword(id, dto);
  }
}
