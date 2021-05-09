import {SwapFeeRate, UserAcceptRange} from "../const";
import {cutNumber} from "../global-functions";

const finishCoin = 'xrun'
const allowRate = 0.185;
export const reserveAtom = 50;

export const calBestAmount = (sfr, a, b, sr, rx, ry, fee, op) => {
    const n = 0.5 / op * ry;
    // const m = 0.5*0.0015*rx;
    const bb = (-sfr) * n - fee;
    const d = 1000000.0 * 2 / a;
    const c = rx;
    const square = (-bb) / (d * c);
    if (square < 0) return -1;
    return Math.sqrt(square);

}
export const getBestTrade = (graph, start, coin, gas, prices, preNode = '', calBest = false, auto = false) => {
    // const fee = ( graph['uatom'][finish].rate) * parseFloat(gas);
    const fee = prices['atom'] * parseFloat(gas);
    if (!graph[start]) return {};
    const oriV = graph[start];
    const best = Object.keys(oriV).reduce((pre, cur) => {
        if (cur === preNode) return pre;
        const startCoin = start;
        const endCoin = cur;
        const isReversed = startCoin > endCoin;
        const SlippageRange = isReversed ? (1 - UserAcceptRange / 100) : ((1 + UserAcceptRange / 100));
        const rX = prices[startCoin.substr(1)] ?? 0;
        const rY = prices[endCoin.substr(1)] ?? 0;
        const orderPrice = (isReversed ? graph[startCoin][endCoin].rate : graph[endCoin][startCoin].rate) * SlippageRange;
        const minWantedAmountEndCoinPerStartPoint = isReversed ? orderPrice : (1 / orderPrice);
        const bestAmount = calBestAmount(
            SwapFeeRate,
            graph[startCoin][endCoin].first,
            graph[startCoin][endCoin].second,
            SlippageRange,
            rX,
            rY,
            fee,
            orderPrice
        )

        let tradeCoin = parseFloat(calBest ? bestAmount.toString() : coin);
        if (auto) {
            const customCoin = parseFloat((allowRate * oriV[cur].first / 2000000).toFixed(2));
            const reserveAtomCoin = startCoin === 'uatom' ? reserveAtom : 0;
            // const priceImpact = (2 * customCoin * 1000000 / oriV[cur].first);
            // console.log(customCoin,priceImpact);
            tradeCoin = Math.min(tradeCoin, customCoin) - reserveAtomCoin;
            tradeCoin = tradeCoin < 0 ? 0 : tradeCoin;
        }

        // const calculatedCoinFee = Math.floor(tradeCoin * (1 - SwapFeeRate / 2) * 0.001500000000000000);
        const calculatedOfferCoin = Math.floor(tradeCoin * (1 - SwapFeeRate / 2));
        const expectedAmountEndCoin = calculatedOfferCoin * minWantedAmountEndCoinPerStartPoint;
        // const conversionRate = ((b0)/(a0)) * (prices[cur.substr(1)] ?? 0);
        const originValue = tradeCoin * rX;
        const profit = expectedAmountEndCoin * rY - originValue - fee;
        const priceImpact = (2 * tradeCoin * 1000000 / oriV[cur].first);
        const PPI = (1 + profit / originValue) / (1 + priceImpact) - 1;
        let result = {
            name: endCoin,
            chain_info: oriV[endCoin].info,
            // tradeCoin: `${cutNumber(tradeCoin, 5)}`,
            tradeCoin: `${tradeCoin}`,
            profit,
            exEndCoin: cutNumber(expectedAmountEndCoin, 2),
            PPI: cutNumber(PPI, 5).toString(),
            originValue,
            // conversionRate,
            bestAmount: cutNumber(bestAmount, 5).toString(),
            profitRation: cutNumber(profit / originValue, 5).toString(),
            color: ((profit > 0) ? 'success' : 'warning'),
            ex: oriV[endCoin].rate,
            priceImpact: cutNumber(priceImpact, 5).toString(),
            tradeCoin2: '0'
        }
        if (preNode === '') {
            const bestValue: any = getBestTrade(graph, endCoin, expectedAmountEndCoin, gas, prices, start, false);
            const newProfit = bestValue.profit + profit;
            if (newProfit > result.profit) {
                result = {
                    name: `${endCoin}___${bestValue.name}`,
                    chain_info: oriV[endCoin].info,
                    tradeCoin: `${tradeCoin}`,
                    originValue,
                    tradeCoin2: `${cutNumber(bestValue.tradeCoin, 5)}`,
                    profit: newProfit,
                    bestAmount: `${cutNumber(bestAmount, 5)}___${bestValue.bestAmount}`,
                    PPI: `${cutNumber(PPI, 5)}___${bestValue.PPI}`,
                    exEndCoin: cutNumber(expectedAmountEndCoin, 2),
                    // conversionRate,
                    profitRation: cutNumber(newProfit / originValue, 5).toString(),
                    color: ((newProfit > 0) ? 'success' : 'warning'),
                    ex: `${oriV[cur].rate}___${bestValue.ex}`,
                    priceImpact: `${cutNumber(priceImpact, 5)}___${bestValue.priceImpact}`,
                }
            }
        }
        if (result.profit > pre.profit) return result;
        return pre;
    }, {x: 0, profit: -9999, conversionRate: 0})
    best.profit = cutNumber(best.profit, 0);
    return best
}


