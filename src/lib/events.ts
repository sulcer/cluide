// cluide:save reaches every mounted useDraft; only one editor is ever mounted today (nice-to-have.md).
export type CluideEvent =
  | "cluide:save" | "cluide:escape" | "cluide:primary"
  | "cluide:offline" | "cluide:online" | "cluide:retry";

export const emit = (name: CluideEvent): void => {
  window.dispatchEvent(new Event(name));
};
