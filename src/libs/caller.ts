import callsites from 'callsites'

export function getCaller(position: number) {
    return callsites()[position]?.getFileName() ?? null
}
