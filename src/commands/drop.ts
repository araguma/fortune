import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import { PredictionReply } from '@/libs/reply/prediction'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('drop')
        .setDescription('Drop prediction down')
        .toJSON(),
    handler: async (interaction) => {
        const thread = interaction.channel

        if (!thread?.isThread())
            UserError.throw('Command can only be used in threads')

        const prediction = await database.getPredictionByThreadId(thread.id)

        const previous = await thread.messages.fetch(prediction.messageId)
        await previous.delete().catch(() => {})

        const message = await thread.send(
            new PredictionReply(prediction).toJSON(),
        )
        prediction.messageId = message.id
        await prediction.save()

        return {
            embeds: [
                {
                    color: 0x3498db,
                    author: {
                        name: '---',
                    },
                    title: 'Prediction Dropped',
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
