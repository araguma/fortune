import { SlashCommandBuilder } from 'discord.js'
import prettyMilliseconds from 'pretty-ms'

import symbols from '@/data/symbols'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import { clamp } from '@/libs/number'
import { TransactionReply } from '@/libs/reply/transaction'
import yahoo from '@/libs/yahoo'
import { Stock } from '@/types'

const interval = 3600000
const stockpileLimit = 12

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Receive a random stock')
        .toJSON(),
    handler: async (interaction) => {
        const client = await database.getClientByUserId(interaction.user.id)

        const lastClaim = client.lastClaim.getTime()
        const offset = (Date.now() - lastClaim) % interval
        client.claims += clamp(
            Math.floor((Date.now() - lastClaim) / interval),
            0,
            stockpileLimit,
        )

        if (client.claims <= 0) {
            const timeLeft = prettyMilliseconds(
                interval - (Date.now() - lastClaim),
            )
            UserError.throw(`You can claim again in ${timeLeft}`)
        }

        const cart: Stock[] = []
        for (let i = 0; i < client.claims; i++) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)]
            if (!symbol) UserError.throw(`Failed to get quote for ${symbol}`)
            const shares = Math.floor(Math.random() * 19 + 1) / 10
            cart.push({ symbol, shares })
        }

        let total = 0
        const quotes = await yahoo.getQuotes(cart.map((stock) => stock.symbol))
        cart.forEach((stock) => {
            const quote = quotes[stock.symbol]
            if (!quote)
                UserError.throw(`Failed to get snapshot for ${stock.symbol}`)
            const price = yahoo.getPrice(quote)
            if (isNaN(price))
                UserError.throw(`Failed to get price for ${stock.symbol}`)

            const value = stock.shares * price
            total += value

            const current = client.portfolio.get(stock.symbol)
            client.portfolio.set(stock.symbol, {
                shares: (current?.shares ?? 0) + stock.shares,
                seed: (current?.seed ?? 0) + value,
            })
        })
        client.seed += total
        client.claims = 0
        client.lastClaim = new Date(Date.now() - offset)
        await client.save()
        const transaction = await database.postTransaction(client.userId, cart)

        return new TransactionReply(
            'claim',
            quotes,
            cart,
            transaction._id.toString(),
        ).toJSON()
    },
})
