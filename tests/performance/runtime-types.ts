export {};
declare global {
  interface Window {
    __anchors: { time: number; y: number; loaded: string | null | undefined }[];
    __sampling: boolean;
    __sendMarks: Record<string, number>;
    __stream: {
      start: number;
      first: number;
      changes: { time: number; text: string }[];
      tasks: number[];
      frames: number[];
      active: boolean;
    };
  }
}
