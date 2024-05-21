import Client from '@/services/client'
import discord from '@/services/discord'
import yahoo from '@/services/yahoo'
import { PortfolioReply } from '@/views/portfolio'

export async function generatePortfolioReply(userId: string, page: number) {
    const user = await discord.users.fetch(userId)
    const client = await Client.getClientByUserId(userId)

    const quotes = await yahoo.getQuotes(client.getPortfolioStocks())

    return new PortfolioReply({
        quotes,
        clientId: client.getId(),
        client: client.model,
        userIcon: user.displayAvatarURL(),
        page,
    })
}
