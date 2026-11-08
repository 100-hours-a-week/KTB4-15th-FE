import assert from "node:assert/strict";
import test from "node:test";
import {
  formatKoreanDate,
  formatKoreanTime,
} from "../../src/shared/utils/date-format.ts";

test("재사용하는 포맷터는 입력마다 한국 시간의 날짜와 시간을 표시한다", () => {
  const cases = [
    ["2026-11-07T15:05:00Z", "2026년 11월 8일 일요일", "오전 12:05"],
    ["2026-11-08T03:30:00Z", "2026년 11월 8일 일요일", "오후 12:30"],
    ["2026-12-31T15:00:00Z", "2027년 1월 1일 금요일", "오전 12:00"],
  ];
  for (const [iso, date, time] of cases) {
    for (const input of [iso, new Date(iso), Date.parse(iso)]) {
      assert.equal(formatKoreanDate(input), date);
      assert.equal(formatKoreanTime(input), time);
    }
  }
  assert.throws(() => formatKoreanDate("invalid"), RangeError);
  assert.throws(() => formatKoreanTime("invalid"), RangeError);
});
