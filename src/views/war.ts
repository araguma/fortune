import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import format from '@/libs/format'
import Reply from '@/libs/reply'
import Tag from '@/libs/tag'
import { WarType } from '@/models/war'

const suitSymbols = {
    hearts: '♥️',
    diamonds: '♦️',
    clubs: '♣️',
    spades: '♠️',
} as const

export class WarReply extends Reply<WarReplyData> {
    public constructor(data: WarReplyData) {
        super()
        this.update(data)
    }

    public override update({ warId, war, clientIcon, dealerId }: WarReplyData) {
        const { playerCards, dealerCards, delta } = war

        const currentPlayerRank =
            playerCards[playerCards.length - 1]?.rank ?? 'N/A'
        const currentDealerRank =
            dealerCards[dealerCards.length - 1]?.rank ?? 'N/A'

        this.setColor(
            delta > 0 ? Color.Green : delta < 0 ? Color.Red : Color.Yellow,
        )
        this.setAuthor({ name: '---' })
        this.setTitle('Casino War')
        this.setURL('https://en.wikipedia.org/wiki/Casino_War')
        this.setDescription(
            [
                [
                    `> <@${war.userId}> ▸ **${currentPlayerRank}**`,
                    `> └─ ${war.playerCards
                        .map(
                            (card) =>
                                `\`[${card.rank}${suitSymbols[card.suit]}]\``,
                        )
                        .join(' ')}`,
                ].join('\n'),
                [
                    `> <@${dealerId}> ▸ **${currentDealerRank}**`,
                    `> └─ ${war.dealerCards
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
                value: format.value(war.bet),
                inline: true,
            },
            {
                name: 'Tie Bet',
                value: format.value(war.tieBet),
                inline: true,
            },
            {
                name: 'Delta',
                value: format.value(war.delta),
                inline: true,
            },
        )
        this.setCanvas(divider())
        this.setFooter({
            text: warId.toUpperCase(),
            iconURL: clientIcon,
        })

        if (war.winner === 'none' && war.action === 'tbd') {
            const row = new ActionRowBuilder<ButtonBuilder>()
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        new Tag()
                            .setCommand('war')
                            .setAction('surrender')
                            .setData('warId', warId)
                            .toCustomId(),
                    )
                    .setLabel('Surrender')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(
                        new Tag()
                            .setCommand('war')
                            .setAction('war')
                            .setData('warId', warId)
                            .toCustomId(),
                    )
                    .setLabel('War')
                    .setStyle(ButtonStyle.Danger),
            )
            this.setComponents([row])
        }
    }
}

export type WarReplyData = {
    warId: string
    war: WarType
    clientIcon: string
    dealerId: string
}
