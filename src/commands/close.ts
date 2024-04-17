import { SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import { predictionCache } from '@/libs/cache'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close a prediction')
        .addStringOption((option) =>
            option
                .setName('id')
                .setDescription('Prediction ID')
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const predictionId = interaction.options.getString('id', true)

        const prediction = await database
            .getPredictionById(predictionId)
            .catch(() => UserError.throw('Invalid prediction ID'))

        if (prediction.status !== 'opened')
            throw new Error('Prediction is not open')

        const cached = predictionCache.get(predictionId)
        if (!cached) throw new Error('Prediction does not exist')

        prediction.status = 'closed'
        await prediction.save()

        cached.reply.status = 'closed'

        await cached.interaction.editReply(cached.reply.toJSON())
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
