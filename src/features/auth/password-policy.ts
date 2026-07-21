export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_INPUT_PATTERN = "(?=.*[A-Z])(?=.*\\d).{8,128}";

const passwordRules = [
  {
    key: "length",
    isValid: (password: string) =>
      password.length >= PASSWORD_MIN_LENGTH &&
      password.length <= PASSWORD_MAX_LENGTH,
  },
  {
    key: "uppercase",
    isValid: (password: string) => /[A-Z]/.test(password),
  },
  {
    key: "number",
    isValid: (password: string) => /[0-9]/.test(password),
  },
] as const;

export type PasswordRuleResult = Readonly<{
  key: (typeof passwordRules)[number]["key"];
  ok: boolean;
}>;

export function evaluatePassword(password: string): PasswordRuleResult[] {
  return passwordRules.map(({ key, isValid }) => ({
    key,
    ok: isValid(password),
  }));
}
