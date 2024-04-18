export type Group = (typeof groups)[number]

export const groups = ['trades', 'predictions', 'admin'] as const
const commandGroupMap: Record<string, Group> = {
    actives: 'trades',
    add: 'trades',
    balance: 'trades',
    buy: 'trades',
    claim: 'trades',
    close: 'predictions',
    leaderboard: 'trades',
    movers: 'trades',
    news: 'trades',
    open: 'predictions',
    pay: 'trades',
    portfolio: 'trades',
    predict: 'predictions',
    remove: 'trades',
    sell: 'trades',
    settle: 'predictions',
    view: 'trades',
    watchlist: 'trades',
    whitelist: 'admin',
} as const

export default commandGroupMap
