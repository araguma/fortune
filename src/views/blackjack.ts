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
        dealerId,
        clientIcon,
    }: BlackjackReplyData) {
        const { delta } = blackjack

        this.setColor(
            delta > 0 ? Color.Green : delta < 0 ? Color.Red : Color.Yellow,
        )
        this.setAuthor({ name: '---' })
        this.setTitle('Blackjack')
        this.setURL('https://en.wikipedia.org/wiki/Blackjack')
        this.setDescription(
            [
                [
                    `> <@${blackjack.userId}> ▸ **${playerTotal}**${generateHint(playerTotal)}`,
                    `> └─ ${blackjack.playerCards
                        .map(
                            (card) =>
                                `\`[${card.rank}${suitSymbols[card.suit]}]\``,
                        )
                        .join(' ')}`,
                ].join('\n'),
                [
                    `> <@${dealerId}> ▸ **${dealerTotal}**${generateHint(dealerTotal)}`,
                    `> └─ ${blackjack.dealerCards
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
                value: format.value(blackjack.bet),
                inline: true,
            },
            {
                name: 'Double',
                value: blackjack.double ? 'Yes' : 'No',
                inline: true,
            },
            {
                name: 'Delta',
                value: format.value(delta),
                inline: true,
            },
        )
        this.setCanvas(divider())
        this.setFooter({
            text: blackjackId.toUpperCase(),
            iconURL: clientIcon,
        })

        if (blackjack.winner === 'tbd') {
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

function generateHint(total: number) {
    if (total === 21) return ' | **Blackjack**'
    if (total > 21) return ' | **Bust**'
    return ''
}

export interface BlackjackReplyData {
    blackjackId: string
    blackjack: BlackjackType
    playerTotal: number
    dealerTotal: number
    clientIcon: string
    dealerId: string
}
