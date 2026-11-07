export function splitByKeyword(text: string, keyword: string) {
  if (!keyword) return [{ highlighted: false, text }];

  const parts: { highlighted: boolean; text: string }[] = [];
  const normalizedText = text.toLocaleLowerCase("ko-KR");
  const normalizedKeyword = keyword.toLocaleLowerCase("ko-KR");
  let start = 0;
  let match = normalizedText.indexOf(normalizedKeyword);

  while (match !== -1) {
    if (match > start) {
      parts.push({ highlighted: false, text: text.slice(start, match) });
    }
    parts.push({
      highlighted: true,
      text: text.slice(match, match + keyword.length),
    });
    start = match + keyword.length;
    match = normalizedText.indexOf(normalizedKeyword, start);
  }

  if (start < text.length) {
    parts.push({ highlighted: false, text: text.slice(start) });
  }

  return parts;
}
