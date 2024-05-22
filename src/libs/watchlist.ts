import Client from '@/services/client'
import discord from '@/services/discord'
import yahoo from '@/services/yahoo'
import { WatchlistReply } from '@/views/watchlist'

export async function generateWatchlistReply(userId: string, page: number) {
    const client = await Client.getClientByUserId(userId)
    const user = await discord.users.fetch(userId)
    const quotes = await yahoo.getQuotes(client.model.watchlist)

    return new WatchlistReply({
        quotes,
        clientId: client.getId(),
        client: client.model,
        userIcon: user.displayAvatarURL(),
        page,
    })
}
