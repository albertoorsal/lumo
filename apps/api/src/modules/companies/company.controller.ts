import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Permission } from '@app/shared';
import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { PermissionGuard } from '../auth/guards/permissions.guard.js';
import { RequiredPermissions } from '../auth/decorators/permissions.decorator.js';

@UseGuards(PermissionGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companies: CompanyService) {}

  @RequiredPermissions(Permission.COMPANIES_READ)
  @Get()
  findAll() {
    return this.companies.findAll();
  }

  @RequiredPermissions(Permission.COMPANIES_READ)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companies.findOne(id);
  }

  @RequiredPermissions(Permission.COMPANIES_CREATE)
  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companies.create(dto);
  }

  @RequiredPermissions(Permission.COMPANIES_UPDATE)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companies.update(id, dto);
  }

  @RequiredPermissions(Permission.COMPANIES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.companies.remove(id);
  }
}
