export const groups = ['predictions', 'trades'] as const

export default function getGroup(commandName: string) {
    return commandName === 'open' ? 'predictions' : 'trades'
}
