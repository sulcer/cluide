const mac = navigator.userAgent.includes("Mac");

export const isMod = (e: KeyboardEvent | React.KeyboardEvent): boolean => (mac ? e.metaKey : e.ctrlKey);

export const MOD = mac ? "⌘" : "Ctrl";
