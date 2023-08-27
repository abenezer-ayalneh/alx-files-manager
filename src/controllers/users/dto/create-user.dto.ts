import { IsNotEmpty } from "class-validator";

export class CreateUserDto {
  @IsNotEmpty({message: 'Missing email'})
  email: string

  @IsNotEmpty({message: 'Missing password'})
  password: string
}