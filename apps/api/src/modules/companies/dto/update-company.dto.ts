import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import type { UpdateCompanyRequest } from '@app/shared';

export class UpdateCompanyDto implements UpdateCompanyRequest {
  @IsOptional()
  @IsString()
  @Length(1, 5)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => String(value).trim())
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
