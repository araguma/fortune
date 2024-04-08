import { createCanvas } from 'canvas'

const width = 400
const height = 22
const ticks = 40
const tickSize = 2
const paddingX = 2

const interval = (width - tickSize - paddingX * 2) / (ticks - 1)

export default function divider() {
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < ticks; i++) {
        ctx.fillRect(
            i * interval + paddingX,
            (height - tickSize) / 2,
            tickSize,
            tickSize,
        )
    }

    return canvas.toBuffer()
}
