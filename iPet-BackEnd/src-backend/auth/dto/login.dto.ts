import { IsStandardEmail, IsStandardPassword } from '../../utils/validation-rules';

export class LoginDto {
  @IsStandardEmail()
  email!: string;

  @IsStandardPassword()
  password!: string;
}
