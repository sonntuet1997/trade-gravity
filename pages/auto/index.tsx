import React, {useEffect, useReducer, useState} from 'react'

import {Col, Row} from 'antd'
import _ from 'lodash'

import {TFunction} from 'next-i18next'

import {withTranslation} from '@i18n'
import axios from "axios";
import {Api} from 'src/@starport/tendermint-liquidity-js/cosmos/cosmos-sdk/cosmos.bank.v1beta1/module/rest'
import {chainInfo} from "../../src/config";
import {MyAddress, SwapFeeRate, UserAcceptRange} from 'src/const'
import {convertedObj} from "../../src/checkcoin";
import {cutNumber, getInternalValue, getTotalValue} from "../../src/global-functions";
import {getBestTrade, reserveAtom} from "../../src/checkcoin/strategies";
import {BroadcastLiquidityTx} from "../../src/tx-client";

const getPools = (res) => {
    return new Promise((async (resolve, reject) => {
        try {
            const poolsInfo = await Promise.all(res.data.pools.map(async (pool) => {
                const link = `https://competition.bharvest.io:1317/cosmos/bank/v1beta1/balances/${pool.reserve_account_address}`;
                const res = await axios.get(link);
                return {balances: res.data.balances, link, id: pool.id}
            }));
            resolve(poolsInfo);
        } catch (e) {
            reject(e)
        }
    }))
}
const getPrice = () => {
    return new Promise((async (resolve, reject) => {
        try {
            const res = await axios.get('https://competition.bharvest.io:8081/prices');
            resolve(res.data.prices);
        } catch (e) {
            reject(e)
        }
    }))
}

const getMyBalance = () => {
    return new Promise((async (resolve, reject) => {
        try {
            const bankRestApi = new Api({baseUrl: chainInfo.rest})
            const response = await bankRestApi.queryAllBalances(MyAddress);
            return resolve(response.data)
        } catch (e) {
            reject(e)
        }
    }))
}

