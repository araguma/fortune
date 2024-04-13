import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add stock to watchlist')
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

        const snapshot = (await alpaca.getSnapshots([symbol]))[symbol]
        if (!snapshot) UserError.throw(`Invalid symbol: ${symbol}`)

        const client = await database.getClient(interaction.user.id)
        if (client.watchlist.includes(symbol))
            UserError.throw(`${symbol} is already in watchlist`)

        client.watchlist.push(symbol)
        await client.save()

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '>>>',
                    },
                    title: `${symbol} Added to Watchlist`,
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
