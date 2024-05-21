import { StringSelectMenuInteraction } from 'discord.js'

import Tag from '@/libs/tag'
import discord from '@/services/discord'
import Transaction from '@/services/transaction'
import { TransactionReply } from '@/views/transaction'

export async function handleTransactionStringSelectMenu(
    interaction: StringSelectMenuInteraction,
) {
    const tag = new Tag(interaction.customId)

    switch (tag.getAction(true)) {
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
