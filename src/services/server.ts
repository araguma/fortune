import { HydratedDocument } from 'mongoose'

import { Group } from '@/enums'
import { ServerModel, ServerType } from '@/models/server'

export default class Server {
    public constructor(public model: HydratedDocument<ServerType>) {}

    public static async getServerByGuildId(guildId: string) {
        const server = await ServerModel.findOneAndUpdate({ guildId }, { guildId }, { upsert: true, new: true })
        return new Server(server)
    }

    public checkWhitelist(group: Group, channelId: string) {
        const whitelist = this.getWhitelist(channelId)
        return whitelist.includes(group)
    }

    public addToWhitelist(channelId: string, group: Group) {
        const whitelist = this.getWhitelist(channelId)
        if (whitelist.includes(group)) return
        whitelist.push(group)
        this.model.whitelists.set(channelId, whitelist)
    }

    public removeFromWhitelist(channelId: string, group: Group) {
        const whitelist = this.getWhitelist(channelId)
        const index = whitelist.indexOf(group)
        if (index === -1) return
        whitelist.splice(index, 1)
        if (whitelist.length > 0) {
            this.model.whitelists.set(channelId, whitelist)
        } else {
            this.model.whitelists.delete(channelId)
        }
    }

    public clearWhitelist() {
        this.model.whitelists.clear()
    }

    public getWhitelist(channelId: string) {
        return this.model.whitelists.get(channelId) ?? []
    }

    public getId() {
        return this.model._id.toHexString()
    }

    public async save() {
        return await this.model.save()
    }
}
