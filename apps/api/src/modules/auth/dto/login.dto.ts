import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsString()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  username: string;

  @IsString()
  @MinLength(8, { message: 'Password must least 8 chars' })
  @MaxLength(128)
  password: string;
}
