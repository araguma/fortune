import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'
import { PredictionReply } from '@/libs/reply/prediction'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('predict')
        .setDescription('Bet on an outcome')
        .addIntegerOption((option) =>
            option
                .setName('option')
                .setDescription('Option number')
                .setRequired(true),
        )
        .addNumberOption((option) =>
            option
                .setName('amount')
                .setDescription('Amount to bet')
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const client = await database.getClientByUserId(interaction.user.id)
        const option = interaction.options.getInteger('option', true) - 1
        const amount = interaction.options.getNumber('amount', true)
        const thread = interaction.channel

        if (!thread?.isThread())
            UserError.throw('Command can only be used in threads')

        const prediction = await database
            .getPredictionByThreadId(thread.id)
            .catch(() => UserError.throw('Failed to fetch prediction'))

        if (amount < prediction.minimum)
            UserError.throw(
                `Minimum bet is ${format.currency(prediction.minimum)}`,
            )
        if (option < 0 || option >= prediction.options.length)
            UserError.throw('Invalid option')
        if (prediction.status !== 'opened')
            UserError.throw('Prediction is not open')

        const bet = prediction.bets.get(interaction.user.id)

        client.balance -= amount - (bet?.amount ?? 0)
        if (client.balance < 0) UserError.throw('Insufficient balance')
        await client.save()

        if (bet) {
            prediction.pool[bet.option] =
                (prediction.pool[bet.option] ?? 0) - bet.amount
        }
        prediction.pool[option] = (prediction.pool[option] ?? 0) + amount
        prediction.bets.set(interaction.user.id, {
            option,
            amount,
        })

        const lastMessage = await interaction.channel?.messages.fetch(
            prediction.lastMessageId ?? '',
        )
        await lastMessage?.delete().catch(() => {})

        const message = await thread.send(
            new PredictionReply(prediction).toJSON(),
        )
        prediction.lastMessageId = message.id
        await prediction.save()

        return {
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Prediction Placed',
                    fields: [
                        {
                            name: 'Option',
                            value:
                                prediction.options[option] ??
                                UserError.throw('Invalid option'),
                            inline: true,
                        },
                        {
                            name: 'Amount',
                            value: format.currency(amount),
                            inline: true,
                        },
                        {
                            name: 'Balance',
                            value: format.currency(client.balance),
                            inline: true,
                        },
                    ],
                    image: {
                        url: 'attachment://divider.png',
                    },
                    footer: {
                        text: prediction._id.toString().toUpperCase(),
                    },
                    timestamp: new Date().toISOString(),
                },
            ],
            files: [
                {
                    attachment: divider(),
                    name: 'divider.png',
                },
            ],
        }
    },
})
