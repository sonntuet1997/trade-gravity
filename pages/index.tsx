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
    const [cooldown, dispatchCooldown] = useReducer((state, action) => {
        switch (action.type) {
            case 'set': {
                state[action.data.coin] = 0;
                return state;
            }
            case 'add': {
                Object.keys(state).forEach((key, i) => {
                    if (state[key]) {
                        state[key] = state[key] > 3 ? null : state[key] + 1;
                    }
                })
                return state;
            }
        }
    }, {});
    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'trade': {
                const {startCoin, endCoin, coin} = action.data;
                state.loading[startCoin] = true;
                state.transactionList.push(action.data);
                return state;
            }
            case 'handle': {
                if (loading) return state;
                const indexTransaction = state.transactionList.findIndex(x => !cooldown[x.startCoin]);
                if (indexTransaction === -1) return state;
                const {startCoin, endCoin, coin, balance} = state.transactionList[indexTransaction];
                state.transactionList.splice(indexTransaction, 1);
                const tradeNumber = parseFloat(coin);
                const poolId = Number(data[startCoin][endCoin].info.id);
                if (myBalances[startCoin] / 1000000 != balance) {
                    state.loading[startCoin] = false;
                    return state;
                }
                if (startCoin === 'uatom' && ((balance - tradeNumber + 10) < reserveAtom)) {
                    state.loading[startCoin] = false;
                    return state;
                }
                if (myBalances['uatom'] / 1000000 < 2 && endCoin != 'uatom') {
                    alert('Mua Atom không hết tiền trả gas!');
                    state.loading[startCoin] = false;
                    return state;
                }
                const isReversed = startCoin > endCoin;
                const SlippageRange = isReversed ? (1 - UserAcceptRange / 100) : ((1 + UserAcceptRange / 100));
                const calculatedCoinFee = Math.floor(tradeNumber * (1 - SwapFeeRate / 2) * 1000000 * 0.001500000000000000);
                const calculatedOfferCoin = Math.floor(Number(cutNumber(tradeNumber, 6)) * (1 - SwapFeeRate / 2) * 1000000);
                const orderPrice = (isReversed ? data[startCoin][endCoin].rate : data[endCoin][startCoin].rate) * SlippageRange;
                setLoading(true);
                BroadcastLiquidityTx({
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
                    }, {type: 'Swap', userAddress: MyAddress, demandCoinDenom: endCoin}
                ).then(res => {
                    state.loading[startCoin] = false;
                    dispatchCooldown({type: 'set', data: startCoin});
                    setLoading(false);
                }).catch(e => {
                    console.log(e);
                    state.loading[startCoin] = false;
                    dispatchCooldown({type: 'set', data: startCoin});
                    setLoading(false);
                })
                return state;
            }
        }
    }, {loading: {}, transactionList: [], coolDown: {}});
    useEffect(() => {
        setInterval(() => {
            dispatch({type: 'handle'})
        }, 500);
    }, []);
    useEffect(() => {
        setInterval(() => {
            dispatchCooldown({type: 'add'})
        }, 1000);
    }, []);
    useEffect(() => {
        const i = setInterval(async () => {
            setTrig({})
        }, 8000);
        return () => {
            clearInterval(i);
        }
    }, []);


    useEffect(() => {
        Promise.all([(async () => {
            try {
                setMess('loading');
                const isErr = mess !== 'loading' && mess != 'success';
                const [pools, pricess, myBalance] = await Promise.all([getPools(), getPrice(), getMyBalance()]);
                setMess('success');
                if (isErr) {
                    setLoading(false);
                }
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


    const trade = ({startCoin, endCoin, coin, balances}) => {

    }

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
                                <CheckCoin dispatch={dispatch} loading={state.loading[col]} balances={myBalances}
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
