import React, {useEffect, useState} from 'react'

import {Col, Form, Row, Tag} from 'antd'
import _ from 'lodash'
import {Button, Input, Option, Select} from '@components'

import {TFunction} from 'next-i18next'

import {withTranslation} from '@i18n'
import axios from "axios";
import {CheckCoin, convertedObj} from "../src/checkcoin";
import {cutNumber, getInternalValue, getMinimalDenomCoin, getTotalValue} from "../src/global-functions";
import {Api} from 'src/@starport/tendermint-liquidity-js/cosmos/cosmos-sdk/cosmos.bank.v1beta1/module/rest'
import {chainInfo} from "../src/config";
import {MyAddress} from "../src/const";

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
    const loadSet = useState(false);
    const [trig, setTrig] = useState<any>({});
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
                    loadSet[1](false);
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
                loadSet[1](true);
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
    // const coinPrice = _.chunk(
    //     ['667', '33.62', '15558',
    //         '648', '2000', '2',
    //         '3.5', '1000', '1000',
    //         '1000', '1778', '1000'
    //     ], 6)
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
                                <CheckCoin loadSet={loadSet} balances={myBalances} prices={prices} data={data}
                                           startPoint={col}/>
                            </Col>)
                    })}
                </Row>)
            })}
        </div>
    )
}

export default withTranslation(['home', 'common'])(Home)
