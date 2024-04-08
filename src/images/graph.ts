import { createCanvas } from 'canvas'

import { Point } from '@/types'

const width = 400
const height = 180
const paddingX = 0
const paddingY = 10

export default function graph(data: Point[], color: string) {
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    const range = data.reduce(
        (acc, point) => {
            return {
                x: {
                    min: Math.min(acc.x.min, point.x),
                    max: Math.max(acc.x.max, point.x),
                },
                y: {
                    min: Math.min(acc.y.min, point.y),
                    max: Math.max(acc.y.max, point.y),
                },
            }
        },
        {
            x: {
                min: Infinity,
                max: -Infinity,
            },
            y: {
                min: Infinity,
                max: -Infinity,
            },
        },
    )

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((point, i) => {
        point = normalize(point, range)
        const x = paddingX + point.x * (width - paddingX * 2)
        const y = paddingY + (1 - point.y) * (height - paddingY * 2)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
    })
    ctx.stroke()

    return canvas.toBuffer()
}

function normalize(
    point: Point,
    extent: {
        x: { min: number; max: number }
        y: { min: number; max: number }
    },
) {
    return {
        x: (point.x - extent.x.min) / (extent.x.max - extent.x.min),
        y: (point.y - extent.y.min) / (extent.y.max - extent.y.min),
    }
}
