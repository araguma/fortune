import {
    ChatInputCommandInteraction,
    ButtonInteraction,
    StringSelectMenuInteraction,
    Interaction,
    SlashCommandBuilder,
    PermissionsBitField,
    AutocompleteInteraction,
    ModalSubmitInteraction,
} from 'discord.js'
import assert from 'node:assert/strict'

import { Group } from '@/enums'
import UserError from '@/errors/user'
import Server from '@/services/server'

export default class Command extends SlashCommandBuilder {
    public group: Group | null = null
    private chatInputCommandHandler: ChatInputCommandHandler | null = null
    private autocompleteHandler: AutocompleteHandler | null = null
    private buttonHandler: ButtonHandler | null = null
    private stringSelectMenuHandler: StringSelectMenuHandler | null = null
    private modalSubmitHandler: ModalSubmitHandler | null = null

    async handleInteraction(interaction: Interaction) {
        const { guildId, channelId } = interaction
        if (guildId && channelId) {
            assert(this.group)
            if (this.group === Group.Admin) {
                const admin = PermissionsBitField.Flags.Administrator
                if (!interaction.memberPermissions?.has(admin)) UserError.adminOnly()
            } else {
                const server = await Server.getServerByGuildId(guildId)
                if (!server.checkWhitelist(this.group, channelId)) UserError.notWhitelisted(channelId, this.group)
            }
        }

        if (interaction.isChatInputCommand()) {
            await this.chatInputCommandHandler?.(interaction)
        } else if (interaction.isAutocomplete()) {
            await this.autocompleteHandler?.(interaction)
        } else if (interaction.isButton()) {
            await this.buttonHandler?.(interaction)
        } else if (interaction.isStringSelectMenu()) {
            await this.stringSelectMenuHandler?.(interaction)
        } else if (interaction.isModalSubmit()) {
            await this.modalSubmitHandler?.(interaction)
        }
    }

    setGroup(group: Group) {
        this.group = group
        return this
    }

    setChatInputCommandHandler(handler: ChatInputCommandHandler) {
        this.chatInputCommandHandler = handler
        return this
    }

    setAutocompleteHandler(handler: AutocompleteHandler) {
        this.autocompleteHandler = handler
        return this
    }

    setButtonHandler(handler: ButtonHandler) {
        this.buttonHandler = handler
        return this
    }

    setStringSelectMenuHandler(handler: StringSelectMenuHandler) {
        this.stringSelectMenuHandler = handler
        return this
    }

    setModalSubmitHandler(handler: ModalSubmitHandler) {
        this.modalSubmitHandler = handler
        return this
    }
}

export type ChatInputCommandHandler = (interaction: ChatInputCommandInteraction) => Promise<void> | void

export type AutocompleteHandler = (interaction: AutocompleteInteraction) => Promise<void> | void

export type ButtonHandler = (interaction: ButtonInteraction) => Promise<void> | void

export type StringSelectMenuHandler = (interaction: StringSelectMenuInteraction) => Promise<void> | void

export type ModalSubmitHandler = (interaction: ModalSubmitInteraction) => Promise<void> | void
