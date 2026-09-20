import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CompanyResponse } from '@app/shared';
import { Company } from './entities/company.entity.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
  ) {}

  async findAll(): Promise<CompanyResponse[]> {
    const rows = await this.companies.find({ order: { createdAt: 'DESC' } });
    return rows.map((c) => CompanyService.toResponse(c));
  }

  async findOne(id: string): Promise<CompanyResponse> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return CompanyService.toResponse(company);
  }

  async create(dto: CreateCompanyDto): Promise<CompanyResponse> {
    await this.assertCodeAvailable(dto.code);

    const company = this.companies.create({
      code: dto.code,
      name: dto.name,
    });
    const saved = await this.companies.save(company);
    return CompanyService.toResponse(saved);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<CompanyResponse> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    if (dto.code && dto.code !== company.code) {
      await this.assertCodeAvailable(dto.code);
    }

    Object.assign(company, dto);
    const saved = await this.companies.save(company);
    return CompanyService.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const result = await this.companies.delete(id);
    if (!result.affected) throw new NotFoundException('Company not found');
  }

  private async assertCodeAvailable(code: string): Promise<void> {
    const existing = await this.companies.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Code "${code}" is already in use`);
    }
  }

  private static toResponse(company: Company): CompanyResponse {
    return {
      id: company.id,
      code: company.code,
      name: company.name,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
