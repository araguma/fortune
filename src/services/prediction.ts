import { HydratedDocument } from 'mongoose'

import UserError from '@/errors/user'
import { ClientType } from '@/models/client'
import { PredictionModel, PredictionType } from '@/models/prediction'

export default class Prediction {
    public constructor(public model: HydratedDocument<PredictionType>) {}

    public static async findById(id: string) {
        const prediction = await PredictionModel.findById(id)
        if (!prediction) throw new Error('Prediction not found')
        return new Prediction(prediction)
    }

    public static create(prompt: string, options: string[], minimum: number) {
        const model = new PredictionModel({
            prompt,
            options,
            minimum,
        })
        return new Prediction(model)
    }

    public setBet(client: ClientType, option: number, amount: number) {
        if (amount < this.model.minimum)
            UserError.insufficientBet(this.model.minimum)
        if (option < 0 || option >= this.model.options.length)
            UserError.invalidOption(option)

        const bet = this.model.bets.get(client.userId)

        client.balance -= amount - (bet?.amount ?? 0)
        if (client.balance < 0) UserError.insufficientBalance()

        if (bet) {
            this.model.pool[bet.option] =
                (this.model.pool[bet.option] ?? 0) - bet.amount
        }
        this.model.pool[option] = (this.model.pool[option] ?? 0) + amount
        this.model.bets.set(client.userId, {
            option,
            amount,
        })
    }

    public close() {
        this.model.status = 'closed'
    }

    public settle(
        self: ClientType,
        clients: Record<string, ClientType>,
        option: number,
        revert = false,
    ) {
        this.model.status = 'settled'
        this.model.result = option

        const winners: { userId: string; amount: number }[] = []

        const pool = this.model.pool.reduce((a, b) => a + b, 0)
        const winnerPool = this.model.pool[option] ?? 0
        this.model.bets.forEach((bet, userId) => {
            if (bet.option === option) {
                const client = clients[userId]
                if (!client) UserError.invalidUserId(userId)

                const ratio = bet.amount / winnerPool
                const amount = (revert ? -1 : 1) * ratio * pool
                client.balance += amount

                winners.push({ userId, amount })
            }
        })

        if (winners.length === 0) {
            self.balance += pool
            winners.push({ userId: self.userId, amount: pool })
        }

        return winners
    }

    public getId() {
        return this.model._id.toHexString()
    }

    public save() {
        return this.model.save()
    }
}
