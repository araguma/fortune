import codec from '@/libs/codec'

export default class Tag {
    private command: string | null = null
    private action: string | null = null
    private field: string | null = null
    private data: Record<string, string> = {}

    public constructor(customId?: string) {
        if (customId) this.setCustomId(customId)
    }

    public setCustomId(customId: string) {
        const sectors = customId.split('.')
        const entries = sectors[3]?.split('-') ?? []
        this.command = sectors[0] || null
        this.action = sectors[1] || null
        this.field = sectors[2] || null
        this.data = Object.fromEntries(
            entries.map((entry) => {
                const [key, value] = entry.split(':')
                return [key ?? '', value ?? ''] as const
            }),
        )
        return this
    }

    public toCustomId() {
        return `${this.command ?? ''}.${this.action ?? ''}.${this.field ?? ''}.${Object.entries(
            this.data,
        )
            .map(([key, value]) => `${key}:${value}`)
            .join('-')}`
    }

    public setCommand(command: string) {
        this.command = command
        return this
    }

    public getCommand(required: true): string
    public getCommand(required?: false): string | null
    public getCommand(required?: boolean): string | null {
        if (required && !this.command)
            throw new Error('Missing required command')
        return this.command ?? null
    }

    public setAction(action: string) {
        this.action = action
        return this
    }

    public getAction(required: true): string
    public getAction(required?: false): string | null
    public getAction(required?: boolean): string | null {
        if (required && !this.action) throw new Error('Missing required action')
        return this.action ?? null
    }

    public setField(field: string) {
        this.field = field
        return this
    }

    public getField(required: true): string
    public getField(required?: false): string | null
    public getField(required?: boolean): string | null {
        if (required && !this.field) throw new Error('Missing required field')
        return this.field ?? null
    }

    public setData(key: string, value: string) {
        this.data[key] = codec.encode(value)
        return this
    }

    public getData(key: string, required: true): string
    public getData(key: string, required?: false): string | null
    public getData(key: string, required?: boolean): string | null {
        const value = this.data[key]
        if (required && !value) throw new Error(`Missing required data: ${key}`)
        return value ? codec.decode(value) : null
    }
}
