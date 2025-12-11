import { IsStandardEmail, IsStandardPassword } from '../../utils/validation-rules';

export class CreateUserDto {
  @IsStandardEmail()
  email!: string;

  @IsStandardPassword()
  password!: string;
}
