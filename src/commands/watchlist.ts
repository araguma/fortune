import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import format from '@/libs/format'
import yahoo from '@/libs/yahoo'
import { UserError } from '@/libs/error'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('watchlist')
        .setDescription('View watchlist')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('Target user')
                .setRequired(false),
        )
        .toJSON(),
    handler: async (interaction) => {
        const userId =
            interaction.options.getUser('user')?.id ?? interaction.user.id
        const user = await discord.users.fetch(userId)
        const client = await database.getClientByUserId(userId)

        const quotes = await yahoo.getQuotes(client.watchlist)

        const description = client.watchlist
            .map((symbol) => {
                const quote = quotes[symbol]
                if (!quote)
                    UserError.throw(`Failed to get quote for ${symbol}`)
                const price = yahoo.getPrice(quote)
                const open = quote.regularMarketOpen || NaN
                return [
                    price - open >= 0 ? '▴' : '▾',
                    format.bold(symbol),
                    format.currency(price),
                    `(${format.percentage((price - open) / open)})`,
                ].join(' ')
            })
            .join('\n')

        return {
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Watchlist',
                    description:
                        description.substring(0, 4096) || '> *No stocks found*',
                    image: {
                        url: 'attachment://divider.png',
                    },
                    footer: {
                        text: client._id.toString().toUpperCase(),
                        icon_url: user.displayAvatarURL(),
                    },
                    timestamp: new Date().toISOString(),
                },
            ],
            files: [
                {
                    attachment: divider(),
                    name: 'divider.png',
                },
            ],
        }
    },
})
