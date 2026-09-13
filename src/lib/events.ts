// cluide:save broadcasts to every mounted useDraft, not just the active one. Today exactly one
// editor is ever mounted at a time, so this is unobserved in practice — see nice-to-have.md.
export type CluideEvent =
  | "cluide:save" | "cluide:escape" | "cluide:primary"
  | "cluide:offline" | "cluide:online" | "cluide:retry";

export const emit = (name: CluideEvent): void => {
  window.dispatchEvent(new Event(name));
};
