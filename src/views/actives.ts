import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import format from '@/libs/format'
import Reply from '@/libs/reply'
import { AlpacaActive } from '@/services/alpaca'

export class ActivesReply extends Reply<ActivesReplyData> {
    public constructor(data: ActivesReplyData) {
        super()
        this.update(data)
    }

    public override update({ by, actives }: ActivesReplyData) {
        this.setColor(Color.Blue)
        this.setAuthor({ name: '---' })
        this.setTitle(`Active Stocks by ${format.capitalize(by)}`)
        this.setFields(
            {
                name: 'Symbol',
                value: actives.map((active) => active.symbol).join('\n'),
                inline: true,
            },
            {
                name: 'Trades',
                value: actives.map((active) => active.trade_count).join('\n'),
                inline: true,
            },
            {
                name: 'Volume',
                value: actives.map((active) => active.volume).join('\n'),
                inline: true,
            },
        )
        this.setCanvas(divider())
    }
}

export type ActivesReplyData = {
    by: 'volume' | 'trades'
    actives: AlpacaActive[]
}
