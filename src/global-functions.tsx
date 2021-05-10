export function getMinimalDenomCoin(x) {
    if (x === "run" || x === "xrun") {
        return "xrun"
    } else {
        return "u" + x
    }
}
export function cutNumber(number, digitsAfterDot) {
    const str = `${number}`;
    return parseFloat(str);
    // return parseFloat(str.slice(0, str.indexOf('.') + digitsAfterDot + 1))
}

export function getMyCoinBalance(coin, myBalance) {
    if (myBalance[coin.toLowerCase()] !== undefined) {
        return Number(myBalance[coin.toLowerCase()])
    } else {
        return 0
    }
}

export function getInternalValue(userBalance, interalPriceData) {
    let totalValue = 0
    for (let pair in userBalance) {
        if(pair.indexOf('pool') === 0) continue;
        if(pair === 'xrun') {
            totalValue += getMyCoinBalance(pair, userBalance);
        }
        else {
            totalValue += getMyCoinBalance(pair, userBalance) * Number(interalPriceData[pair]['xrun'].rate)
        }
    }
    return totalValue / 1000000;
}

export function getTotalValue(userBalance, priceData) {
    let totalValue = 0
    for (let pair in userBalance) {
        totalValue += getMyCoinBalance(pair, userBalance) * Number(priceData[pair])
    }
    return (Math.floor(totalValue * 100) / 100).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}