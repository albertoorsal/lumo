import { IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import type { CreateCompanyRequest } from '@app/shared';

export class CreateCompanyDto implements CreateCompanyRequest {
  @IsString()
  @Length(1, 5)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code: string;

  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => String(value).trim())
  name: string;
}
