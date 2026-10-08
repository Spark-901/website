/**
 * Which Cloudflare Turnstile widget an app uses.
 *
 * A Turnstile widget allows at most **10 hostnames**. WTC filled widget 1, then
 * widget 2, so a third widget exists. Rather than teach every app about widget
 * numbers, both client and server resolve the widget from env: the
 * highest-numbered widget variable that is set wins.
 *
 * | Widget | Site key var | Secret var |
 * |---|---|---|
 * | 1 (original, FULL) | `NEXT_PUBLIC_WTC_TURNSTILE_SITE_KEY` | `WTC_TURNSTILE_SECRET_KEY` |
 * | 2 (overflow) | `NEXT_PUBLIC_WTC_TURNSTILE2_SITE_KEY` | `WTC_TURNSTILE2_SECRET_KEY` |
 * | 3 (overflow) | `NEXT_PUBLIC_WTC_TURNSTILE3_SITE_KEY` | `WTC_TURNSTILE3_SECRET_KEY` |
 *
 * The digit goes directly after `TURNSTILE`, with no underscore.
 *
 * An app sets exactly ONE pair. A higher widget number overrides a lower one for
 * that app, so a project can be migrated by adding two env vars and removing two,
 * with no code change and no redeploy of any other app.
 *
 * In practice these are managed as Vercel **shared** environment variables and
 * attached per project, so onboarding an app is an attach rather than a retype —
 * which is also why the values are not duplicated into this repo.
 *
 * **The pair must match.** A widget-3 site key verified against the widget-1
 * secret fails siteverify with `invalid-input-response`, which looks exactly
 * like a bot and rejects real users. `describeTurnstileConfig` detects that
 * server-side so the failure is loud instead of mysterious.
 *
 * **Adding widget 4, when widget 3 also fills:** add the literal branch to each
 * resolver below (first, so it takes precedence), widen {@link TurnstileWidget},
 * and extend the suites. Do NOT refactor these into a loop over a name array —
 * Next.js inlines `NEXT_PUBLIC_*` at build time by matching the literal text, so
 * a computed `process.env[name]` lookup resolves to `undefined` in the browser
 * bundle and the widget silently stops rendering.
 *
 * Full policy — which app is on which widget, and why — is in the engineering
 * rule WTC_TURNSTILE_LEAD_CAPTURE.
 */

export type TurnstileWidget = 1 | 2 | 3;

/**
 * Resolve the public site key and the widget it belongs to.
 *
 * Safe on both client and server: only reads `NEXT_PUBLIC_*`. Next.js inlines
 * these at build time, so each variable must be referenced literally — a
 * computed `process.env[name]` lookup would resolve to `undefined` in the
 * browser bundle.
 */
export function resolveTurnstileSiteKey():
    | { siteKey: string; widget: TurnstileWidget }
    | undefined {
    const widget3 = process.env.NEXT_PUBLIC_WTC_TURNSTILE3_SITE_KEY?.trim();
    if (widget3) return { siteKey: widget3, widget: 3 };

    const widget2 = process.env.NEXT_PUBLIC_WTC_TURNSTILE2_SITE_KEY?.trim();
    if (widget2) return { siteKey: widget2, widget: 2 };

    const widget1 = process.env.NEXT_PUBLIC_WTC_TURNSTILE_SITE_KEY?.trim();
    if (widget1) return { siteKey: widget1, widget: 1 };

    return undefined;
}

/**
 * Resolve the server secret and the widget it belongs to. Server-only — never
 * call this from client code.
 */
export function resolveTurnstileSecret():
    | { secret: string; widget: TurnstileWidget }
    | undefined {
    const widget3 = process.env.WTC_TURNSTILE3_SECRET_KEY?.trim();
    if (widget3) return { secret: widget3, widget: 3 };

    const widget2 = process.env.WTC_TURNSTILE2_SECRET_KEY?.trim();
    if (widget2) return { secret: widget2, widget: 2 };

    const widget1 = process.env.WTC_TURNSTILE_SECRET_KEY?.trim();
    if (widget1) return { secret: widget1, widget: 1 };

    return undefined;
}

export interface TurnstileConfigDescription {
    /** Widget the browser will render, if any. */
    clientWidget: TurnstileWidget | null;
    /** Widget the server will verify against, if any. */
    serverWidget: TurnstileWidget | null;
    /** True when both halves are configured AND agree. Verification is enforced. */
    enforced: boolean;
    /**
     * Set when the configuration is self-defeating. Callers should log this —
     * every one of these states silently rejects or silently admits real users.
     */
    misconfiguration?: string;
}

/**
 * Describe the current Turnstile configuration, naming the failure mode when
 * the two halves disagree.
 *
 * The widget number is carried in every message because it is the one detail
 * that turns "the captcha rejects everyone" into a fix: it names which pair to
 * correct. It is also the only Turnstile value that is safe to log — never the
 * site key, and above all never the secret.
 *
 * Server-only (reads the secret). Intended for a one-line startup/first-request
 * log so a mismatched pair is visible in the logs rather than showing up as
 * "captcha keeps failing" from customers.
 */
export function describeTurnstileConfig(): TurnstileConfigDescription {
    const client = resolveTurnstileSiteKey();
    const server = resolveTurnstileSecret();

    if (!client && !server) {
        // Intentional for local dev and un-provisioned apps: fail open.
        return { clientWidget: null, serverWidget: null, enforced: false };
    }

    if (client && !server) {
        return {
            clientWidget: client.widget,
            serverWidget: null,
            enforced: false,
            misconfiguration: `Turnstile site key is set (widget ${client.widget}) but no secret — a token is produced and never verified, so there is NO protection. Set WTC_TURNSTILE${client.widget === 1 ? '' : client.widget}_SECRET_KEY.`,
        };
    }

    if (!client && server) {
        return {
            clientWidget: null,
            serverWidget: server.widget,
            enforced: false,
            misconfiguration: `Turnstile secret is set (widget ${server.widget}) but no site key — the browser sends no token, so EVERY submission is rejected. Set NEXT_PUBLIC_WTC_TURNSTILE${server.widget === 1 ? '' : server.widget}_SITE_KEY.`,
        };
    }

    if (client && server && client.widget !== server.widget) {
        return {
            clientWidget: client.widget,
            serverWidget: server.widget,
            enforced: false,
            misconfiguration: `Turnstile widget mismatch — site key is widget ${client.widget} but the secret is widget ${server.widget}. siteverify will return invalid-input-response and reject every real user. Both halves must come from the SAME widget.`,
        };
    }

    return {
        clientWidget: client?.widget ?? null,
        serverWidget: server?.widget ?? null,
        enforced: true,
    };
}
