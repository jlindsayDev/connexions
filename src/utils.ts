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
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const fromBase64 = (base64: string) => {
    const binString = atob(base64);
    const bytes = Uint8Array.from<string>(
        binString,
        (m) => m.codePointAt(0) ?? -99,
    );
    return textDecoder.decode(bytes);
};

export const toBase64 = (text: string) => {
    const bytes = textEncoder.encode(text);
    const binString = Array.from(bytes, (byte) =>
        String.fromCodePoint(byte),
    ).join("");
    return btoa(binString);
};

export const showChangeOnAdd = <T>(
    callbackFn: Function,
    xs: T[],
    x: T,
): void => {
    // callbackFn(xs => {
    //     console.log(`BEFORE ${callbackFn.name}: ${xs}`);
    //     xs = [...xs, x]
    //     console.log()
    //     return xs
    // })
    // callbackFn([...xs, x]);
    // console.log(`AFTER ${callbackFn.name}:`);
};

export const showChangeOnRemove = <T>(callbackFn: Function): void => {};
