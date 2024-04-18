import mongoose from 'mongoose'

import { ClientModel } from '@/models/client'
import { PredictionModel } from '@/models/prediction'
import { ServerModel } from '@/models/server'
import { TransactionModel } from '@/models/transaction'
import { Stock } from '@/types'

export class Database {
    constructor(uri: string) {
        void mongoose.connect(uri)
    }

    async getClientByUserId(userId: string) {
        const client = await ClientModel.findOneAndUpdate(
            { userId },
            { userId },
            { upsert: true, new: true },
        )
        return client
    }

    async getAllClients() {
        const clients = await ClientModel.find()
        return clients
    }

    async getServerByGuildId(guildId: string) {
        const server = await ServerModel.findOneAndUpdate(
            { guildId },
            { guildId },
            { upsert: true, new: true },
        )
        return server
    }

    async getTransactionsByDate(userId: string, start: Date, end: Date) {
        const transactions = await TransactionModel.find({
            userId,
            date: { $gte: start, $lt: end },
        })
        return transactions
    }

    async getPredictionById(predictionId: string) {
        const prediction = await PredictionModel.findById(predictionId)
        if (!prediction) throw new Error('Failed to get prediction')
        return prediction
    }

    async postTransaction(userId: string, shares: Stock[]) {
        const transaction = await TransactionModel.create({
            userId,
            shares,
        })
        return transaction
    }

    async postPrediction(question: string, options: string[]) {
        const prediction = await PredictionModel.create({
            question,
            options,
        })
        return prediction
    }
}

if (!process.env['MONGODB_URI']) throw new Error('MONGODB_URI not set')

const database = new Database(process.env['MONGODB_URI'])

export default database
