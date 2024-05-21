function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

const number = {
    clamp,
}

export default number
