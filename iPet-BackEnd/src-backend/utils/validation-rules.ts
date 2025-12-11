import { applyDecorators } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail, sanitizeInput } from './sanitizers';
// Use shared validation rules
import {
    EMAIL_REGEX,
    PASSWORD_REGEX,
    VERIFICATION_CODE_REGEX,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH
} from '@shared/validation/rules';

// Re-export for backward compatibility
export { EMAIL_REGEX, PASSWORD_REGEX, VERIFICATION_CODE_REGEX, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH };

export function IsStandardEmail() {
    return applyDecorators(
        IsEmail(),
        IsNotEmpty(),
        Transform(({ value }) => normalizeEmail(value))
    );
}

export function IsStandardPassword() {
    return applyDecorators(
        IsString(),
        MinLength(8),
        MaxLength(PASSWORD_MAX_LENGTH),
        Matches(PASSWORD_REGEX, {
            message: '密码至少 8 位且需包含字母和数字，且不允许空格',
        }),
        IsNotEmpty(),
        Transform(({ value }) => sanitizeInput(value))
    );
}
