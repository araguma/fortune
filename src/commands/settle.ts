import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('settle')
        .setDescription('Settle a prediction')
        .addIntegerOption((option) =>
            option
                .setName('option')
                .setDescription('Winning option')
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const option = interaction.options.getInteger('option', true) - 1
        const thread = interaction.channel

        if (!thread?.isThread())
            UserError.throw('Command can only be used in threads')

        const prediction = await database
            .getPredictionByThreadId(thread.id)
            .catch(() => UserError.throw('Failed to fetch prediction'))

        if (option < 0 || option >= prediction.options.length)
            UserError.throw('Invalid option')
        if (prediction.status !== 'closed')
            UserError.throw('Prediction is not closed')

        const winners: string[] = []
        const pool = prediction.pool.reduce((a, b) => a + b, 0)
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
        if (winners.length === 0 && discord.user?.id) {
            const self = await database.getClientByUserId(discord.user.id)
            self.balance += pool
            await self.save()
        }
        prediction.status = 'settled'

        await prediction.save()

        setTimeout(() => void thread.setArchived(true), 10000)
        await thread.setName(
            `[SETTLED - ${prediction.options[option]}] ${prediction.question}`,
        )
        await thread.send({
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
                            : '**The House**',
                    ].join(' '),
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
        })

        return {
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Prediction Settled',
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
