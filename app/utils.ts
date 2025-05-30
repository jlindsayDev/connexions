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
