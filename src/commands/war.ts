import { Group } from '@/enums'
import Command from '@/libs/command'
import Tag from '@/libs/tag'
import Client from '@/services/client'
import discord from '@/services/discord'
import War from '@/services/war'
import { WarReply } from '@/views/war'

const command = new Command()
    .setName('war')
    .setDescription('Start casino war game')
    .setGroup(Group.Casino)

command.addNumberOption((option) =>
    option.setName('bet').setDescription('Bet amount').setRequired(true),
)

command.addNumberOption((option) =>
    option.setName('tie-bet').setDescription('Tie bet amount'),
)

command.setChatInputCommandHandler(async (interaction) => {
    const bet = interaction.options.getNumber('bet', true)
    const tieBet = interaction.options.getNumber('tie-bet') ?? 0

    const war = War.create(interaction.user.id, bet, tieBet)
    const client = await Client.getClientByUserId(interaction.user.id)
    const self = await Client.getClientByUserId(discord.getUserId())
    const user = await discord.users.fetch(interaction.user.id)

    war.initialize(self.model, client.model)
    await war.save()
    await client.save()
    await self.save()

    const reply = new WarReply({
        warId: war.getId(),
        war: war.model,
        clientIcon: user.displayAvatarURL(),
        dealerId: discord.getUserId(),
    })
    await interaction.reply(reply)
})

command.setButtonHandler(async (interaction) => {
    const tag = new Tag(interaction.customId)
    const war = await War.findById(tag.getData('warId', true))

    if (interaction.user.id !== war.model.userId) {
        await interaction.deferUpdate()
        return
    }

    const client = await Client.getClientByUserId(war.model.userId)
    const self = await Client.getClientByUserId(discord.getUserId())
    const user = await discord.users.fetch(war.model.userId)

    switch (tag.getAction(true)) {
        case 'surrender': {
            war.surrender(self.model, client.model)
            break
        }
        case 'war': {
            war.war(self.model, client.model)
            break
        }
    }

    await war.save()
    await client.save()
    await self.save()

    const reply = new WarReply({
        warId: war.getId(),
        war: war.model,
        clientIcon: user.displayAvatarURL(),
        dealerId: discord.getUserId(),
    })
    await interaction.update(reply)
})

discord.addCommand(command)
