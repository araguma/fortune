import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sell shares')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(true),
        )
        .addIntegerOption((option) =>
            option
                .setName('shares')
                .setDescription('Quantity of shares')
                .setRequired(false),
        )
        .addIntegerOption((option) =>
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
            interaction.options.getInteger('shares') ??
            (() => {
                const dollars =
                    interaction.options.getInteger('dollars') ??
                    (() => {
                        throw new UserError('Shares or Dollars is required')
                    })()
                return dollars / quote
            })()
        const total = quote * quantity

        const client = await database.getClient(interaction.user.id)

        const shares = await database.getShares(interaction.user.id, symbol)
        if (!shares || shares.quantity < quantity)
            throw new UserError('Insufficient shares')

        client.balance += total
        await database.putClient(client)
        await database.putShares(
            interaction.user.id,
            symbol,
            shares.quantity - quantity,
            shares.seed - total,
        )
        const transaction = await database.postTransaction(
            interaction.user.id,
            'sell',
            symbol,
            quantity,
            total,
        )

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '<<<',
                    },
                    title: `${symbol} Sold`,
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
