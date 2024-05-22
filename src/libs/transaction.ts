import { StringSelectMenuInteraction } from 'discord.js'

import Tag from '@/libs/tag'
import discord from '@/services/discord'
import Transaction from '@/services/transaction'
import { TransactionReply } from '@/views/transaction'
import Client from '@/services/client'
import UserError from '@/errors/user'
import { generateViewReply } from '@/libs/view'

export async function handleTransactionStringSelectMenu(
    interaction: StringSelectMenuInteraction,
) {
    const tag = new Tag(interaction.customId)

    switch (tag.getAction(true)) {
        case 'view': {
            const client = await Client.findById(tag.getData('clientId', true))
            const symbol = interaction.values[0]
            const userId = client.model.userId

            if (!symbol) UserError.missingSymbol()

            const reply = await generateViewReply(symbol, '5Y', userId)
            await interaction.reply(reply)
            break
        }
        case 'page': {
            const transactionId = tag.getData('transactionId', true)

            const reply = await generateTransactionReply(
                transactionId,
                parseInt(interaction.values[0] ?? '1'),
            )
            await interaction.update(reply)
            break
        }
    }
}

export async function generateTransactionReply(
    transactionId: string,
    page: number,
) {
    const transaction = await Transaction.findById(transactionId)
    const user = await discord.users.fetch(transaction.model.userId)

    return new TransactionReply({
        transactionId,
        transaction: transaction.model,
        clientIcon: user.displayAvatarURL(),
        page,
    })
}
