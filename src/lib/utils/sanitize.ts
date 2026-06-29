export function sanitizeText(input: unknown): string {
  if (input === null) return '';
  let s = String(input);
  // Remove script tags
  s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  // Remove on* handlers
  s = s.replace(/on\w+=\"[^"]*\"/gi, '');
  s = s.replace(/on\w+=\'[^']*\'/gi, '');
  // Strip javascript: urls
  s = s.replace(/javascript:\s*[^\s"']+/gi, '');
  // Basic tag removal for safety (keep simple formatting optional)
  s = s.replace(/<(?!\/?(b|i|em|strong|p|br|ul|ol|li|code)\b)[^>]*>/gi, '');
  return s.trim();
}
