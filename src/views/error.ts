import { Color } from '@/enums'
import Reply from '@/libs/reply'

export class ErrorReply extends Reply<ErrorReplyData> {
    public constructor(data: ErrorReplyData) {
        super()
        this.update(data)
    }

    public override update({ message }: ErrorReplyData) {
        this.setColor(Color.Black)
        this.setTitle('Error')
        this.setEphemeral(true)
        this.setDescription(message)
    }
}

export type ErrorReplyData = {
    message: string
}
