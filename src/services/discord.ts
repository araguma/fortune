import {
    Client,
    ClientOptions,
    Events,
    GatewayIntentBits,
    Interaction,
    Routes,
} from 'discord.js'

import excuses from '@/data/excuses'
import UserError from '@/errors/user'
import Command from '@/libs/command'
import { getEnvironmentVariable } from '@/libs/env'
import log from '@/libs/log'
import random from '@/libs/random'
import Tag from '@/libs/tag'
import { ErrorReply } from '@/views/error'

export class Discord extends Client {
    private commands: Map<string, Command> = new Map()

    public constructor(token: string, options: ClientOptions) {
        super(options)
        this.on(Events.ClientReady, (client) => {
            log.success(`Connected to Discord`)
            log.info(`└─ User ID: ${client.user.id}`)
        })
        this.on(Events.InteractionCreate, (interaction) => {
            const now = performance.now()
            void this.handleInteraction(interaction).then(() => {
                log.debug(`Handled interaction in ${performance.now() - now}ms`)
            })
        })
        void this.login(token)
    }

    public async handleInteraction(interaction: Interaction) {
        const commandName = (() => {
            if (
                interaction.isChatInputCommand() ||
                interaction.isAutocomplete()
            ) {
                return interaction.commandName
            }
            if (
                interaction.isButton() ||
                interaction.isStringSelectMenu() ||
                interaction.isModalSubmit()
            ) {
                const tag = new Tag(interaction.customId)
                return tag.getCommand(true)
            }
            return ''
        })()
        const command = this.commands.get(commandName)
        if (!command) return
        await command.handleInteraction(interaction).catch((error) => {
            if (!(error instanceof UserError)) log.error(error)
            if (!interaction.isRepliable()) return
            const reply = new ErrorReply({
                message:
                    error instanceof UserError
                        ? error.message
                        : random.sample(excuses),
            })
            void interaction.reply(reply).catch(log.error)
        })
    }

    public addCommand(command: Command) {
        this.commands.set(command.name, command)
    }

    public removeCommand(name: string) {
        this.commands.delete(name)
    }

    public async registerCommands() {
        if (!this.user) throw new Error('No user found')
        const commands = Array.from(this.commands.values()).map((command) =>
            command.toJSON(),
        )
        await this.rest.put(Routes.applicationCommands(this.user.id), {
            body: commands,
        })
        return commands
    }

    public getUserId() {
        const userId = this.user?.id
        if (!userId) throw new Error('No user ID found')
        return userId
    }
}

const discord = new Discord(getEnvironmentVariable('DISCORD_TOKEN'), {
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
})

export default discord
