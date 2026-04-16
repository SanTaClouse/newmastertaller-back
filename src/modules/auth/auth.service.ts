import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      withDeleted: false,
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const tenant = await this.tenantRepo.findOneOrFail({ where: { id: user.tenantId } });

    const payload = { sub: user.id, tenantId: user.tenantId, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      },
    };
  }

  async getMe(userId: string, tenantId: string) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    const tenant = await this.tenantRepo.findOneOrFail({ where: { id: tenantId } });
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      tenantId: user.tenantId,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  }
}
