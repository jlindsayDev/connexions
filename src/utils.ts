export const requestNotifications = async (e: MouseEvent) => {
  const button = e.target as HTMLButtonElement;

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    new Notification("LEVEL UP", { body: "You did it!" });
    button.disabled = true;
    // button.style.display = "none";
  }
};

export const pad = (i: number) => i.toString().padStart(2, "0");
export const padNums = (...ns: number[]) =>
  ns.map((n) => n.toString().padStart(2, "0")).join("-");
export const padDate = (date: Date) =>
  padNums(date.getFullYear(), date.getMonth(), date.getDate());

export const range = (start: number, stop: number, step = 1) =>
  Array.from(
    { length: Math.ceil((stop - start) / step) },
    (_, i) => start + i * step,
  );

export const partition = <T extends never>(
  arr: Array<T>,
  partitionFn: (arg0: T) => boolean,
): [T[], T[]] =>
  arr.reduce(
    (acc, v) => {
      acc[partitionFn(v) ? 0 : 1].push(v);
      return acc;
    },
    [[], []],
  );

// https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#unicode_strings
export const fromBase64 = (base64: string) => {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const toBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  return btoa(binString);
};
