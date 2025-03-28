import { RemoteInterface, RemoteService } from '@app/database/entities';
import { CreateRemoteInterfaceDto } from '@common/dto/remote/create-remote-interface.dto';
import { UpdateRemoteInterfaceDto } from '@common/dto/remote/update-remote-interface.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RemoteInterfaceService {
  constructor(
    @InjectRepository(RemoteService)
    private serviceRepository: Repository<RemoteService>,
    @InjectRepository(RemoteInterface)
    private interfaceRepository: Repository<RemoteInterface>,
  ) {}

  async getInterfaces(serviceId: number) {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['interfaces'],
    });
    return service?.interfaces;
  }

  async getInterfacesList(serviceId: number, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await this.interfaceRepository.findAndCount({
      where: { serviceId },
      skip,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async getInterfaceById(interfaceId: number) {
    return this.interfaceRepository.findOne({
      where: { id: interfaceId },
    });
  }

  async createInterface(serviceId: number, dto: CreateRemoteInterfaceDto) {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new RpcException({
        code: 404,
        message: '未找到当前服务',
      });
    }
    const interface_ = this.interfaceRepository.create({
      ...dto,
      service,
    });
    return this.interfaceRepository.save(interface_);
  }

  async updateInterface(interfaceId: number, dto: UpdateRemoteInterfaceDto) {
    const interface_ = await this.interfaceRepository.findOne({
      where: { id: interfaceId },
    });
    if (!interface_) {
      throw new RpcException({
        code: 404,
        message: '未找到当前接口',
      });
    }
    Object.assign(interface_, dto);
    return this.interfaceRepository.save(interface_);
  }

  async removeInterface(interfaceId: number) {
    const interface_ = await this.interfaceRepository.findOne({
      where: { id: interfaceId },
    });
    if (!interface_) {
      throw new RpcException({
        code: 404,
        message: '未找到当前接口',
      });
    }
    return this.interfaceRepository.delete(interfaceId);
  }
}
