import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js'

import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import { TransactionReply } from '@/libs/reply/transaction'
import { Stock } from '@/types'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Purchase stocks')
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('max')
                .setDescription('Exhaust balance')
                .addStringOption((option) =>
                    option
                        .setName('symbol')
                        .setDescription('Stock ticker')
                        .setRequired(true),
                ),
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('share')
                .setDescription('Purchase by shares')
                .addStringOption((option) =>
                    option
                        .setName('symbol')
                        .setDescription('Stock ticker')
                        .setRequired(true),
                )
                .addNumberOption((option) =>
                    option
                        .setName('shares')
                        .setDescription('Number of shares')
                        .setRequired(true),
                ),
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('value')
                .setDescription('Purchase by value')
                .addStringOption((option) =>
                    option
                        .setName('symbol')
                        .setDescription('Stock ticker')
                        .setRequired(true),
                )
                .addNumberOption((option) =>
                    option
                        .setName('value')
                        .setDescription('Total stock value')
                        .setRequired(true),
                ),
        )
        .toJSON(),
    handler: async (interaction) => {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const msElapsed = new Date().getTime() - start.getTime()
        if (msElapsed > 16 * 60 * 60 * 1000 || msElapsed < 9.5 * 60 * 60 * 1000)
            UserError.throw('Market closed')

        const client = await database.getClientByUserId(interaction.user.id)

        const cart: Stock[] = []
        switch (interaction.options.getSubcommand()) {
            case 'max': {
                const symbol = interaction.options
                    .getString('symbol', true)
                    .toUpperCase()
                const snapshot = (await alpaca.getSnapshots([symbol]))[symbol]
                if (!snapshot) UserError.throw('Failed to get snapshot')
                const quote =
                    snapshot.minuteBar?.c || snapshot.latestTrade?.p || NaN
                const shares = client.balance / quote
                cart.push({ symbol, shares })
                break
            }
            case 'share': {
                const symbol = interaction.options
                    .getString('symbol', true)
                    .toUpperCase()
                const shares = interaction.options.getNumber('shares', true)
                cart.push({ symbol, shares })
                break
            }
            case 'value': {
                const symbol = interaction.options
                    .getString('symbol', true)
                    .toUpperCase()
                const value = interaction.options.getNumber('value', true)
                const snapshot = (await alpaca.getSnapshots([symbol]))[symbol]
                if (!snapshot) UserError.throw('Failed to get snapshot')
                const quote =
                    snapshot.minuteBar?.c || snapshot.latestTrade?.p || NaN
                const shares = value / quote
                cart.push({ symbol, shares })
                break
            }
        }

        const snapshots = await alpaca.getSnapshots(
            cart.map((stock) => stock.symbol),
        )
        cart.forEach((stock) => {
            if (stock.shares <= 0) UserError.throw('Invalid shares')

            const snapshot = snapshots[stock.symbol]
            if (!snapshot) throw new Error('Failed to get snapshot')
            const quote =
                snapshot.minuteBar?.c || snapshot.latestTrade?.p || NaN

            const total = quote * stock.shares
            if (isNaN(total)) UserError.throw('Failed to get total')
            if (client.balance < total) UserError.throw('Insufficient funds')

            const current = client.portfolio.get(stock.symbol)

            client.balance -= total
            client.portfolio.set(stock.symbol, {
                shares: (current?.shares ?? 0) + stock.shares,
                seed: (current?.seed ?? 0) + total,
            })
        })
        await client.save()
        const transaction = await database.postTransaction(client.userId, cart)

        return new TransactionReply(
            'buy',
            snapshots,
            cart,
            transaction._id.toString(),
        ).toJSON()
    },
})
