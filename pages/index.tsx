import React, {useEffect, useReducer, useState} from 'react'

import {Col, Row} from 'antd'
import _ from 'lodash'

import {TFunction} from 'next-i18next'

import {withTranslation} from '@i18n'
import axios from "axios";
import {CheckCoin, convertedObj} from "../src/checkcoin";
import {cutNumber, getInternalValue, getTotalValue} from "../src/global-functions";
import {Api} from 'src/@starport/tendermint-liquidity-js/cosmos/cosmos-sdk/cosmos.bank.v1beta1/module/rest'
import {chainInfo} from "../src/config";
import {MyAddress, SwapFeeRate, UserAcceptRange} from "../src/const";
import {reserveAtom} from "../src/checkcoin/strategies";
import {BroadcastLiquidityTx} from "../src/tx-client";

const getPools = () => {
    return new Promise((async (resolve, reject) => {
        try {
            const res = await axios.get('https://competition.bharvest.io:1317/tendermint/liquidity/v1beta1/pools?pagination.limit=100');
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

const getMyBalance = async () => {
    const bankRestApi = new Api({baseUrl: chainInfo.rest})
    const response = await bankRestApi.queryAllBalances(MyAddress);
    return response.data;
}

const Home: React.FC<{ t: TFunction }> = ({t}) => {
    const [mess, setMess] = useState<any>();
    const [data, setData] = useState<any>([]);
    const [prices, setPrices] = useState<any>(null);
    const [myBalances, setMyBalances] = useState<any>(null);
    const [myInteralBalances, setMyInteralBalances] = useState<any>(null);
    const [totalValues, setTotalValues] = useState<any>(null);
    const [rank, setRank] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [trig, setTrig] = useState<any>({});
    const [trig2, setTrig2] = useState<any>({});
    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'trade': {
                if (state.transaction[action.data.startCoin]) {
                    return state;
                } else {
                    state.transaction[action.data.startCoin] = action.data;
                    return state;
                }
            }
            case 'clear-pending': {
                state.currentPending = null;
                setTimeout(() => {
                    setTrig2({});
                }, 300)
                return state;
            }
            case 'clear-transaction': {
                action.data.forEach(i => {
                    state.transaction[i] = null;
                })
                setTimeout(() => {
                    setTrig2({});
                }, 300)
                return state;
            }
            case 'handle': {
                setTimeout(() => {
                    setTrig2({});
                }, 500)
                if (state.currentPending) return state;
                const coinList = Object.keys(state.transaction).filter(t => Boolean(state.transaction[t]))
                    .sort((a, b) => {
                        return state.transaction[b].profit - state.transaction[a].profit;
                    }).filter(x => state.transaction[x] && !state.transaction[x].isWaiting);
                const transactionList = coinList.map(index => {
                    const {startCoin, endCoin, coin, balance, profit} = state.transaction[index];
                    const tradeNumber = parseFloat(coin);
                    const poolId = Number(data[startCoin][endCoin].info.id);
                    if (myBalances[startCoin] / 1000000 != balance) {
                        state.transaction[index] = null;
                        return null;
                    }
                    // if (startCoin  === 'xrun' && profit < 250 && balance < 150000){
                    //     state.transaction[index] = null;
                    //     return state;
                    // }
                    if (startCoin === 'uatom' && ((balance - tradeNumber + 10) < reserveAtom)) {
                        state.transaction[index] = null;
                        return null;
                    }
                    if (myBalances['uatom'] / 1000000 < 2 && endCoin != 'uatom') {
                        alert('Mua Atom không hết tiền trả gas!');
                        state.transaction[index] = null;
                        return null;
                    }
                    const isReversed = startCoin > endCoin;
                    const SlippageRange = isReversed ? (1 - UserAcceptRange / 100) : ((1 + UserAcceptRange / 100));
                    const calculatedCoinFee = Math.floor(tradeNumber * (1 - SwapFeeRate / 2) * 1000000 * 0.001500000000000000);
                    const calculatedOfferCoin = Math.floor(Number(cutNumber(tradeNumber, 6)) * (1 - SwapFeeRate / 2) * 1000000);
                    const orderPrice = (isReversed ? data[startCoin][endCoin].rate : data[endCoin][startCoin].rate) * SlippageRange;
                    return {
                        startCoin: index,
                        tx: {
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
                }).filter(Boolean);
                const selectTransactionList = transactionList.slice(0, 2);
                if (selectTransactionList.length === 0) return state;
                state.currentPending = selectTransactionList;
                selectTransactionList.forEach(t => {
                    state.transaction[t.startCoin].isWaiting = true;
                });
                const test = selectTransactionList.map(x => x.tx);
                BroadcastLiquidityTx(test, {
                        type: 'Swap',
                        userAddress: MyAddress,
                    },
                    ({status, data}) => {
                        console.log(status, data);
                        switch (status) {
                            case 'broadcastSuccess': {
                                dispatch({type: 'clear-pending'});
                            }
                            case 'broadcastFail': {
                                dispatch({type: 'clear-pending'});
                            }
                            case 'txSuccess': {
                                console.log(111111111);
                                setTimeout(() => {
                                    dispatch({
                                        type: 'clear-transaction',
                                        data: selectTransactionList.map(t => t.startCoin)
                                    });
                                }, 5000);
                            }
                            case 'txFail': {
                                console.log(11111111111);
                                setTimeout(() => {
                                    dispatch({
                                        type: 'clear-transaction',
                                        data: selectTransactionList.map(t => t.startCoin)
                                    });
                                }, 5000);
                            }
                        }
                    })
                return state;
            }
        }
    }, {transaction: {}, currentPending: null});
    useEffect(() => {
        const i = setInterval(async () => {
            setTrig({})
        }, 7000);
        return () => {
            clearInterval(i);
        }
    }, []);
    useEffect(() => {
        const i = setInterval(async () => {
            dispatch({type: 'handle'});
        }, 700);
        return () => {
            clearInterval(i);
        }
    }, []);

    useEffect(() => {
        Promise.all([(async () => {
            try {
                setMess('loading');
                const [pools, pricess, myBalance] = await Promise.all([getPools(), getPrice(), getMyBalance()]);
                setMess('success');
                setLoading(false);
                const obj = convertedObj(pools);
                setData(obj);
                const convertedBalances = myBalance.balances.reduce((pre, cur) => {
                    pre[cur.denom] = cur.amount;
                    return pre;
                }, {});
                setMyBalances(convertedBalances);
                setMyInteralBalances(getInternalValue(convertedBalances, obj));
                setPrices(pricess);
            } catch (err) {
                setMess(err.message);
                setLoading(true);
            }
        })()]).then(() => {
        })
    }, [trig])
    useEffect(() => {
        const i = setInterval(async () => {
            try {
                const response = await axios.get(`${chainInfo.competitionInfoBaseUrl}/scoreboard?address=${MyAddress}`)
                const rank = response.data?.me?.ranking;
                setRank(rank);
            } catch (err) {
                console.log(err)
            }
        }, 10000);
        return () => {
            clearInterval(i);
        }
    }, []);
    useEffect(() => {
        setTotalValues(getTotalValue(myBalances, prices ?? {}));
    }, [myBalances, prices]);
    const coinss = _.chunk(
        ['uakt', 'uatom', 'ubtsg',
            'ucom', 'udsm', 'udvpn',
            'ugcyb', 'uiris', 'uluna',
            'ungm', 'uregen', 'uxprt', 'xrun'
        ], 6)

    return (
        <div
            style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}
        >
            <h1>Global price: {totalValues} --- Internal
                price: {cutNumber(myInteralBalances, 2)} --- {rank} --- {mess}</h1>
            {/*<div>{analysisData}</div>*/}
            {coinss.map((row, i) => {
                return (<Row key={`iiiii${i}`}>
                    {row.map((col, j) => {
                        return (
                            <Col style={{border: 'solid 1px black'}} span={4} key={`jjjjjj${i},${j}`}>
                                <CheckCoin dispatch={dispatch}
                                           pending={state.transaction[col]?.isWaiting}
                                           loading={loading || (!_.isEmpty(state.transaction[col]))}
                                           balances={myBalances}
                                           prices={prices}
                                           data={data}
                                           startPoint={col}/>
                            </Col>)
                    })}
                </Row>)
            })}
        </div>
    )
}

export default withTranslation(['home', 'common'])(Home)
