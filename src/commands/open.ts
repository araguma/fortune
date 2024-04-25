import { BaseGuildTextChannel, SlashCommandBuilder } from 'discord.js'

import divider from '@/images/divider'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'
import format from '@/libs/format'
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
        .addNumberOption((option) =>
            option
                .setName('minimum')
                .setDescription('Minimum bet')
                .setRequired(true),
        )
        .toJSON(),
    handler: async (interaction) => {
        const question = interaction.options.getString('question', true)
        const options = interaction.options
            .getString('options', true)
            .split('|')
        const minimum = interaction.options.getNumber('minimum') ?? 0
        const channel = interaction.channel

        if (minimum < 0) throw new Error('Minimum bet must be positive')
        if (!(channel instanceof BaseGuildTextChannel))
            UserError.throw('Unable to create threads in DMs')

        const thread = await channel.threads.create({
            name: `[OPEN] ${question}`,
        })
        const prediction = await database.postPrediction(
            thread.id,
            question,
            options,
            minimum,
        )

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
                    title: question,
                    fields: [
                        {
                            name: 'Options',
                            value: options.length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Minimum',
                            value: format.currency(minimum),
                            inline: true,
                        },
                        {
                            name: 'Thread',
                            value: `<#${thread.id}>`,
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
