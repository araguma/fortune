import { SlashCommandBuilder } from 'discord.js'
import prettyMilliseconds from 'pretty-ms'

import symbols from '@/data/symbols'
import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Receive a random stock')
        .toJSON(),
    handler: async (interaction) => {
        const client = await database.getClient(interaction.user.id)

        const lastClaim = client.lastClaim.getTime()
        if (Date.now() - lastClaim < 3600000) {
            const timeLeft = prettyMilliseconds(
                3600000 - (Date.now() - lastClaim),
            )
            throw new UserError(`You can claim again in ${timeLeft}`)
        }

        const symbol = symbols[Math.floor(Math.random() * symbols.length)]
        if (!symbol) throw new Error('Failed to get symbol')

        const quantity =
            (await database.getShares(interaction.user.id, symbol))?.quantity ??
            0

        const shares = await database.putShares(
            interaction.user.id,
            symbol,
            quantity + 1,
            0,
        )

        client.lastClaim = new Date()
        await database.putClient(client)

        await interaction.reply({
            embeds: [
                {
                    color: 0x2ecc71,
                    author: {
                        name: '>>>',
                    },
                    title: `${symbol} Claimed`,
                    image: {
                        url: 'attachment://divider.png',
                    },
                    footer: {
                        text: shares._id.toString().toUpperCase(),
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
