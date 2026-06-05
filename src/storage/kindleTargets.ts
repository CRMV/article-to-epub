export function isValidKindleEmail(value: string): boolean {
  return /^[^@\s]+@kindle\.com$/i.test(value.trim());
}

export function maskEmail(value: string): string {
  const [name, domain] = value.split("@");
  if (!name || !domain) return value;
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

