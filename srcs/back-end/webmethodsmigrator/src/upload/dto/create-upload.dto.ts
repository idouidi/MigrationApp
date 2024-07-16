import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUploadDto {
  @IsNotEmpty()
  @IsString()
  description: string;
}