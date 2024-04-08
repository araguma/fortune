import { SlashCommandBuilder } from 'discord.js'

import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import divider from '@/images/divider'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove stock from watchlist')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const symbol = (
            interaction.options.getString('symbol') ??
            (() => {
                throw new UserError('Symbol is required')
            })()
        ).toUpperCase()

        const client = await database.getClient(interaction.user.id)
        if (!client.watchlist.includes(symbol))
            throw new UserError(`${symbol} is not in watchlist`)

        client.watchlist = client.watchlist.filter((s) => s !== symbol)
        await database.putClient(client)

        await interaction.reply({
            embeds: [
                {
                    author: {
                        name: '<<<',
                    },
                    title: `${symbol} Removed from Watchlist`,
                    image: {
                        url: 'attachment://divider.png',
                    },
                    footer: {
                        text: client._id.toString().toUpperCase(),
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
        })
    },
})
