import Client from '@/services/client'
import discord from '@/services/discord'
import yahoo from '@/services/yahoo'
import { timeframes, ViewReply } from '@/views/view'

export async function generateViewReply(symbol: string, timeframe: keyof typeof timeframes, userId: string) {
    const user = await discord.users.fetch(userId)
    const client = await Client.getClientByUserId(userId)

    const { duration, interval } = timeframes[timeframe]
    const start = new Date()
    const end = new Date()
    start.setDate(end.getDate() - duration)

    const quote = await yahoo.getQuote(symbol)
    const chart = await yahoo.getChart(symbol, start, end, interval)

    return new ViewReply({
        quote,
        chart,
        timeframe,
        client: client.model,
        userIcon: user.displayAvatarURL(),
    })
}
