import { IsIn, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class GetFileByIdDto {
  @IsIn([500, 250, 100])
  @Type(() => Number)
  @IsOptional()
  size?: number
}
