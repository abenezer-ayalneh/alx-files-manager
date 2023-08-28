import { IsBase64, IsNotEmpty, IsString } from 'class-validator'

export class ConnectDto {
  @IsBase64()
  @IsString()
  @IsNotEmpty()
  credential: string | undefined
}
