import { ModalBuilder, TextInputBuilder } from '@discordjs/builders'
import { ActionRowBuilder, TextInputStyle } from 'discord.js'

import { Group } from '@/enums'
import Command from '@/libs/command'
import format from '@/libs/format'
import Tag from '@/libs/tag'
import Client from '@/services/client'
import discord from '@/services/discord'
import Prediction from '@/services/prediction'
import { PredictionReply } from '@/views/prediction'

const command = new Command()
    .setName('prediction')
    .setDescription('Open a new prediction')
    .setGroup(Group.Prediction)

command
    .addStringOption((option) =>
        option
            .setName('prompt')
            .setDescription('Prediction prompt')
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

command.setChatInputCommandHandler(async (interaction) => {
    const prompt = interaction.options.getString('prompt', true)
    const options = interaction.options.getString('options', true).split('|')
    const minimum = interaction.options.getNumber('minimum', true)

    const prediction = Prediction.create(prompt, options, minimum)
    await prediction.save()

    const reply = new PredictionReply({
        predictionId: prediction.getId(),
        prediction: prediction.model,
    })
    await interaction.reply(reply)
})

command.setButtonHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)

    const predictionId = tag.getData('predictionId', true)
    const prediction = await Prediction.findById(predictionId)
    const client = await Client.getClientByUserId(interaction.user.id)

    switch (tag.getAction(true)) {
        case 'close': {
            prediction.close()
            await prediction.save()

            const reply = new PredictionReply({
                predictionId: prediction.getId(),
                prediction: prediction.model,
            })
            await interaction.update(reply)
            break
        }
        case 'predict': {
            const modal = new ModalBuilder()
                .setCustomId(
                    new Tag()
                        .setCommand('prediction')
                        .setAction('predict')
                        .setData('predictionId', predictionId)
                        .toCustomId(),
                )
                .setTitle('Predict Outcome')
            const optionInput = new TextInputBuilder()
                .setCustomId('option')
                .setLabel(
                    `Select option [1, ${prediction.model.options.length}]`,
                )
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            const amountInput = new TextInputBuilder()
                .setCustomId('amount')
                .setLabel(
                    `Input amount [${prediction.model.minimum}, ${format.number(client.model.balance)}]`,
                )
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
                optionInput,
            )
            const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
                amountInput,
            )

            modal.addComponents(row1, row2)
            await interaction.showModal(modal)
            break
        }
        case 'settle': {
            const modal = new ModalBuilder()
                .setCustomId(
                    new Tag()
                        .setCommand('prediction')
                        .setAction('settle')
                        .setData('predictionId', predictionId)
                        .toCustomId(),
                )
                .setTitle('Settle Prediction')
            const optionInput = new TextInputBuilder()
                .setCustomId('option')
                .setLabel(
                    `Select option [1, ${prediction.model.options.length}]`,
                )
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
                optionInput,
            )

            modal.addComponents(row)
            await interaction.showModal(modal)
            break
        }
    }
})

command.setModalSubmitHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)

    const prediction = await Prediction.findById(
        tag.getData('predictionId', true),
    )

    switch (tag.getAction(true)) {
        case 'predict': {
            const userId = interaction.user.id
            const client = await Client.getClientByUserId(userId)
            const option =
                parseInt(interaction.fields.getTextInputValue('option')) - 1
            const amount = parseFloat(
                interaction.fields.getTextInputValue('amount'),
            )

            prediction.setBet(client.model, option, amount)
            await prediction.save()
            await client.save()

            await interaction.deferUpdate()
            break
        }
        case 'settle': {
            const self = await Client.getClientByUserId(discord.getUserId())
            const clients = Object.fromEntries(
                await Promise.all(
                    Array.from(prediction.model.bets.keys()).map(
                        async (userId) => {
                            return [
                                userId,
                                (await Client.getClientByUserId(userId)).model,
                            ] as const
                        },
                    ),
                ),
            )
            const option =
                parseInt(interaction.fields.getTextInputValue('option')) - 1
            prediction.settle(self.model, clients, option)

            await self.save()
            await Promise.all(
                Object.values(clients).map(async (client) => {
                    await client.save()
                }),
            )
            await prediction.save()

            await interaction.deferUpdate()
            break
        }
    }

    const reply = new PredictionReply({
        predictionId: prediction.getId(),
        prediction: prediction.model,
    })
    await interaction.message?.edit(reply)
})

discord.addCommand(command)
