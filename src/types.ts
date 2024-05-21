export type Omit<T, K extends PropertyKey> = {
    [P in keyof T as P extends K ? never : P]: T[P]
}