const Home: React.FC<{ t: TFunction }> = ({t}) => {
    const [mess, setMess] = useState<any>();
    const [prices, setPrices] = useState<any>(null);
    const [myBalances, setMyBalances] = useState<any>(null);
    const [myInteralBalances, setMyInteralBalances] = useState<any>(null);
    const [totalValues, setTotalValues] = useState<any>(null);
    const [rank, setRank] = useState<any>(null);
    const [trig, setTrig] = useState<any>({});
    const [i, setI] = useState<any>(null)
    const [poolInfo, setPoolInfo] = useState<any>(null);
    useEffect(() => {
        axios.get('https://competition.bharvest.io:1317/tendermint/liquidity/v1beta1/pools?pagination.limit=100')
            .then(x => {
                setPoolInfo(x);
                setB({});
            })
    }, [])
    // useEffect(() => {
    //     const i = setInterval(async () => {
    //         setTrig({})
    //     }, 10000);
    //     return () => {
    //         clearInterval(i);
    //     }
    // }, []);
    const [b, setB] = useState({});
    useEffect(()=>{
        const k = setTimeout(()=>{
            setTrig({});
            // setB({});
        }, 250);
        setI((pre) => {
          if(pre)  clearTimeout(pre);
          return k;
        })
    }, [b]);
    const sleep = (time = 1000) => {
        setTimeout(()=>{
            setB({});
        }, time)
    }
    useEffect(() => {
        (async () => {
            if (!poolInfo) return sleep();
            try {
                setMess('loading');
                const [pools, pricess, myBalance]: any = await Promise.all([getPools(poolInfo), getPrice(), getMyBalance()]);
                setMess('success');
                const obj = convertedObj(pools);
                const convertedBalances = myBalance.balances.reduce((pre, cur) => {
                    pre[cur.denom] = cur.amount;
                    return pre;
                }, {});
                setMyBalances(convertedBalances);
                setMyInteralBalances(getInternalValue(convertedBalances, obj));
                setPrices(pricess);
                console.log(convertedBalances)
                sendTransaction(obj, pricess, convertedBalances);
            } catch (err) {
                setMess(err.message);
                sleep();
            }
        })().then(() => {
        })
    }, [trig]);
    const gas = '0.1';
    const [log, setLog] = useState(0);
    const sendTransaction = (data, prices, convertedBalances) => {
        const sendTransaction = coinss.map(startCoin => {
            const balance = convertedBalances[startCoin] / 1000000;
            const bestTrade: any = getBestTrade(data, startCoin, balance, gas, prices, '', false, true);
            console.log(bestTrade.name, bestTrade.profit)
            const balance2 = bestTrade.endCoin2 ? convertedBalances[bestTrade.endCoin] / 1000000 : null;
            return {
                startCoin: startCoin,
                endCoin2: bestTrade.name.split('___')[1],
                endCoin: bestTrade.name.split('___')[0],
                coin: bestTrade.tradeCoin,
                coin2: bestTrade.tradeCoin2,
                balance,
                balance2,
                profit: bestTrade.profit.toString().split('___')[0]
            }
        }).map(transaction => {
            const {startCoin, endCoin, endCoin2, coin, coin2, balance, balance2, profit} = transaction;
            const tradeNumber = parseFloat(coin);
            if (startCoin === 'uatom' && ((balance - tradeNumber + 10) < reserveAtom)) {
                return null;
            }
            // if (endCoin2 && endCoin === 'uatom' && ((balance2 - tradeNumber + 10) < reserveAtom)) {
            //     return null;
            // }
            if (convertedBalances['uatom'] / 1000000 < 2 && endCoin != 'uatom') {
                alert('Mua Atom không hết tiền trả gas!');
                return null;
            }
            if (profit < 50) return null;
            return transaction
        }).filter(Boolean).sort((a, b) => {
            if(a.endCoin2 && !b.endCoin2) return 1;
            else if (!a.endCoin2 && b.endCoin2) return -1;
            return b.profit - a.profit;
        }).splice(0,12);
        if (!sendTransaction) return sleep();
        setLog(sendTransaction.reduce((pre,cur) => pre + parseFloat(cur.profit),0));
        const tsx = sendTransaction.map(st => {
            return getTxs(st, data);
        }).reduce((prev, cur) => [...prev,...cur], [])
        console.log(tsx);
        if (tsx.length === 0) return sleep();
        BroadcastLiquidityTx(tsx, {
                type: 'Swap',
                userAddress: MyAddress,
            },
            ({status, data}) => {
                console.log(status, data);
                if(status === 'txFail' || status === 'txSuccess'){
                    sleep();
                }
            });
    }
    const getTxs = (tx, data) => {
        const {startCoin, endCoin, endCoin2, coin, coin2, balance, balance2, profit} = tx;
        const result = [
            getTxParam({startCoin, endCoin, coin, balance}, data)
        ]
        // if (endCoin2) {
        //     result.push(
        //         getTxParam({startCoin: endCoin, endCoin: endCoin2, coin: coin2, balance: balance2}, data)
        //     )
        // }
        return result;
    }
    const getTxParam = ({startCoin, endCoin, coin, balance}, data) => {
        const tradeNumber = parseFloat(coin);
        const poolId = Number(data[startCoin][endCoin].info.id);
        const isReversed = startCoin > endCoin;
        const SlippageRange = isReversed ? (1 - UserAcceptRange / 100) : ((1 + UserAcceptRange / 100));
        const calculatedCoinFee = Math.floor(tradeNumber * (1 - SwapFeeRate / 2) * 1000000 * 0.001500000000000000);
        const calculatedOfferCoin = Math.floor(Number(cutNumber(tradeNumber, 6)) * (1 - SwapFeeRate / 2) * 1000000);
        const orderPrice = (isReversed ? data[startCoin][endCoin].rate : data[endCoin][startCoin].rate) * SlippageRange;
        return {
            type: 'msgSwap',
            data: {
                swapRequesterAddress: MyAddress,
                // poolId: Number(selectedPoolData.id),
                poolId,
                swapTypeId: 1,
                offerCoin: {denom: startCoin, amount: String(calculatedOfferCoin)},
                demandCoinDenom: endCoin,
                offerCoinFee: {denom: startCoin, amount: String(calculatedCoinFee)},
                orderPrice: String(orderPrice.toFixed(18).replace('.', '').replace(/(^0+)/, ""))
            }
        }
    }
    useEffect(() => {
        const i = setInterval(async () => {
            try {
                const response = await axios.get(`${chainInfo.competitionInfoBaseUrl}/scoreboard?address=${MyAddress}`)
                const rank = response.data?.me?.ranking;
                setRank(rank);
            } catch (err) {
                console.log(err)
            }
        }, 20000);
        return () => {
            clearInterval(i);
        }
    }, []);
    useEffect(() => {
        setTotalValues(getTotalValue(myBalances, prices ?? {}));
    }, [myBalances, prices]);
    const coinss =
        ['uakt', 'uatom', 'ubtsg',
            'ucom', 'udsm', 'udvpn',
            'ugcyb', 'uiris', 'uluna',
            'ungm', 'uregen', 'uxprt', 'xrun'
        ]

    return (
        <div
            style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}
        >
            <h1>Global price: {totalValues} --- Internal
                price: {cutNumber(myInteralBalances, 2)} --- {rank} --- {mess}</h1>
            <h1>Profit: {log}</h1>
        </div>
    )
}

export default withTranslation(['home', 'common'])(Home)
