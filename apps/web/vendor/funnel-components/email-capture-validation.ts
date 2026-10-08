/**
 * Email validation shared by `EmailCaptureForm` and any caller that wants to
 * pre-validate before calling it.
 *
 * Deliberately a plain regex, not a full RFC 5322 parser — matches the
 * pattern already used across WTC funnels
 * (`apps/website/src/components/layout/footer/footer-data.ts`'s
 * `EMAIL_REGEX`) so behavior does not change for existing callers that adopt
 * this component.
 *
 * @module email-capture-validation
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Max length accepted — matches the SMTP envelope limit (RFC 5321 §4.5.3.1.3). */
export const EMAIL_MAX_LENGTH = 254;

/**
 * True when `value` (trimmed) looks like a syntactically valid email address
 * and is not longer than {@link EMAIL_MAX_LENGTH}.
 */
export function isValidEmailAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > EMAIL_MAX_LENGTH) return false;
  return EMAIL_PATTERN.test(trimmed);
}

/**
 * Validate an email capture field, returning a translation-ready error
 * message key (never a hardcoded English string) or `null` when valid.
 *
 * Callers that need localized text supply `messages` (defaults to English)
 * so this stays usable both by apps with i18n (`t('...')`) and apps without.
 */
export function validateEmailCaptureField(
  value: string,
  messages: { required: string; invalid: string } = {
    required: 'Please enter your email address.',
    invalid: 'Please enter a valid email address.',
  }
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return messages.required;
  if (!isValidEmailAddress(trimmed)) return messages.invalid;
  return null;
}
