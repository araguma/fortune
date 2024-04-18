import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import { predictionCache } from '@/libs/cache'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('settle')
        .setDescription('Settle a prediction')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('Prediction ID')
                .setRequired(true),
        )
        .addIntegerOption((option) =>
            option
                .setName('option')
                .setDescription('Winning option')
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const predictionId = interaction.options.getString('id', true)
        const option = interaction.options.getInteger('option', true) - 1

        const prediction = await database
            .getPredictionById(predictionId)
            .catch(() => UserError.throw('Invalid prediction ID'))

        if (option < 0 || option >= prediction.options.length)
            UserError.throw('Invalid option')
        if (prediction.status !== 'closed')
            UserError.throw('Prediction is not closed')

        const cached = predictionCache.get(predictionId)
        predictionCache.delete(predictionId)
        if (!cached) UserError.throw('Prediction does not exist')

        const winners: string[] = []
        const pool = cached.reply.pool.reduce((a, b) => a + b, 0)
        const total = Array.from(prediction.bets.values()).reduce(
            (acc, bet) => (bet.option === option ? acc + bet.amount : acc),
            0,
        )
        await Promise.all(
            Array.from(prediction.bets.entries()).map(async ([userId, bet]) => {
                if (bet.option === option) {
                    const client = await database.getClientByUserId(userId)
                    client.balance += (bet.amount * pool) / total
                    await client.save()

                    winners.push(userId)
                }
            }),
        )

        prediction.status = 'settled'
        await prediction.save()

        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Prediction Settled',
                    description: [
                        format.currency(pool),
                        'goes to',
                        winners.length
                            ? winners.map((userId) => `<@${userId}>`).join(', ')
                            : 'The House',
                    ].join(' '),
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
        })
    },
})
