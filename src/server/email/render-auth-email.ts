import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import englishAuthMessages from "../../../messages/en/auth.json";
import spanishAuthMessages from "../../../messages/es/auth.json";

import {
  defaultLocale,
  isLocale,
  type Locale,
} from "@/i18n/routing";

const templateDirectory = path.join(process.cwd(), "templates", "emails");
const templatePlaceholderPattern = /{{[A-Z][A-Z0-9_]*}}/;
const callbackParameterNames = [
  "callbackURL",
  "callbackUrl",
  "redirectTo",
] as const;

type AuthEmailCopy = Readonly<{
  body: string;
  buttonLabel: string;
  documentTitle: string;
  eyebrow: string;
  fallbackInstructions: string;
  footer: string;
  heading: string;
  noteBody: string;
  noteLead: string;
  preheader: string;
  subject: string;
}>;

type AuthEmailMessageKey = "emailVerification" | "passwordReset";

const emailMessages = {
  en: englishAuthMessages.emails,
  es: spanishAuthMessages.emails,
} satisfies Record<Locale, Record<AuthEmailMessageKey, AuthEmailCopy>>;

const templateConfig = {
  "email-verification": {
    fileName: "verify-email.html",
    messageKey: "emailVerification",
    placeholder: "{{VERIFICATION_URL}}",
  },
  "forget-password": {
    fileName: "reset-password.html",
    messageKey: "passwordReset",
    placeholder: "{{RESET_PASSWORD_URL}}",
  },
} as const;

export type SupportedAuthEmailType = keyof typeof templateConfig;

export type RenderedAuthEmail = Readonly<{
  html: string;
  subject: string;
}>;

const templateCache = new Map<string, Promise<string>>();

export async function renderAuthEmail(
  type: SupportedAuthEmailType,
  actionUrl: string,
): Promise<RenderedAuthEmail> {
  const config = templateConfig[type];
  const template = await loadTemplate(config.fileName);
  const locale = resolveEmailLocale(actionUrl);
  const copy = emailMessages[locale][config.messageKey];

  if (!template.includes(config.placeholder)) {
    throw new AuthEmailTemplateError(
      `Template ${config.fileName} does not contain its action URL placeholder`,
    );
  }

  const html = replaceTemplateValues(template, {
    BODY: copy.body,
    BUTTON_LABEL: copy.buttonLabel,
    DOCUMENT_TITLE: copy.documentTitle,
    EYEBROW: copy.eyebrow,
    FALLBACK_INSTRUCTIONS: copy.fallbackInstructions,
    FOOTER: copy.footer,
    HEADING: copy.heading,
    LOCALE: locale,
    NOTE_BODY: copy.noteBody,
    NOTE_LEAD: copy.noteLead,
    PREHEADER: copy.preheader,
    [config.placeholder.slice(2, -2)]: actionUrl,
  });

  if (templatePlaceholderPattern.test(html)) {
    throw new AuthEmailTemplateError(
      `Template ${config.fileName} contains unresolved placeholders`,
    );
  }

  return {
    html,
    subject: copy.subject,
  };
}

export class AuthEmailTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthEmailTemplateError";
  }
}

function loadTemplate(fileName: string): Promise<string> {
  const cachedTemplate = templateCache.get(fileName);

  if (cachedTemplate) {
    return cachedTemplate;
  }

  const templatePromise = readFile(path.join(templateDirectory, fileName), "utf8");
  templateCache.set(fileName, templatePromise);
  void templatePromise.catch(() => {
    if (templateCache.get(fileName) === templatePromise) {
      templateCache.delete(fileName);
    }
  });

  return templatePromise;
}

function replaceTemplateValues(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return Object.entries(values).reduce(
    (renderedTemplate, [key, value]) =>
      renderedTemplate.replaceAll(`{{${key}}}`, escapeHtml(value)),
    template,
  );
}

function resolveEmailLocale(actionUrl: string): Locale {
  try {
    const parsedActionUrl = new URL(actionUrl);
    const directLocale = getPathLocale(parsedActionUrl);

    for (const parameterName of callbackParameterNames) {
      const callbackUrl = parsedActionUrl.searchParams.get(parameterName);

      if (!callbackUrl) {
        continue;
      }

      const callbackLocale = getPathLocale(
        new URL(callbackUrl, parsedActionUrl.origin),
      );

      if (callbackLocale) {
        return callbackLocale;
      }
    }

    return directLocale ?? defaultLocale;
  } catch {
    return defaultLocale;
  }
}

function getPathLocale(url: URL): Locale | null {
  const pathLocale = url.pathname.split("/").filter(Boolean).at(0);

  return isLocale(pathLocale) ? pathLocale : null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
