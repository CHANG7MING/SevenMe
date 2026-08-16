export type ResolvedTheme = "light" | "dark";

export function resolveInitialTheme(theme: string | undefined): ResolvedTheme {
  return theme === "dark" ? "dark" : "light";
}

export type DetailState<T> =
  | { phase: "closed"; rendered: null }
  | { phase: "open"; rendered: T }
  | { phase: "closing"; rendered: T };

export function detailStateAfterChapterChange<T>(
  state: DetailState<T>,
  chapter: T | null,
): DetailState<T> {
  if (chapter) {
    return { phase: "open", rendered: chapter };
  }
  if (state.rendered) {
    return { phase: "closing", rendered: state.rendered };
  }
  return state;
}

export function closedDetailState<T>(): DetailState<T> {
  return { phase: "closed", rendered: null };
}
