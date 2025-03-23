import { Roles } from '@common/decorator/roles.decorator';
import { UpdatePasswordDto } from '@common/dto/user/change-pass.dto';
import { CreateUserDto } from '@common/dto/user/create-user.dto';
import { ResetPasswordDto } from '@common/dto/user/reset-pass.dto';
import { UpdateProfileDto } from '@common/dto/user/update-profile.dto';
import { UpdateUserDto } from '@common/dto/user/update-user.dto';
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
import { ApiTags } from '@nestjs/swagger';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { Role } from '@shared/enum/role.enum';
import { Request, Response } from 'express';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { UserService } from './user.service';

@ApiTags('用户模块')
@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async profileGet(@Req() req: Request) {
    return this.userService.getProfile(req.user.userId);
  }

  @Put('profile')
  async profileUpdate(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

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
    return this.userService.uploadAvatar(req.user.userId, file);
  }

  @Get('avatar')
  async getAvatar(@Req() req: Request, @Res() res: Response) {
    return this.userService.getAvatar(req.user.userId, res);
  }

  @Put('reset/password')
  async updatePassword(@Req() req: Request, @Body() dto: UpdatePasswordDto) {
    return this.userService.updatePassword(req.user.userId, dto);
  }

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
    return this.userService.getUserList({
      page,
      pageSize,
      username,
      name,
      phone,
      address,
    });
  }

  @Post('create')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userCreate(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userGet(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUser(id);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async userDelete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }

  @Put(':id')
  async userUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, dto);
  }

  @Put(':id/reset/password')
  async userReset(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.userService.resetUserPassword(id, dto);
  }
}
