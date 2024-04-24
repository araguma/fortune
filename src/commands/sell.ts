import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js'

import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import { TransactionReply } from '@/libs/reply/transaction'
import { Stock } from '@/types'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sell shares')
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('all')
                .setDescription('Sell everything'),
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('stock')
                .setDescription('Sell by stock')
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
                .setDescription('Sell by shares')
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
                .setDescription('Sell by value')
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
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('gain')
                .setDescription('Sell all stocks with gain')
                .addStringOption((option) =>
                    option
                        .setName('timeframe')
                        .setDescription('Timeframe to consider')
                        .addChoices(
                            {
                                name: 'Today',
                                value: 'today',
                            },
                            {
                                name: 'Max',
                                value: 'max',
                            },
                        )
                        .setRequired(true),
                ),
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName('loss')
                .setDescription('Sell all stocks with loss')
                .addStringOption((option) =>
                    option
                        .setName('timeframe')
                        .setDescription('Timeframe to consider')
                        .addChoices(
                            {
                                name: 'Today',
                                value: 'today',
                            },
                            {
                                name: 'Max',
                                value: 'max',
                            },
                        )
                        .setRequired(true),
                ),
        )
        .toJSON(),
    handler: async (interaction) => {
        const client = await database.getClientByUserId(interaction.user.id)
        const snapshots = await alpaca.getSnapshots(
            Array.from(client.portfolio.keys()),
        )

        const cart: Stock[] = []
        switch (interaction.options.getSubcommand(true)) {
            case 'all': {
                client.portfolio.forEach((stock, symbol) => {
                    cart.push({ symbol, shares: stock.shares })
                })
                break
            }
            case 'stock': {
                const symbol = interaction.options
                    .getString('symbol', true)
                    .toUpperCase()
                const current =
                    client.portfolio.get(symbol) ??
                    UserError.throw('Stock not owned')
                cart.push({ symbol, shares: current.shares })
                break
            }
            case 'share': {
                const symbol = interaction.options
                    .getString('symbol', true)
                    .toUpperCase()
                const shares = interaction.options.getNumber('shares', true)
                const current = client.portfolio.get(symbol)
                if (!current) UserError.throw('Stock not owned')
                cart.push({ symbol, shares })
                break
            }
            case 'value': {
                const symbol = interaction.options
                    .getString('symbol', true)
                    .toUpperCase()
                const value = interaction.options.getNumber('value', true)
                const snapshot = snapshots[symbol]
                if (!snapshot) UserError.throw(`Invalid symbol: ${symbol}`)
                const current = client.portfolio.get(symbol)
                if (!current) UserError.throw('Stock not owned')
                const quote = snapshot.latestTrade?.p || NaN
                const shares = value / quote
                cart.push({ symbol, shares })
                break
            }
            case 'gain': {
                client.portfolio.forEach((stock, symbol) => {
                    const snapshot = snapshots[symbol]
                    if (!snapshot) UserError.throw(`Invalid symbol: ${symbol}`)
                    const quote = snapshot.latestTrade?.p || NaN
                    if (stock.shares * quote > stock.seed)
                        cart.push({ symbol, shares: stock.shares })
                })
                break
            }
            case 'loss': {
                client.portfolio.forEach((stock, symbol) => {
                    const snapshot = snapshots[symbol]
                    if (!snapshot) UserError.throw('Failed to get snapshot')
                    const quote = snapshot.latestTrade?.p || NaN
                    if (stock.shares * quote < stock.seed)
                        cart.push({ symbol, shares: stock.shares })
                })
                break
            }
            default: {
                UserError.throw('Invalid subcommand')
            }
        }

        cart.forEach((stock) => {
            if (stock.shares <= 0) UserError.throw('Invalid shares')

            const snapshot = snapshots[stock.symbol]
            if (!snapshot) UserError.throw('Failed to get snapshot')
            const current = client.portfolio.get(stock.symbol)
            if (!current) UserError.throw('Stock not owned')
            const quote = snapshot.latestTrade?.p || NaN
            if (isNaN(quote)) UserError.throw('Failed to get quote')

            if (current.shares < stock.shares)
                UserError.throw('Insufficient shares')

            if (current.shares === stock.shares) {
                client.portfolio.delete(stock.symbol)
            } else if (current.shares > stock.shares) {
                client.portfolio.set(stock.symbol, {
                    shares: current.shares - stock.shares,
                    seed: current.seed,
                })
            }

            client.balance += stock.shares * quote
        })
        await client.save()
        const transaction = await database.postTransaction(
            client.userId,
            cart.map((stock) => ({
                symbol: stock.symbol,
                shares: -stock.shares,
            })),
        )

        return new TransactionReply(
            'sell',
            snapshots,
            cart,
            transaction._id.toString(),
        ).toJSON()
    },
})
