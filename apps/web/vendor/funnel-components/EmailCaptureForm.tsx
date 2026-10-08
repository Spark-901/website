'use client';

import { useCallback, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, Send } from 'lucide-react';
import { getTurnstileToken } from './turnstile';
import { validateEmailCaptureField } from './email-capture-validation';

/**
 * A generic "stay up to date" email-capture form — UI + validation only,
 * BACKEND-AGNOSTIC by design.
 *
 * Different WTC-ecosystem sites post a captured email to different places
 * (westtn.consulting → a Zapier webhook fronted by `/api/submit-email`;
 * other funnels → `registerLeadInHub`/Hub CRM directly; a non-WTC site
 * (e.g. Spark901) → its own DynamoDB ops-ledger + Slack-notify pipeline).
 * Rather than hardcode one of those, this component takes an `onSubmit`
 * callback and lets the caller decide where the email goes — the same
 * "framework-agnostic" philosophy the rest of this package follows
 * (see `UrgencyBanner`, which is plain HTML/Tailwind with no shared-UI-kit
 * dependency, so a consumer never needs `@west-tennessee-consulting/ui`
 * installed just to render a lead-capture field).
 *
 * Turnstile is opt-in and PROP-driven: pass `turnstileSiteKey` for the
 * *consuming site's own* Cloudflare Turnstile widget (never hardcode one
 * here — see `../lib/turnstile-widgets.js` for why WTC alone needs three).
 * When set, a token is acquired invisibly (interaction-only widget, via
 * `getTurnstileToken`) before `onSubmit` is called; when omitted,
 * `turnstileToken` is always `null` and the caller's backend decides
 * whether that is acceptable (most WTC backends fail OPEN when
 * unconfigured, so local dev and un-provisioned apps keep working).
 *
 * @module EmailCaptureForm
 */

export interface EmailCaptureSubmitResult {
  success: boolean;
  /** User-facing message. Falls back to the built-in success/error copy when omitted. */
  message?: string;
}

export interface EmailCaptureFormMessages {
  placeholder: string;
  /** Shown when the field is empty on submit/blur. */
  required: string;
  /** Shown when the field is non-empty but not a valid email. */
  invalid: string;
  submitLabel: string;
  submittingLabel: string;
  /** Shown on success when `onSubmit` did not return its own `message`. */
  defaultSuccess: string;
  /** Shown on failure when `onSubmit` did not return its own `message`. */
  defaultError: string;
}

const DEFAULT_MESSAGES: EmailCaptureFormMessages = {
  placeholder: 'Enter your email',
  required: 'Please enter your email address.',
  invalid: 'Please enter a valid email address.',
  submitLabel: 'Subscribe',
  submittingLabel: 'Subscribing…',
  defaultSuccess: "Thanks! You're on the list.",
  defaultError: 'Sorry, something went wrong. Please try again.',
};

export interface EmailCaptureFormProps {
  /**
   * Called after client-side validation passes (and, when `turnstileSiteKey`
   * is set, after a Turnstile token was acquired). Do the actual network
   * call here — POST to Hub, a Zapier webhook, an ops-ledger route,
   * anything. Throwing is treated the same as returning `{ success: false }`.
   */
  onSubmit: (email: string, turnstileToken: string | null) => Promise<EmailCaptureSubmitResult>;
  /**
   * This site's own Cloudflare Turnstile site key. Omit to skip Turnstile
   * (the caller's `onSubmit` always receives `turnstileToken: null`).
   */
  turnstileSiteKey?: string;
  /** Action label recorded on the Cloudflare assessment. */
  turnstileAction?: string;
  /** Override any subset of the built-in copy (for i18n or brand voice). */
  messages?: Partial<EmailCaptureFormMessages>;
  /** Wraps the whole component (form + inline messages). */
  className?: string;
  /** Applied to the `<form>` element itself (default: a flex row with a gap). */
  formClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  /** Replaces the built-in idle button content (text or an icon). */
  submitLabel?: ReactNode;
  /** Replaces the built-in in-flight button content. */
  submittingLabel?: ReactNode;
  /** Called once, after a successful submit and after the field is cleared. */
  onSuccess?: (email: string) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  'aria-label'?: string;
}

type FieldStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Backend-agnostic "stay up to date" email signup: one input, one submit
 * button, idle/submitting/success/error states, inline validation on blur,
 * and optional invisible Turnstile bot protection.
 */
export function EmailCaptureForm({
  onSubmit,
  turnstileSiteKey,
  turnstileAction = 'newsletter_signup',
  messages: messagesOverride,
  className,
  formClassName,
  inputClassName,
  buttonClassName,
  submitLabel,
  submittingLabel,
  onSuccess,
  disabled = false,
  name = 'email',
  id,
  'aria-label': ariaLabel,
}: EmailCaptureFormProps) {
  const messages: EmailCaptureFormMessages = { ...DEFAULT_MESSAGES, ...messagesOverride };

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<FieldStatus>('idle');
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const validate = useCallback(
    (value: string) => validateEmailCaptureField(value, messages),
    // messages is a fresh object each render when an override is passed, but
    // its VALUES only change when the caller's own override object changes
    // identity — re-deriving the validator every render is cheap and correct,
    // avoiding a stale closure over old copy is worth more than memoizing this.
    [messages]
  );

  const handleChange = (value: string) => {
    setEmail(value);
    if (touched) setFieldError(validate(value));
  };

  const handleBlur = () => {
    setTouched(true);
    setFieldError(validate(email));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validate(email);
    if (validationError) {
      setTouched(true);
      setFieldError(validationError);
      return;
    }

    setStatus('submitting');
    setResultMessage(null);

    try {
      const turnstileToken = turnstileSiteKey
        ? await getTurnstileToken(turnstileAction, turnstileSiteKey)
        : null;

      const result = await onSubmit(email.trim(), turnstileToken);

      if (result.success) {
        setStatus('success');
        setResultMessage(result.message ?? messages.defaultSuccess);
        const submitted = email.trim();
        setEmail('');
        setFieldError(null);
        setTouched(false);
        onSuccess?.(submitted);
      } else {
        setStatus('error');
        setResultMessage(result.message ?? messages.defaultError);
      }
    } catch {
      setStatus('error');
      setResultMessage(messages.defaultError);
    }
  };

  const isSubmitting = status === 'submitting';

  return (
    <div className={className}>
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className={formClassName ?? 'flex gap-2'}
      >
        <input
          type="email"
          name={name}
          id={id}
          aria-label={ariaLabel ?? messages.placeholder}
          placeholder={messages.placeholder}
          value={email}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          maxLength={254}
          required
          disabled={disabled || isSubmitting}
          aria-invalid={fieldError ? true : undefined}
          className={
            inputClassName ??
            'flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none'
          }
        />
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className={
            buttonClassName ??
            'inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60'
          }
        >
          {isSubmitting ? (
            submittingLabel ?? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            (submitLabel ?? <Send className="h-4 w-4" aria-hidden="true" />)
          )}
        </button>
      </form>

      {fieldError && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {fieldError}
        </p>
      )}

      {resultMessage && (
        <div
          role={status === 'error' ? 'alert' : 'status'}
          className={`mt-2 rounded-md p-2 text-xs ${
            status === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {resultMessage}
        </div>
      )}
    </div>
  );
}
