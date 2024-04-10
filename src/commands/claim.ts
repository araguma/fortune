import { SlashCommandBuilder } from 'discord.js'
import prettyMilliseconds from 'pretty-ms'

import symbols from '@/data/symbols'
import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

const interval = 1800000

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Receive a random stock')
        .toJSON(),
    handler: async (interaction) => {
        const client = await database.getClient(interaction.user.id)

        const lastClaim = client.lastClaim.getTime()
        if (Date.now() - lastClaim < interval) {
            const timeLeft = prettyMilliseconds(
                interval - (Date.now() - lastClaim),
            )
            throw new UserError(`You can claim again in ${timeLeft}`)
        }

        const symbol = symbols[Math.floor(Math.random() * symbols.length)]
        if (!symbol) throw new Error('Failed to get symbol')

        const snapshot = (await alpaca.snapshots([symbol]))[symbol]
        if (!snapshot) throw new Error('Failed to get snapshot')
        const quote = snapshot.latestTrade.p

        const quantity = Math.floor(Math.random() * 19 + 1) / 10
        const total = quote * quantity
        const share = client.portfolio.get(symbol)

        client.portfolio.set(symbol, {
            quantity: (share?.quantity ?? 0) + quantity,
            seed: (share?.seed ?? 0) + total,
        })
        client.seed += total
        client.lastClaim = new Date()
        await client.save()
        const transaction = await database.postTransaction(
            interaction.user.id,
            symbol,
            quantity,
        )

        await interaction.reply({
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
                            value: `$${quote}`,
                            inline: true,
                        },
                        {
                            name: 'Quantity',
                            value: quantity.toString(),
                            inline: true,
                        },
                        {
                            name: 'Total',
                            value: `$${total.toFixed(2)}`,
                            inline: true,
                        },
                    ],
                    image: {
                        url: 'attachment://divider.png',
                    },
                    footer: {
                        text: transaction._id.toString().toUpperCase(),
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
