import { RemoteInterface, RemoteService } from '@app/database/entities';
import { CreateRemoteInterfaceDto } from '@common/dto/remote/create-remote-interface.dto';
import { UpdateRemoteInterfaceDto } from '@common/dto/remote/update-remote-interface.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class RemoteInterfaceService {
  constructor(
    @InjectRepository(RemoteService)
    private serviceRepository: Repository<RemoteService>,
    @InjectRepository(RemoteInterface)
    private interfaceRepository: Repository<RemoteInterface>,
    private dataSource: DataSource,
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

  async copy(interfaceId: number): Promise<RemoteInterface> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const interface_ = await queryRunner.manager.findOne(RemoteInterface, {
        where: { id: interfaceId },
        relations: ['service'],
      });

      if (!interface_) {
        throw new RpcException({
          code: 404,
          message: '未找到当前接口',
        });
      }

      const { id, createdAt, updatedAt, ...interfaceData } = interface_;
      const newInterface = queryRunner.manager.create(RemoteInterface, {
        ...interfaceData,
        name: `${interfaceData.name}_copy`,
      });

      const savedInterface = await queryRunner.manager.save(newInterface);
      await queryRunner.commitTransaction();
      return savedInterface;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '复制接口失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }
}
