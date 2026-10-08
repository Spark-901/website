import type { CookieConsentStrings } from "@west-tennessee-consulting/cookie-consent"

/**
 * Locales beyond the package's built-in `en`. Matches `locales` in
 * i18n/config.ts — add an entry here whenever a new locale is added there.
 */
export const COOKIE_CONSENT_TRANSLATIONS: Readonly<Record<string, CookieConsentStrings>> = {
  es: {
    consentModal: {
      title: "Usamos cookies",
      description:
        "{siteName} usa cookies esenciales para operar el sitio y, solo con su consentimiento, Google Analytics para ver cómo se utiliza.",
      acceptAllBtn: "Aceptar todo",
      acceptNecessaryBtn: "Rechazar no esenciales",
      showPreferencesBtn: "Gestionar",
      privacyPolicyLinkText: "Política de Cookies",
    },
    preferencesModal: {
      title: "Preferencias de cookies",
      acceptAllBtn: "Aceptar todo",
      acceptNecessaryBtn: "Rechazar no esenciales",
      savePreferencesBtn: "Guardar preferencias",
      closeIconLabel: "Cerrar",
      necessaryTitle: "Esenciales",
      necessaryDescription: "Necesarias para que el sitio funcione. No se pueden desactivar.",
      analyticsTitle: "Analítica",
      analyticsDescription:
        "Google Analytics: páginas vistas, ubicación aproximada, tipo de dispositivo y navegador. Desactivado de forma predeterminada.",
    },
  },
  ja: {
    consentModal: {
      title: "クッキーを使用しています",
      description:
        "{siteName}はサイトの運営に必須のクッキーを使用しており、お客様の同意がある場合に限りGoogle Analyticsを使用してサイトの利用状況を確認します。",
      acceptAllBtn: "すべて同意する",
      acceptNecessaryBtn: "必須以外を拒否",
      showPreferencesBtn: "管理",
      privacyPolicyLinkText: "クッキーポリシー",
    },
    preferencesModal: {
      title: "クッキーの設定",
      acceptAllBtn: "すべて同意する",
      acceptNecessaryBtn: "必須以外を拒否",
      savePreferencesBtn: "設定を保存",
      closeIconLabel: "閉じる",
      necessaryTitle: "必須",
      necessaryDescription: "サイトの機能に必要です。無効にすることはできません。",
      analyticsTitle: "アナリティクス",
      analyticsDescription:
        "Google Analytics — ページビュー、おおよその位置情報、デバイスおよびブラウザの種類。既定でオフです。",
    },
  },
  zh: {
    consentModal: {
      title: "我们使用Cookie",
      description:
        "{siteName}使用运行本网站所必需的基本Cookie，并且仅在您同意的情况下使用Google Analytics来了解网站的使用情况。",
      acceptAllBtn: "全部接受",
      acceptNecessaryBtn: "拒绝非必要项",
      showPreferencesBtn: "管理",
      privacyPolicyLinkText: "Cookie政策",
    },
    preferencesModal: {
      title: "Cookie偏好设置",
      acceptAllBtn: "全部接受",
      acceptNecessaryBtn: "拒绝非必要项",
      savePreferencesBtn: "保存偏好设置",
      closeIconLabel: "关闭",
      necessaryTitle: "基本",
      necessaryDescription: "网站正常运行所必需，无法关闭。",
      analyticsTitle: "分析",
      analyticsDescription: "Google Analytics — 页面浏览量、大致位置、设备和浏览器类型。默认关闭。",
    },
  },
}
