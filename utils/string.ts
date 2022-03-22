export function caseInsensitiveStringCompare(str1: string, str2: string) {
  return str1.localeCompare(str2, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

export function caseInsensitiveStringEqual(str1: string, str2: string) {
  return caseInsensitiveStringCompare(str1, str2) === 0;
}

export function addEllipsis(text: string): string {
  const start = text.slice(0, 6).trim();
  const suffix = text.slice(-4).trim();

  return `${start}...${suffix}`;
}
