import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class DisconnectDto {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  token: string | undefined
}