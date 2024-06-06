function inArray<T extends string>(array: readonly T[] | T[], value: string): value is T {
    return array.some((item) => item === value)
}

const narrow = {
    inArray,
}

export default narrow
