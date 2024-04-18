import { SlashCommandBuilder } from 'discord.js'

import { predictionCache } from '@/libs/cache'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { PredictionReply } from '@/libs/reply/prediction'

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('open')
        .setDescription('Open a new prediction')
        .addStringOption((option) =>
            option
                .setName('question')
                .setDescription('Prediction question')
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('options')
                .setDescription('Options seperated by |')
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const question = interaction.options.getString('question', true)
        const options = interaction.options
            .getString('options', true)
            .split('|')

        const prediction = await database.postPrediction(question, options)
        const predictionId = prediction._id.toString().toUpperCase()

        const reply = new PredictionReply(predictionId, question, options)
        predictionCache.set(predictionId, {
            interaction,
            reply,
        })

        await interaction.reply(reply.toJSON())
    },
})
