const multipliers = ['p', 'n', 'u', 'm', '', 'k', 'M']

function getMultiplier(key: string | undefined) {
    switch(key){
        case 'p': return 1/1000000000000
        case 'n': return 1/1000000000
        case 'u': return 1/1000000
        case 'm': return 1/1000
        case 'k': return 1000
        case 'M': return 1000000
        default: return 1
    }
}

export function parseComponentValue(value?: string) {
    if(!value || value === '') return 0

    // allows multiplier to be used as
    const matches = value.match(/(?<firstDigits>[0-9.]+)(?<multiplier>[pnumkM]?)(?<fraction>[0-9]*)/)
    if(!matches) return 0

    const firstDigits = matches.groups?.firstDigits ? parseFloat(matches.groups.firstDigits) : 0
    const multiplier = getMultiplier(matches.groups?.multiplier)
    const fraction = matches.groups?.fraction ? parseFloat(`0.${matches.groups.fraction}`) : 0

    // Now, while this DOES support both a dot in firstDigits and a separate fraction at the same time, it
    // yields strange results (e.g. 1.5k5 = 2000)
    return (firstDigits + fraction) * multiplier
}

export function printComponentValue(value: number, unit= '') {

    for(let i=0; i<multipliers.length-1; i++){
        const currentMultiplierKey = multipliers[i]
        const nextMultiplierKey = multipliers[i+1]

        const currentMultiplier = getMultiplier(currentMultiplierKey)
        const nextMultiplier = getMultiplier(nextMultiplierKey)

        if(value < nextMultiplier){
            return `${value / currentMultiplier}${currentMultiplierKey}${unit}`
        }
    }
    const multiplierKey =  multipliers[multipliers.length-1]
    return `${value / getMultiplier(multiplierKey)}${multiplierKey}${unit}`
}