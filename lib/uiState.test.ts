import assert from "node:assert/strict";
import test from "node:test";
import {
  detailStateAfterChapterChange,
  resolveInitialTheme,
  type DetailState,
} from "./uiState.ts";

test("initial theme uses the theme already resolved on the document", () => {
  assert.equal(resolveInitialTheme("dark"), "dark");
  assert.equal(resolveInitialTheme("light"), "light");
  assert.equal(resolveInitialTheme(undefined), "light");
});

test("closing preserves detail content until its animation completes", () => {
  const openState: DetailState<string> = {
    phase: "open",
    rendered: "research",
  };

  assert.deepEqual(detailStateAfterChapterChange(openState, null), {
    phase: "closing",
    rendered: "research",
  });
});

test("reopening during close cancels the closing state", () => {
  const closingState: DetailState<string> = {
    phase: "closing",
    rendered: "research",
  };

  assert.deepEqual(detailStateAfterChapterChange(closingState, "skills"), {
    phase: "open",
    rendered: "skills",
  });
});
