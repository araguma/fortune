import {
    ChatInputCommandInteraction,
    InteractionReplyOptions,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js'

export type Command = {
    descriptor: RESTPostAPIChatInputApplicationCommandsJSONBody
    handler: (
        interaction: ChatInputCommandInteraction,
    ) => Promise<InteractionReplyOptions>
}

export type Stock = {
    symbol: string
    shares: number
}

export type StockSnapshotsResponse<T extends string> = Record<T, Snapshot>
export type CryptoSnapshotsResponse<T extends string> = {
    snapshots: Record<T, Snapshot>
}
export type HistoricalBarsResponse<T extends string> = {
    bars: Record<T, Bar[]>
    next_page_token: string | null
}
export type ActivesResponse = {
    most_actives: Active[]
    last_updated: string
}
export type MoversResponse = {
    gainers: Mover[]
    losers: Mover[]
    market_type: 'stocks' | 'crypto'
    last_updated: string
}
export type NewsResponse = {
    news: News[]
    next_page_token: string | null
}

export type Snapshot = {
    dailyBar?: Bar
    latestQuote?: LatestQuote
    latestTrade?: LatestTrade
    minuteBar?: Bar
    prevDailyBar?: Bar
}

export type Bar = {
    c: number
    h: number
    l: number
    n: number
    o: number
    t: string
    v: number
    vw: number
}

export type LatestQuote = {
    ap: number
    as: number
    ax: string
    bp: number
    bs: number
    bx: string
    c: string[]
    t: string
    z: string
}

export type LatestTrade = {
    c: string[]
    i: number
    p: number
    s: number
    t: string
    x: string
    z: string
}

export type Point = {
    x: number
    y: number
}

export type Active = {
    symbol: string
    trade_count: number
    volume: number
}

export type Mover = {
    symbol: string
    price: number
    change: number
    percent_change: number
}

export type News = {
    author: string
    content: string
    created_at: string
    headline: string
    id: number
    images: {
        size: string
        url: string
    }[]
    source: string
    summary: string
    symbols: string[]
    updated_at: string
    url: string | null
}
