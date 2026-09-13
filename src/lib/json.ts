export const jsonText = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

// "line 18 · unexpected token }" from the browser's JSON.parse message; "" when the text parses.
export function describeJsonError(text: string): string {
  try {
    JSON.parse(text);
    return "";
  } catch (e) {
    const message = (e as Error).message;
    const line = /line (\d+)/.exec(message)?.[1];
    const what = message
      .replace(/^JSON\.parse: |^JSON Parse error: /, "")
      .split(/ in JSON| \(line/)[0]
      .toLowerCase();
    return line ? `line ${line} · ${what}` : what;
  }
}
