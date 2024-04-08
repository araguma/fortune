import { InferSchemaType, Schema, model } from 'mongoose'

export type Client = InferSchemaType<typeof ClientSchema>

export const ClientSchema = new Schema({
    clientId: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
    },
    watchlist: {
        type: [String],
        required: true,
        default: [],
    },
})

export const ClientModel = model('client', ClientSchema)
