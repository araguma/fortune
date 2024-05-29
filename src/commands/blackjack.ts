import { Group } from '@/enums'
import UserError from '@/errors/user'
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
    const bet = interaction.options.getNumber('bet', true)
    if (bet <= 0) UserError.invalid('bet', bet)

    const blackjack = Blackjack.create(interaction.user.id, bet)
    const client = await Client.getClientByUserId(interaction.user.id)
    const self = await Client.getClientByUserId(discord.getUserId())
    const user = await discord.users.fetch(interaction.user.id)

    blackjack.initialize(self.model, client.model)
    await blackjack.save()
    await client.save()
    await self.save()

    const reply = new BlackjackReply({
        blackjackId: blackjack.getId(),
        blackjack: blackjack.model,
        playerTotal: blackjack.getPlayerTotal(),
        dealerTotal: blackjack.getDealerTotal(),
        clientIcon: user.displayAvatarURL(),
        dealerId: discord.getUserId(),
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
    const self = await Client.getClientByUserId(discord.getUserId())
    const user = await discord.users.fetch(blackjack.model.userId)

    switch (tag.getAction(true)) {
        case 'hit': {
            blackjack.hit(self.model, client.model)
            break
        }
        case 'stand': {
            blackjack.stand(self.model, client.model)
            break
        }
        case 'double': {
            blackjack.double(self.model, client.model)
            break
        }
    }

    await blackjack.save()
    await client.save()
    await self.save()

    const reply = new BlackjackReply({
        blackjackId: blackjack.getId(),
        blackjack: blackjack.model,
        playerTotal: blackjack.getPlayerTotal(),
        dealerTotal: blackjack.getDealerTotal(),
        clientIcon: user.displayAvatarURL(),
        dealerId: discord.getUserId(),
    })
    await interaction.update(reply)
})

discord.addCommand(command)
