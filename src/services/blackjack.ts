import { HydratedDocument } from 'mongoose'

import ranks from '@/data/ranks'
import UserError from '@/errors/user'
import random from '@/libs/random'
import { BlackjackModel, BlackjackType } from '@/models/blackjack'
import { CardType } from '@/models/card'
import { ClientType } from '@/models/client'

export default class Blackjack {
    public constructor(public model: HydratedDocument<BlackjackType>) {}

    public static async findById(id: string) {
        const blackjack = await BlackjackModel.findById(id)
        if (!blackjack) throw new Error('Blackjack not found')
        return new Blackjack(blackjack)
    }

    public static create(
        userId: BlackjackType['userId'],
        bet: BlackjackType['bet'],
    ) {
        const model = new BlackjackModel({
            userId,
            bet,
        })
        return new Blackjack(model)
    }

    public initialize(self: ClientType, client: ClientType) {
        this.hit(self, client)
        this.hit(self, client)
        this.model.dealerCards.push(random.card())
        this.modifyDelta(self, client, -this.model.bet)
    }

    public hit(self: ClientType, client: ClientType) {
        if (this.model.winner !== 'tbd') return
        this.model.playerCards.push(random.card())
        const playerTotal = calculateTotal(this.model.playerCards)
        if (playerTotal === 21) {
            this.model.winner = 'player'
            this.modifyDelta(
                self,
                client,
                this.model.bet * (this.model.double ? 2 : 1) * 2,
            )
        } else if (playerTotal > 21) {
            this.model.winner = 'dealer'
        }
    }

    public stand(self: ClientType, client: ClientType) {
        if (this.model.winner !== 'tbd') return
        while (calculateTotal(this.model.dealerCards) < 17) {
            this.model.dealerCards.push(random.card())
        }
        const playerTotal = calculateTotal(this.model.playerCards)
        const dealerTotal = calculateTotal(this.model.dealerCards)
        if (dealerTotal === playerTotal) {
            this.model.winner = 'none'
            this.modifyDelta(
                self,
                client,
                this.model.bet * (this.model.double ? 2 : 1),
            )
        } else if (dealerTotal > 21 || dealerTotal < playerTotal) {
            this.model.winner = 'player'
            this.modifyDelta(
                self,
                client,
                this.model.bet * (this.model.double ? 2 : 1) * 2,
            )
        } else if (dealerTotal === 21 || dealerTotal > playerTotal) {
            this.model.winner = 'dealer'
        }
    }

    public double(self: ClientType, client: ClientType) {
        if (this.model.winner !== 'tbd' || this.model.double) return
        this.model.double = true
        this.modifyDelta(self, client, -this.model.bet)
        this.hit(self, client)
        this.stand(self, client)
    }

    public getPlayerTotal() {
        return calculateTotal(this.model.playerCards)
    }

    public getDealerTotal() {
        return calculateTotal(this.model.dealerCards)
    }

    public modifyDelta(self: ClientType, client: ClientType, delta: number) {
        this.model.delta += delta
        client.balance += delta
        self.balance -= delta
        if (client.balance < 0) UserError.insufficientBalance()
    }

    public getId() {
        return this.model._id.toHexString()
    }

    public async save() {
        await this.model.save()
    }
}

const rankValues: Record<(typeof ranks)[number], number> = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 10,
    'Q': 10,
    'K': 10,
}

function calculateTotal(cards: CardType[]) {
    const { aces, min } = cards.reduce(
        (accumulator, { rank }) => {
            if (rank === 'A') {
                accumulator.aces++
            }
            accumulator.min += rankValues[rank]
            return accumulator
        },
        { aces: 0, min: 0 },
    )
    let total = min
    for (let i = 0; i < aces; i++) {
        if (total + 10 <= 21) {
            total += 10
        }
    }
    return total
}
