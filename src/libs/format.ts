export class Format {
    currencyPrefix = '$'
    currencySuffix = ''

    capitalize(text: string) {
        return text.charAt(0).toUpperCase() + text.slice(1)
    }

    number(value?: number) {
        if (value === undefined || isNaN(value)) return 'N/A'
        return value.toString()
    }

    currency(amount?: number) {
        if (amount === undefined || isNaN(amount)) return 'N/A'
        return (
            this.currencyPrefix +
            parseFloat(amount.toFixed(5)) +
            this.currencySuffix
        )
    }

    percentage(decimal?: number) {
        if (decimal === undefined || isNaN(decimal)) return 'N/A'
        if (Math.abs(decimal) === Infinity) return '0%'
        return `${parseFloat((decimal * 100).toFixed(2))}%`
    }

    bold(text: string) {
        return `**${text}**`
    }
}

const format = new Format()

export default format
