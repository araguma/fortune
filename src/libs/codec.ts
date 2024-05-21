function encode(key: string) {
    return key
        .replace(/\$/g, 'U+0024')
        .replace(/\./g, 'U+002E')
        .replace(/\//g, 'U+002F')
        .replace(/-/g, 'U+002D')
        .replace(/:/g, 'U+003A')
        .toUpperCase()
}

function decode(key: string) {
    return key
        .replace(/U\+0024/g, '$')
        .replace(/U\+002E/g, '.')
        .replace(/U\+002F/g, '/')
        .replace(/U\+002D/g, '-')
        .replace(/U\+003A/g, ':')
        .toUpperCase()
}

const codec = {
    encode,
    decode,
}

export default codec
