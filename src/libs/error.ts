export class UserError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserError'
    }
    static throw(message: string): never {
        throw new UserError(message)
    }
}
