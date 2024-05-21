import { Group } from '@/enums'
import UserError from '@/errors/user'
import Command from '@/libs/command'
import Client from '@/services/client'
import discord from '@/services/discord'
import { LeaderboardReply } from '@/views/leaderboard'

const command = new Command()
    .setName('leaderboard')
    .setDescription('Display leaderboard')
    .setGroup(Group.Trade)

command.addStringOption((option) =>
    option
        .setName('type')
        .setDescription('Leaderboard type')
        .addChoices(
            {
                name: 'Profit',
                value: 'profit',
            },
            {
                name: 'Total',
                value: 'total',
            },
        )
        .setRequired(true),
)

command.setChatInputCommandHandler(async (interaction) => {
    const type = interaction.options.getString('type', true)
    const clients = await Client.getAllClients()

    const entries = await Promise.all(
        clients.map(async (client) => {
            return {
                userId: client.model.userId,
                metric: await (async () => {
                    switch (type) {
                        case 'profit': {
                            return await client.getProfit()
                        }
                        case 'total': {
                            return await client.getTotal()
                        }
                        default: {
                            UserError.invalidType(type)
                        }
                    }
                })(),
            }
        }),
    )

    const reply = new LeaderboardReply({
        metric: type,
        type: 'value',
        entries,
    })
    await interaction.reply(reply)
})

discord.addCommand(command)
