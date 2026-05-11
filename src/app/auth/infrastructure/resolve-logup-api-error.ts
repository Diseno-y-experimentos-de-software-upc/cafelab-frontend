import { getUserFacingApiMessage } from '../../shared/infrastructure/api-error-message';

/** Mensajes del backend al registrar perfil (inglés) que indican correo duplicado. */
const EMAIL_EXISTS_PATTERNS =
  /Profile with email address already exists|Email already exists/i;

export type LogupRegistrationError =
  | { kind: 'i18n'; key: string }
  | { kind: 'plain'; text: string };

/**
 * Clasifica el fallo de POST /api/v1/profiles para mostrarlo en plantilla con {@link TranslatePipe}
 * (reacciona al idioma activo) o como texto plano del API.
 */
export function classifyLogupRegistrationError(error: unknown): LogupRegistrationError {
  const raw = getUserFacingApiMessage(error, '').trim();
  if (EMAIL_EXISTS_PATTERNS.test(raw)) {
    return { kind: 'i18n', key: 'LOGUP.ERROR_EMAIL_EXISTS' };
  }
  if (!raw) {
    return { kind: 'i18n', key: 'LOGUP.ERROR_GENERIC' };
  }
  return { kind: 'plain', text: raw };
}
