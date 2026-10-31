export function takeChatStreamChunk(content: string) {
  const characters = Array.from(content);
  const chunkSize =
    characters.length > 120 ? 8 : characters.length > 40 ? 4 : 2;

  return [
    characters.slice(0, chunkSize).join(""),
    characters.slice(chunkSize).join(""),
  ] as const;
}
