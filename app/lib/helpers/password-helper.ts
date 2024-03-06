export const hasLength = (value: string) => value.length > 7;
export const hasUpperCase = (value: string) => /[A-Z]/.test(value);
export const hasNumber = (value: string) => /\d/.test(value);
export const hasSymbol = (value: string) =>
  /[!@#$%^&*(),.?":{}|<>]/.test(value);

export const isSecurePassword = (value: string) =>
  hasLength(value) &&
  hasUpperCase(value) &&
  hasNumber(value) &&
  hasSymbol(value);
