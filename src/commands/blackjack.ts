import { Group } from '@/enums'
import Command from '@/libs/command'
import Tag from '@/libs/tag'
import Blackjack from '@/services/blackjack'
import Client from '@/services/client'
import discord from '@/services/discord'
import { BlackjackReply } from '@/views/blackjack'

const command = new Command()
    .setName('blackjack')
    .setDescription('Start a blackjack game')
    .setGroup(Group.Game)

command.addNumberOption((option) =>
    option.setName('bet').setDescription('Bet amount').setRequired(true),
)

command.setChatInputCommandHandler(async (interaction) => {
    const blackjack = Blackjack.create(
        interaction.user.id,
        interaction.options.getNumber('bet', true),
    )
    const client = await Client.getClientByUserId(interaction.user.id)
    const user = await discord.users.fetch(interaction.user.id)

    blackjack.initialize(client.model)
    await blackjack.save()
    await client.save()

    const reply = new BlackjackReply({
        blackjackId: blackjack.getId(),
        blackjack: blackjack.model,
        playerTotal: blackjack.getPlayerTotal(),
        dealerTotal: blackjack.getDealerTotal(),
        clientName: user.displayName,
        clientIcon: user.displayAvatarURL(),
    })
    await interaction.reply(reply)
})

command.setButtonHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)
    const blackjack = await Blackjack.findById(tag.getData('blackjackId', true))

    if (interaction.user.id !== blackjack.model.userId) {
        await interaction.deferUpdate()
        return
    }

    const client = await Client.getClientByUserId(blackjack.model.userId)
    const user = await discord.users.fetch(blackjack.model.userId)

    switch (tag.getAction(true)) {
        case 'hit': {
            blackjack.hit(client.model)
            break
        }
        case 'stand': {
            blackjack.stand(client.model)
            break
        }
        case 'double': {
            blackjack.double(client.model)
            break
        }
    }

    await blackjack.save()
    await client.save()

    const reply = new BlackjackReply({
        blackjackId: blackjack.getId(),
        blackjack: blackjack.model,
        playerTotal: blackjack.getPlayerTotal(),
        dealerTotal: blackjack.getDealerTotal(),
        clientName: user.displayName,
        clientIcon: user.displayAvatarURL(),
    })
    await interaction.update(reply)
})

discord.addCommand(command)
