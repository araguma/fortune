import { SlashCommandBuilder } from 'discord.js'
import prettyMilliseconds from 'pretty-ms'

import symbols from '@/data/symbols'
import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import { clamp } from '@/libs/number'
import { TransactionReply } from '@/libs/reply/transaction'
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
            if (!symbol) throw new Error('Failed to get symbol')
            const shares = Math.floor(Math.random() * 19 + 1) / 10
            cart.push({ symbol, shares })
        }

        let total = 0
        const snapshots = await alpaca.getSnapshots(
            cart.map((stock) => stock.symbol),
        )
        cart.forEach((stock) => {
            const snapshot = snapshots[stock.symbol]
            if (!snapshot)
                UserError.throw(`Failed to get snapshot for ${stock.symbol}`)
            const quote =
                snapshot.minuteBar?.c || snapshot.latestTrade?.p || NaN

            const value = quote * stock.shares
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
            snapshots,
            cart,
            transaction._id.toString(),
        ).toJSON()
    },
})
