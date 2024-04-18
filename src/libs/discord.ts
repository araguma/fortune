import {
    Client,
    ClientOptions,
    GatewayIntentBits,
    Interaction,
    Routes,
} from 'discord.js'

import database from '@/libs/database'
import { UserError } from '@/libs/error'
import getGroup from '@/libs/groups'
import { ErrorReply } from '@/libs/reply/error'
import { Command } from '@/types'

export class Discord extends Client {
    commands: Record<string, Command> = {}

    constructor(token: string, options: ClientOptions) {
        super(options)
        this.on('ready', this.handleReady.bind(this))
            .on('interactionCreate', this.handleInteraction.bind(this))
            .login(token)
            .catch(console.error)
    }

    handleReady(client: Client<true>) {
        console.log(`Logged in as ${client.user.tag}`)
        this.registerCommands()
    }

    async handleInteraction(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return

        if (interaction.guildId && interaction.commandName !== 'whitelist') {
            const server = await database.getServerByGuildId(
                interaction.guildId,
            )
            const group = getGroup(interaction.commandName)
            if (!server.channels.get(interaction.channelId)?.[group]) {
                await interaction.reply(
                    new ErrorReply(
                        `This channel is not whitelisted for ${group}`,
                    ).toJSON(),
                )
                return
            }
        }

        const command = this.commands[interaction.commandName]
        if (command) {
            await command.handler(interaction).catch(async (error) => {
                if (error instanceof UserError) {
                    await interaction.reply(
                        new ErrorReply(error.message).toJSON(),
                    )
                } else {
                    console.error(error)
                    await interaction.reply(
                        new ErrorReply(
                            'There was an error while executing this command',
                        ).toJSON(),
                    )
                }
            })
        } else {
            interaction
                .reply(
                    new ErrorReply(
                        'This command does not exist',
                    ).toJSON(),
                )
                .catch(console.error)
        }
    }

    addCommand(command: Command) {
        this.commands[command.descriptor.name] = command
        this.registerCommands()
    }

    registerCommands() {
        if (!this.user) return
        this.rest
            .put(Routes.applicationCommands(this.user.id), {
                body: Object.values(this.commands).map(
                    (command) => command.descriptor,
                ),
            })
            .catch(console.error)
    }

    async getUserById(id: string) {
        return await this.users.fetch(id)
    }
}

if (!process.env['DISCORD_TOKEN']) throw new Error('DISCORD_TOKEN not set')

const discord = new Discord(process.env['DISCORD_TOKEN'], {
    intents: [GatewayIntentBits.Guilds],
})

export default discord
