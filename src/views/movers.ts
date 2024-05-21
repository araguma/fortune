import { Color } from '@/enums'
import format from '@/libs/format'
import Reply from '@/libs/reply'
import { AlpacaMover } from '@/services/alpaca'

const variant = {
    gainers: {
        color: Color.Green,
        sign: '▴',
    },
    losers: {
        color: Color.Red,
        sign: '▾',
    },
}

export class MoversReply extends Reply<MoversReplyData> {
    public constructor(data: MoversReplyData) {
        super()
        this.update(data)
    }

    public override update({ by, movers }: MoversReplyData) {
        const { color, sign } = variant[by]

        this.setColor(color)
        this.setAuthor({ name: '---' })
        this.setTitle(`Top ${format.capitalize(by)}`)
        this.setDescription(
            movers
                .map((mover) => {
                    return [
                        sign,
                        format.symbol(mover.symbol),
                        format.value(mover.price),
                        `(${mover.percent_change}%)`,
                    ].join(' ')
                })
                .join('\n'),
        )
    }
}

export type MoversReplyData = {
    by: 'gainers' | 'losers'
    movers: AlpacaMover[]
}
