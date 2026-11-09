import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

type Reporter = {
  layer_tree_host_id: number;
  frame_source: number;
  frame_sequence: number;
  state: string;
  has_missing_content: boolean;
  scroll_state: string;
};
type Event = {
  name: string;
  pid: number;
  tid: number;
  dur?: number;
  args?: { name?: string; frame_reporter?: Reporter };
};
function analyze(events: Event[], scrollingOnly: boolean) {
  const frames = new Map<string, Reporter[]>();
  for (const event of events) {
    const f = event.args?.frame_reporter;
    if (event.name !== "PipelineReporter" || !f) continue;
    const key = `${f.layer_tree_host_id}:${f.frame_source}:${f.frame_sequence}`;
    frames.set(key, [...(frames.get(key) ?? []), f]);
  }
  const groups = [...frames.values()].filter(
    (group) =>
      !scrollingOnly || group.some((f) => f.scroll_state !== "SCROLL_NONE"),
  );
  const presented = (group: Reporter[]) =>
    group.some((f) => f.state.startsWith("STATE_PRESENTED"));
  const main = events.find(
    (e) => e.name === "thread_name" && e.args?.name === "CrRendererMain",
  );
  const tasks = events
    .filter(
      (e) =>
        e.pid === main?.pid &&
        e.tid === main?.tid &&
        e.name === "RunTask" &&
        e.dur != null,
    )
    .map((e) => e.dur! / 1000);
  if (events.length > 2)
    assert(tasks.length > 0, "Main-thread RunTask events are required");
  const long = tasks.filter((ms) => ms > 50);
  return {
    frames: groups.length,
    presented: groups.filter(presented).length,
    missingPresented: groups.filter(
      (g) => presented(g) && g.some((f) => f.has_missing_content),
    ).length,
    droppedOnly: groups.filter(
      (g) => !presented(g) && g.some((f) => f.state === "STATE_DROPPED"),
    ).length,
    longTaskCount: long.length,
    longTaskTotalMs: long.reduce((a, b) => a + b, 0),
    maxTaskMs: Math.max(0, ...tasks),
  };
}
const reporter = {
  layer_tree_host_id: 1,
  frame_source: 1,
  frame_sequence: 1,
  state: "STATE_PRESENTED_ALL",
  has_missing_content: true,
  scroll_state: "SCROLL_ON_IMPL_THREAD",
};
const sample = {
  name: "PipelineReporter",
  pid: 1,
  tid: 1,
  args: { frame_reporter: reporter },
};
assert.equal(analyze([sample, sample], true).missingPresented, 1);
assert.equal(
  analyze(
    [
      sample,
      {
        ...sample,
        args: { frame_reporter: { ...reporter, state: "STATE_DROPPED" } },
      },
    ],
    true,
  ).droppedOnly,
  0,
);
const rows = [];
for (const directory of [
  "performance-results/chat-scroll/runtime-218-loaded-20k",
  "performance-results/chat-scroll/runtime-218-prepend-20k",
  "performance-results/chat-runtime/issue-218",
]) {
  for (const file of (await readdir(directory))
    .filter((name) => name.endsWith(".json.gz"))
    .sort()) {
    const trace = JSON.parse(
      gunzipSync(await readFile(`${directory}/${file}`)).toString(),
    ) as { traceEvents: Event[] };
    rows.push({
      directory,
      file,
      ...analyze(trace.traceEvents, directory.includes("loaded-20k")),
    });
  }
}
await writeFile(
  "performance-results/frame-analysis-218.json",
  JSON.stringify(rows, null, 2),
);
console.log(JSON.stringify(rows, null, 2));
