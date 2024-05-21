function sample<T>(arr: readonly T[] | T[]): T {
    const sample = arr[Math.floor(Math.random() * arr.length)]
    if (!sample) throw new Error('Array is empty')
    return sample
}

const random = {
    sample,
}

export default random
