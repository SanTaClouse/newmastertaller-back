import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class ClientsService {
  constructor(@InjectRepository(Client) private repo: Repository<Client>) {}

  async findAll(page = 1, limit = 20, search?: string) {
    const tenantId = TenantContext.getTenantId();
    const qb = this.repo.createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(c.fullName ILIKE :s OR c.phone ILIKE :s OR c.email ILIKE :s)', { s: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    const client = await this.repo.findOne({ where: { id, tenantId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async create(dto: CreateClientDto) {
    const tenantId = TenantContext.getTenantId();
    const client = this.repo.create({ ...dto, tenantId });
    return this.repo.save(client);
  }

  async update(id: string, dto: UpdateClientDto) {
    const client = await this.findOne(id);
    Object.assign(client, dto);
    return this.repo.save(client);
  }

  async remove(id: string) {
    const client = await this.findOne(id);
    await this.repo.softDelete(client.id);
    return { message: 'Cliente eliminado' };
  }
}
