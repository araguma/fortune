import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'
import yahoo from '@/libs/yahoo'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('portfolio')
        .setDescription('Display portfolio')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('Target user')
                .setRequired(false),
        )
        .toJSON(),
    handler: async (interaction) => {
        const userId =
            interaction.options.getUser('user')?.id ?? interaction.user.id
        const user = await discord.users.fetch(userId)
        const client = await database.getClientByUserId(userId)
        const quotes = await yahoo.getQuotes(
            Array.from(client.portfolio.keys()),
        )

        const { value, delta } = Array.from(client.portfolio.entries()).reduce(
            (acc, [symbol, stock]) => {
                const quote = quotes[symbol]
                if (!quote) UserError.throw(`Failed to get quote for ${symbol}`)
                const price = yahoo.getPrice(quote)
                const open = quote.regularMarketOpen || NaN
                return {
                    value: acc.value + price * stock.shares,
                    delta: acc.delta + (price - open) * stock.shares,
                }
            },
            { value: 0, delta: 0 },
        )
        const total = value + client.balance
        const profit = parseFloat((total - client.seed).toFixed(5))

        await client.save()

        const padding = client.portfolio.size.toString().length
        const description = Array.from(client.portfolio.entries())
            .map(([symbol, stock], index) => {
                const quote = quotes[symbol]
                if (!quote) UserError.throw(`Failed to get quote for ${symbol}`)
                const price = yahoo.getPrice(quote)
                const open = quote.regularMarketOpen || NaN
                const delta = (price - open) * stock.shares
                const value = price * stock.shares
                return [
                    `\`${(client.portfolio.size - index).toString().padStart(padding)}\``,
                    delta >= 0 ? '▴' : '▾',
                    format.bold(symbol),
                    format.shares(stock.shares),
                    '⋅',
                    format.currency(price),
                    '▸',
                    format.currency(value),
                    `(${format.percentage(delta / value)})`,
                ].join(' ')
            })
            .join('\n')
        const embed = {
            color: delta > 0 ? 0x2ecc71 : delta < 0 ? 0xe74c3c : 0x3498db,
            author: {
                name: '---',
            },
            title: 'Portfolio',
            description:
                description.substring(0, 4096) || '> *No stocks found*',
            fields: [
                {
                    name: 'Value',
                    value: [
                        format.currency(value),
                        `(${format.percentage(delta / Math.abs(value))})`,
                    ].join(' '),
                    inline: true,
                },
                {
                    name: 'Balance',
                    value: format.currency(client.balance),
                    inline: true,
                },
                {
                    name: 'Total',
                    value: [
                        format.currency(total),
                        `(${format.percentage(delta / Math.abs(total))})`,
                    ].join(' '),
                    inline: true,
                },
                {
                    name: 'Delta',
                    value: format.currency(delta),
                    inline: true,
                },
                {
                    name: 'Seed',
                    value: format.currency(client.seed),
                    inline: true,
                },
                {
                    name: 'Profit',
                    value: [
                        format.currency(profit),
                        `(${format.percentage(delta / Math.abs(profit))})`,
                    ].join(' '),
                    inline: true,
                },
            ],
            image: {
                url: 'attachment://divider.png',
            },
            footer: {
                text: client._id.toString().toUpperCase(),
                icon_url: user.displayAvatarURL(),
            },
            timestamp: new Date().toISOString(),
        }

        return {
            embeds: [embed],
            files: [
                {
                    attachment: divider(),
                    name: 'divider.png',
                },
            ],
        }
    },
})
