import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { LoginDto, RegisterDto } from 'src/common/dto/auth.dto';
import { User } from 'src/common/models/user.model';
import bcrypt from 'bcryptjs';
import { Role } from 'src/common/models/role.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Role)
    private roleModel: typeof Role,
  ) {}

  async create({ email, password }: RegisterDto) {
    const user = await this.userModel.findOne({ where: { email } });
    if (user) {
      throw new Error('User already exists');
    }
    const role = await this.roleModel.findOne({ where: { name: 'user' } });
    if (!role) {
      throw new Error('Role not found');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User();
    newUser.email = email;
    newUser.password = hashedPassword;
    newUser.role_id = role.id;
    return newUser.save();
  }

  async getUserById(id: number) {
    return this.userModel.findOne({ where: { id } });
  }

  async getUserByEmail(email: string) {
    return this.userModel.findOne({ where: { email } });
  }

  async getAllUsers() {
    return this.userModel.findAll();
  }

  async update(id: number, data) {
    return this.userModel.update(data, { where: { id } });
  }

  async remove(id: number) {
    await this.userModel.destroy({ where: { id } });
  }

  async validateUser({ login }: LoginDto) {
    const user = await this.userModel.findOne({
      where: {
        [Op.or]: [{ username: login }, { email: login }],
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === 0) {
      throw new Error('User is not activated');
    }

    return user;
  }
}
