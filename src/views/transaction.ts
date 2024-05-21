import {
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ButtonBuilder,
} from 'discord.js'

import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import { getEnvironmentVariable } from '@/libs/env'
import format from '@/libs/format'
import Pagination from '@/libs/pagination'
import Reply from '@/libs/reply'
import Tag from '@/libs/tag'
import { TransactionType } from '@/models/transaction'

const DESCRIPTION_LINE_LIMIT = parseInt(
    getEnvironmentVariable('DESCRIPTION_LINE_LIMIT'),
)
const variant = {
    claim: {
        author: '>>>',
        title: 'Claim Receipt',
    },
    buy: {
        author: '>>>',
        title: 'Buy Receipt',
    },
    sell: {
        author: '<<<',
        title: 'Sell Receipt',
    },
} as const

export class TransactionReply extends Reply<TransactionReplyData> {
    public constructor(data: TransactionReplyData) {
        super()
        this.update(data)
    }

    public override update({
        transactionId,
        transaction,
        clientIcon,
        page,
    }: TransactionReplyData) {
        const { description, stocks, total } = transaction.stocks.reduce(
            (accumulator, stock) => {
                const value = stock.shares * stock.price
                const description = [
                    format.symbol(stock.symbol),
                    format.shares(stock.shares),
                    '⋅',
                    format.value(stock.price),
                    '▸',
                    format.value(value),
                ].join(' ')
                accumulator.description.push(description)

                return {
                    description: accumulator.description,
                    stocks: accumulator.stocks + 1,
                    total: accumulator.total + value,
                }
            },
            {
                description: Array<string>(),
                stocks: 0,
                total: 0,
            },
        )

        const pagination = new Pagination(description, DESCRIPTION_LINE_LIMIT)
        pagination.setPage(page)

        const pageSelect = new StringSelectMenuBuilder()
            .setCustomId(
                new Tag()
                    .setCommand(transaction.type)
                    .setAction('page')
                    .setData('transactionId', transactionId)
                    .toCustomId(),
            )
            .setPlaceholder('Select page')
            .addOptions(
                Array(pagination.getPages())
                    .fill(0)
                    .map((_, index) => ({
                        label: (index + 1).toString(),
                        value: (index + 1).toString(),
                    })),
            )
        const row1 =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                pageSelect,
            )

        const { author, title } = variant[transaction.type]

        this.setCanvas(divider())
        this.setColor(Color.Blue)
        this.setAuthor({ name: author })
        this.setTitle(title)
        this.setDescription(pagination.getCurrent().join('\n') || 'None')
        this.setFields(
            {
                name: 'Stocks',
                value: stocks.toString(),
                inline: true,
            },
            {
                name: 'Total',
                value: format.value(total),
                inline: true,
            },
            {
                name: 'Page',
                value: `${pagination.getPage()} / ${pagination.getPages()}`,
                inline: true,
            },
        )
        this.setFooter({
            text: transactionId.toUpperCase(),
            iconURL: clientIcon,
        })

        const rows: ActionRowBuilder<
            StringSelectMenuBuilder | ButtonBuilder
        >[] = []
        if (pagination.getPages() > 1) rows.push(row1)
        this.setComponents(rows)
    }
}

export type TransactionReplyData = {
    transactionId: string
    transaction: TransactionType
    clientIcon: string
    page: number
}
