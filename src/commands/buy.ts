import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js'
import prettyMilliseconds from 'pretty-ms'

import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import { TransactionReply } from '@/libs/reply/transaction'
import yahoo from '@/libs/yahoo'
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
        const clock = await alpaca.getClock()
        if (!clock.is_open) {
            const nextOpen = new Date(clock.next_open).getTime()
            const timeLeft = nextOpen - Date.now()
            UserError.throw(`Market opens in ${prettyMilliseconds(timeLeft)}`)
        }

        const client = await database.getClientByUserId(interaction.user.id)

        const cart: Stock[] = []
        switch (interaction.options.getSubcommand()) {
            case 'max': {
                const symbol = interaction.options
                    .getString('symbol', true)
                    .toUpperCase()
                const quote = (await yahoo.getQuotes([symbol]))[symbol]
                if (!quote) UserError.throw('Failed to get snapshot')
                const price = yahoo.getPrice(quote)
                const shares = client.balance / price
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
                const quote = (await yahoo.getQuotes([symbol]))[symbol]
                if (!quote) UserError.throw('Failed to get snapshot')
                const price = yahoo.getPrice(quote)
                const shares = value / price
                cart.push({ symbol, shares })
                break
            }
        }

        const quotes = await yahoo.getQuotes(cart.map((stock) => stock.symbol))
        cart.forEach((stock) => {
            if (stock.shares <= 0) UserError.throw('Invalid shares')

            const quote = quotes[stock.symbol]
            if (!quote)
                UserError.throw(`Failed to get quote for ${stock.symbol}`)
            const price = yahoo.getPrice(quote)

            const total = price * stock.shares
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
            quotes,
            cart,
            transaction._id.toString(),
        ).toJSON()
    },
})