export const calBestInternalAmount = (sfr, a, b, sr, rx, ry, fee, op) => {
    const n = 0.5 / op * ry;
    // const m = 0.5*0.0015*rx;
    const bb = (-sfr) * n - fee;
    const d = 1000000.0 * 2 / a;
    const c = rx;
    const square = (-bb) / (d * c);
    if (square < 0) return -1;
    return Math.sqrt(square);

}
export const getBestInternalTrade = (graph, start, coin, gas, preNode = '', calBest = false) => {
    // const fee = ( graph['uatom'][finish].rate) * parseFloat(gas);
    const fee = graph['uatom'][finishCoin].rate * parseFloat(gas);
    if (!graph[start]) return {};
    const oriV = graph[start];
    const best = Object.keys(oriV).reduce((pre, cur) => {
        if (cur === finishCoin) return pre;
        if (cur === preNode) return pre;
        const startCoin = start;
        const endCoin = cur;
        const isReversed = startCoin > endCoin;
        const SlippageRange = isReversed ? (1 - UserAcceptRange / 100) : ((1 + UserAcceptRange / 100));
        // const rX = prices[startCoin.substr(1)] ?? 0;
        // const rY = prices[endCoin.substr(1)] ?? 0;
        const orderPrice = (isReversed ? graph[startCoin][endCoin].rate : graph[endCoin][startCoin].rate) * SlippageRange;
        const minWantedAmountEndCoinPerStartPoint = isReversed ? orderPrice : (1 / orderPrice);
        const rX = startCoin === finishCoin ? 1 : graph[startCoin][finishCoin].rate;
        const rY = graph[endCoin][finishCoin].rate;
        const bestAmount = calBestInternalAmount(
            SwapFeeRate,
            graph[startCoin][endCoin].first,
            graph[startCoin][endCoin].second,
            SlippageRange,
            rX,
            rY,
            fee,
            orderPrice
        );
        const tradeCoin = parseFloat(calBest ? bestAmount.toString() : coin);
        // const calculatedCoinFee = Math.floor(tradeCoin * (1 - SwapFeeRate / 2) * 0.001500000000000000);
        const calculatedOfferCoin = Math.floor(tradeCoin * (1 - SwapFeeRate / 2));
        const expectedAmountEndCoin = calculatedOfferCoin * minWantedAmountEndCoinPerStartPoint;
        // const conversionRate = ((b0)/(a0)) * (prices[cur.substr(1)] ?? 0);
        const originValue = tradeCoin * rX;
        const profit = expectedAmountEndCoin * rY - originValue - fee;
        const priceImpact = (2 * tradeCoin * 1000000 / oriV[cur].first);
        const PPI = (1 + profit / originValue) / (1 + priceImpact) - 1;
        let result = {
            name: endCoin,
            chain_info: oriV[endCoin].info,
            tradeCoin: `${cutNumber(tradeCoin, 5)}`,
            profit,
            exEndCoin: cutNumber(expectedAmountEndCoin, 2),
            PPI: cutNumber(PPI, 5).toString(),
            originValue,
            // conversionRate,
            bestAmount: cutNumber(bestAmount, 5).toString(),
            profitRation: cutNumber(profit / originValue, 5).toString(),
            color: ((profit > 0) ? 'success' : 'warning'),
            ex: oriV[endCoin].rate,
            priceImpact: cutNumber(priceImpact, 5).toString(),
            tradeCoin2: '0'
        }
        if (preNode === '') {
            const bestValue: any = getBestInternalTrade(graph, endCoin, expectedAmountEndCoin, gas, startCoin, false);
            const newProfit = bestValue.profit + profit;
            if (newProfit > result.profit) {
                result = {
                    name: `${endCoin}___${bestValue.name}`,
                    chain_info: oriV[endCoin].info,
                    tradeCoin: `${cutNumber(tradeCoin, 5)}`,
                    originValue,
                    tradeCoin2: `${cutNumber(bestValue.tradeCoin, 5)}`,
                    profit: newProfit,
                    bestAmount: `${cutNumber(bestAmount, 5)}___${bestValue.bestAmount}`,
                    PPI: `${cutNumber(PPI, 5)}___${bestValue.PPI}`,
                    exEndCoin: cutNumber(expectedAmountEndCoin, 2),
                    // conversionRate,
                    profitRation: cutNumber(newProfit / originValue, 5).toString(),
                    color: ((newProfit > 0) ? 'success' : 'warning'),
                    ex: `${oriV[cur].rate}___${bestValue.ex}`,
                    priceImpact: `${cutNumber(priceImpact, 5)}___${bestValue.priceImpact}`,
                }
            }
        }
        if (result.profit > pre.profit) return result;
        return pre;
    }, {x: 0, profit: -9999, conversionRate: 0})
    best.profit = cutNumber(best.profit, 0);
    return best
}
