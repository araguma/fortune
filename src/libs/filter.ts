export function filterStocks(symbols: string[]) {
    return symbols.filter((symbol) => !symbol.includes('/'))
}

export function filterCrypto(symbols: string[]) {
    return symbols.filter((symbol) => symbol.includes('/'))
}
