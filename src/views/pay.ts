import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import format from '@/libs/format'
import Reply from '@/libs/reply'

export class PayReply extends Reply<PayReplyData> {
    public constructor(data: PayReplyData) {
        super()
        this.update(data)
    }

    public override update({ userId, targetUserId, amount }: PayReplyData) {
        this.setColor(Color.Red)
        this.setAuthor({ name: '---' })
        this.setTitle('Target Paid')
        this.setFields(
            {
                name: 'Sender',
                value: `<@${userId}>`,
                inline: true,
            },
            {
                name: 'Target',
                value: `<@${targetUserId}>`,
                inline: true,
            },
            {
                name: 'Amount',
                value: format.value(amount),
                inline: true,
            },
        )
        this.setCanvas(divider())
        this.setTimestamp(new Date())
    }
}

export type PayReplyData = {
    userId: string
    targetUserId: string
    amount: number
}
