import { InferSchemaType, Schema, model } from 'mongoose'

export type Share = InferSchemaType<typeof ShareSchema>

export const ShareSchema = new Schema({
    clientId: {
        type: String,
        required: true,
    },
    symbol: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    seed: {
        type: Number,
        required: true,
    },
})

export const ShareModel = model('share', ShareSchema)
