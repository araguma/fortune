import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import { PredictionReply } from '@/libs/reply/prediction'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close a prediction')
        .toJSON(),
    handler: async (interaction) => {
        const thread = interaction.channel

        if (!thread?.isThread())
            UserError.throw('Command can only be used in threads')

        const prediction = await database
            .getPredictionByThreadId(thread.id)
            .catch(() => UserError.throw('Failed to fetch prediction'))

        if (prediction.status !== 'opened')
            throw new Error('Prediction is not open')

        prediction.status = 'closed'
        await prediction.save()

        const lastMessage = await interaction.channel?.messages.fetch(
            prediction.lastMessageId ?? '',
        )
        await lastMessage?.delete().catch(() => {})

        await thread.send(new PredictionReply(prediction).toJSON())
        await interaction.reply({
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Prediction Closed',
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
            ephemeral: true,
        })
    },
})
