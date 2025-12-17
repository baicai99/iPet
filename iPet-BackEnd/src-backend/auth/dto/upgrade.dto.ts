import { IsStandardEmail, IsStandardPassword } from '../../utils/validation-rules';

export class UpgradeDto {
  @IsStandardEmail()
  email!: string;

  @IsStandardPassword()
  password!: string;
}

