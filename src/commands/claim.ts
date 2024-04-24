import { SlashCommandBuilder } from 'discord.js'
import prettyMilliseconds from 'pretty-ms'

import symbols from '@/data/symbols'
import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'

const interval = 1800000

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Receive a random stock')
        .toJSON(),
    handler: async (interaction) => {
        const client = await database.getClientByUserId(interaction.user.id)

        const lastClaim = client.lastClaim.getTime()
        if (Date.now() - lastClaim > interval) client.claims++

        if (client.claims <= 0) {
            const timeLeft = prettyMilliseconds(
                interval - (Date.now() - lastClaim),
            )
            UserError.throw(`You can claim again in ${timeLeft}`)
        }

        const symbol = symbols[Math.floor(Math.random() * symbols.length)]
        if (!symbol) throw new Error('Failed to get symbol')

        const snapshot = (await alpaca.getSnapshots([symbol]))[symbol]
        if (!snapshot) throw new Error('Failed to get snapshot')
        const quote = snapshot.latestTrade?.p || NaN
        if (isNaN(quote)) throw new Error('Failed to get quote')

        const shares = Math.floor(Math.random() * 19 + 1) / 10
        const total = quote * shares
        const current = client.portfolio.get(symbol)

        client.portfolio.set(symbol, {
            shares: (current?.shares ?? 0) + shares,
            seed: (current?.seed ?? 0) + total,
        })
        client.seed += total
        client.lastClaim = new Date()
        client.claims -= 1
        await client.save()
        const transaction = await database.postTransaction(
            interaction.user.id,
            [
                {
                    symbol,
                    shares,
                },
            ],
        )

        return {
            embeds: [
                {
                    color: 0x2ecc71,
                    author: {
                        name: '>>>',
                    },
                    title: `${symbol} Claimed`,
                    fields: [
                        {
                            name: 'Quote',
                            value: format.currency(quote),
                            inline: true,
                        },
                        {
                            name: 'Shares',
                            value: shares.toString(),
                            inline: true,
                        },
                        {
                            name: 'Total',
                            value: format.currency(total),
                            inline: true,
                        },
                    ],
                    image: {
                        url: 'attachment://divider.png',
                    },
                    footer: {
                        text:
                            transaction._id.toString().toUpperCase() +
                            `  •  ${client.claims} Claims Left`,
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
