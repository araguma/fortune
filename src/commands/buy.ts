import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Purchase shares')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(true),
        )
        .addNumberOption((option) =>
            option
                .setName('shares')
                .setDescription('Quantity of shares')
                .setRequired(false),
        )
        .addNumberOption((option) =>
            option
                .setName('dollars')
                .setDescription('Amount in dollars')
                .setRequired(false),
        )
        .toJSON(),
    handler: async (interaction) => {
        const symbol = (
            interaction.options.getString('symbol') ??
            (() => {
                throw new UserError('Symbol is required')
            })()
        ).toUpperCase()

        const snapshot = (await alpaca.snapshots([symbol]))[symbol]
        if (!snapshot) throw new UserError('Symbol not found')
        const quote = snapshot.latestTrade.p

        const quantity =
            interaction.options.getNumber('shares') ??
            (() => {
                const dollars =
                    interaction.options.getNumber('dollars') ??
                    (() => {
                        throw new UserError('Shares or Dollars is required')
                    })()
                return dollars / quote
            })()
        if (quantity <= 0)
            throw new UserError('Quantity must be greater than 0')

        const total = quote * quantity

        const client = await database.getClient(interaction.user.id)
        if (client.balance < total)
            throw new UserError(
                `Insufficient funds\nTotal: $${total.toFixed(2)}\nBalance: $${client.balance.toFixed(2)}`,
            )

        const share = client.portfolio.get(symbol)

        client.balance -= total
        client.portfolio.set(symbol, {
            quantity: (share?.quantity ?? 0) + quantity,
            seed: (share?.seed ?? 0) + total,
        })
        await client.save().catch(console.error)
        const transaction = await database.postTransaction(
            interaction.user.id,
            symbol,
            quantity,
        )

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '>>>',
                    },
                    title: `${symbol} Purchased`,
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
