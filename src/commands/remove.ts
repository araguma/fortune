import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

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
        const symbol = interaction.options
            .getString('symbol', true)
            .toUpperCase()

        const client = await database.getClient(interaction.user.id)
        if (!client.watchlist.includes(symbol))
            UserError.throw(`${symbol} is not in watchlist`)

        client.watchlist = client.watchlist.filter((s) => s !== symbol)
        await client.save()

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
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
