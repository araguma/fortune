import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import { predictionCache } from '@/libs/cache'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('predict')
        .setDescription('Bet on an outcome')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('Prediction ID')
                .setRequired(true),
        )
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
        const predictionId = interaction.options.getString('id', true)
        const option = interaction.options.getInteger('option', true) - 1
        const amount = interaction.options.getNumber('amount', true)

        const prediction = await database
            .getPredictionById(predictionId)
            .catch(() => UserError.throw('Invalid prediction ID'))

        if (amount <= 0) UserError.throw('Invalid amount')
        if (option < 0 || option >= prediction.options.length)
            UserError.throw('Invalid option')
        if (prediction.status !== 'opened')
            UserError.throw('Prediction is not open')

        const cached = predictionCache.get(predictionId)
        if (!cached) UserError.throw('Prediction does not exist')

        const bet = prediction.bets.get(interaction.user.id)

        client.balance -= amount - (bet?.amount ?? 0)
        if (client.balance < 0) UserError.throw('Insufficient balance')

        if (bet) {
            cached.reply.pool[bet.option] =
                (cached.reply.pool[bet.option] ?? 0) - bet.amount
        }
        cached.reply.pool[option] = (cached.reply.pool[option] ?? 0) + amount
        prediction.bets.set(interaction.user.id, {
            option,
            amount,
        })
        cached.reply.bets = prediction.bets.size

        await client.save()
        await prediction.save()

        await cached.interaction.editReply(cached.reply.toJSON())
        await interaction.reply({
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
                        text: predictionId,
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
            ephemeral: true,
        })
    },
})
