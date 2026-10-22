const KEYBOARD_THRESHOLD = 100;

export function getKeyboardInset(
  layoutHeight: number,
  viewportHeight: number,
  viewportOffsetTop: number,
) {
  const inset = Math.max(0, layoutHeight - viewportHeight - viewportOffsetTop);

  return inset >= KEYBOARD_THRESHOLD ? inset : 0;
}
