import { Color } from '@/enums'
import divider from '@/libs/canvas/divider'
import Reply from '@/libs/reply'
import { ServerType } from '@/models/server'

export class WhitelistReply extends Reply<WhitelistReplyData> {
    public constructor(data: WhitelistReplyData) {
        super()
        this.update(data)
    }

    public override update({ serverId, whitelists }: WhitelistReplyData) {
        this.setColor(Color.Blue)
        this.setAuthor({ name: '---' })
        this.setTitle('Whitelist')
        this.setCanvas(divider())
        this.setDescription(
            Array.from(whitelists.entries())
                .map(([channelId, groups]) => {
                    return [
                        `> <#${channelId}>`,
                        `> └─ ${groups.map((group) => `\`${group}\``).join(' ')}`,
                    ].join('\n')
                })
                .join('\n\n'),
        )
        this.setFooter({
            text: serverId.toUpperCase(),
        })
    }
}

export type WhitelistReplyData = {
    serverId: string
    whitelists: ServerType['whitelists']
}
