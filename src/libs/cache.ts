import { ChatInputCommandInteraction } from 'discord.js'

import { PredictionReply } from '@/libs/reply'

export const predictionCache = new Map<
    string,
    {
        interaction: ChatInputCommandInteraction
        reply: PredictionReply
    }
>()
