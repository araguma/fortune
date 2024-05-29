import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import format from '@/libs/format'
import Reply from '@/libs/reply'
import Tag from '@/libs/tag'
import { BlackjackType } from '@/models/blackjack'

const suitSymbols = {
    hearts: '♥️',
    diamonds: '♦️',
    clubs: '♣️',
    spades: '♠️',
} as const

export class BlackjackReply extends Reply<BlackjackReplyData> {
    public constructor(data: BlackjackReplyData) {
        super()
        this.update(data)
    }

    public override update({
        blackjackId,
        blackjack,
        playerTotal,
        dealerTotal,
        clientName,
        clientIcon,
    }: BlackjackReplyData) {
        this.setColor(
            (() => {
                switch (blackjack.winner) {
                    case 'player':
                        return Color.Green
                    case 'dealer':
                        return Color.Red
                    default:
                        return Color.Yellow
                }
            })(),
        )
        this.setAuthor({ name: '---' })
        this.setTitle('Blackjack')
        this.setDescription(
            [
                [
                    `> **${clientName}** ▸ ${playerTotal}`,
                    `> ${blackjack.player
                        .map(
                            (card) =>
                                `\`[${card.rank}${suitSymbols[card.suit]}]\``,
                        )
                        .join(' ')}`,
                ].join('\n'),
                [
                    `> **Dealer** ▸ ${dealerTotal}`,
                    `> ${blackjack.dealer
                        .map(
                            (card) =>
                                `\`[${card.rank}${suitSymbols[card.suit]}]\``,
                        )
                        .join(' ')}`,
                ].join('\n'),
            ].join('\n\n'),
        )
        this.setFields(
            {
                name: 'Bet',
                value: format.value(blackjack.bet * (blackjack.double ? 2 : 1)),
                inline: true,
            },
            {
                name: 'Double',
                value: blackjack.double ? 'Yes' : 'No',
                inline: true,
            },
            {
                name: 'Winner',
                value:
                    blackjack.winner === 'player'
                        ? clientName
                        : format.capitalize(blackjack.winner),
                inline: true,
            },
        )
        this.setCanvas(divider())
        this.setFooter({
            text: blackjackId.toUpperCase(),
            iconURL: clientIcon,
        })

        if (blackjack.winner === 'none') {
            const row = new ActionRowBuilder<ButtonBuilder>()
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        new Tag()
                            .setCommand('blackjack')
                            .setAction('hit')
                            .setData('blackjackId', blackjackId)
                            .toCustomId(),
                    )
                    .setLabel('Hit')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(
                        new Tag()
                            .setCommand('blackjack')
                            .setAction('stand')
                            .setData('blackjackId', blackjackId)
                            .toCustomId(),
                    )
                    .setLabel('Stand')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(
                        new Tag()
                            .setCommand('blackjack')
                            .setAction('double')
                            .setData('blackjackId', blackjackId)
                            .toCustomId(),
                    )
                    .setLabel('Double Down')
                    .setStyle(ButtonStyle.Danger),
            )
            this.setComponents([row])
        }
    }
}

export interface BlackjackReplyData {
    blackjackId: string
    blackjack: BlackjackType
    playerTotal: number
    dealerTotal: number
    clientName: string
    clientIcon: string
}