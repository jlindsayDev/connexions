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

export const partition = (
    arr: Array<any>,
    partitionFn: (arg0: any) => boolean,
) =>
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
    const bytes = Uint8Array.from<string>(binString, (m) => m.codePointAt(0)!);
    return new TextDecoder().decode(bytes);
};

export const toBase64 = (text: string) => {
    const bytes = new TextEncoder().encode(text);
    const binString = Array.from(bytes, (byte) =>
        String.fromCodePoint(byte),
    ).join("");
    return btoa(binString);
};
