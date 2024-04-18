import { ChatInputCommandInteraction } from 'discord.js'

import { PredictionReply } from '@/libs/reply/prediction'

export const predictionCache = new Map<
    string,
    {
        interaction: ChatInputCommandInteraction
        reply: PredictionReply
    }
>()
