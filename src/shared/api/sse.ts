export type ParsedSseEvent = {
  event: string;
  data: string;
};

export function extractSseEvents(buffer: string) {
  const events: ParsedSseEvent[] = [];
  let rest = buffer;
  let boundary = rest.match(/\r?\n\r?\n/);

  while (boundary?.index != null) {
    const block = rest.slice(0, boundary.index);
    rest = rest.slice(boundary.index + boundary[0].length);

    let event = "message";
    const data: string[] = [];

    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trimStart();
      } else if (line.startsWith("data:")) {
        data.push(line.slice(5).trimStart());
      }
    }

    if (data.length > 0) {
      events.push({ event, data: data.join("\n") });
    }

    boundary = rest.match(/\r?\n\r?\n/);
  }

  return { events, rest };
}
