export type Group = (typeof groups)[number]

export const groups = ['trades', 'predictions', 'threads', 'admin'] as const
const commandGroupMap: Record<string, Group> = {
    actives: 'trades',
    add: 'trades',
    balance: 'trades',
    buy: 'trades',
    claim: 'trades',
    close: 'threads',
    leaderboard: 'trades',
    movers: 'trades',
    news: 'trades',
    open: 'predictions',
    pay: 'trades',
    portfolio: 'trades',
    predict: 'threads',
    remove: 'trades',
    sell: 'trades',
    settle: 'threads',
    view: 'trades',
    watchlist: 'trades',
    whitelist: 'admin',
} as const

export default commandGroupMap
