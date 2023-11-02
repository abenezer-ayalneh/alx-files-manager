import { IsBase64, IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateFileDto {
  @IsString()
  @IsNotEmpty({ message: 'Missing name' })
  name: string

  @IsIn(['folder', 'file', 'image'], { message: 'Missing type' })
  @IsNotEmpty()
  type: 'folder' | 'file' | 'image'

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  parentId: number = 0

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isPublic: boolean = false

  @ValidateIf((dto) => dto.type === 'file' || dto.type === 'image',{ message: 'Missing name' })
  @IsBase64()
  data: string
}