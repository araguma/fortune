import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'
import { clamp } from '@/libs/number'
import yahoo from '@/libs/yahoo'

const limit = 64

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
        .addIntegerOption((option) =>
            option
                .setName('start')
                .setDescription('Start index')
                .setRequired(false),
        )
        .toJSON(),
    handler: async (interaction) => {
        const userId =
            interaction.options.getUser('user')?.id ?? interaction.user.id
        const start = interaction.options.getInteger('start') ?? 1

        if (start < 1) UserError.throw('Invalid start index')

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

        const end = client.portfolio.size - start
        const padding = client.portfolio.size.toString().length
        const display = Array.from(client.portfolio.entries()).slice(
            clamp(end - limit + 1, 0, client.portfolio.size),
            clamp(end + 1, 0, client.portfolio.size),
        )
        const description = display
            .map(([symbol, stock], index) => {
                const quote = quotes[symbol]
                if (!quote) UserError.throw(`Failed to get quote for ${symbol}`)
                const price = yahoo.getPrice(quote)
                const open = quote.regularMarketOpen || NaN
                const delta = (price - open) * stock.shares
                const value = price * stock.shares
                return [
                    `\`${(display.length - index + start - 1).toString().padStart(padding)}\``,
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
                {
                    name: 'Showing',
                    value: `${start}-${start + display.length - 1} of ${client.portfolio.size}`,
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
