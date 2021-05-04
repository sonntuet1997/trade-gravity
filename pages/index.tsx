import React, {useEffect, useState} from 'react'

import {Col, Form, Row, Tag} from 'antd'
import _ from 'lodash'
import {Button, Input, Option, Select} from '@components'

import {TFunction} from 'next-i18next'

import {withTranslation} from '@i18n'
import axios from "axios";
import {CheckCoin} from "../src/checkcoin";

const getData = () => {
    return new Promise((async (resolve, reject) => {
        try {
            const res = await axios.get('https://competition.bharvest.io:1317/tendermint/liquidity/v1beta1/pools?pagination.limit=100');
            const poolsInfo = await Promise.all(res.data.pools.map((pool) => axios.get(`https://competition.bharvest.io:1317/cosmos/bank/v1beta1/balances/${pool.reserve_account_address}`).then(res => res.data.balances)))
            resolve(poolsInfo);
        } catch (e) {
            reject(e)
        }
    }))
}

const finish = 'xrun'

// function that returns the minimum cost and path to reach Finish


const Home: React.FC<{ t: TFunction }> = ({t}) => {
    const [analysisData, setAnalysisData] = useState('');
    const [inter, setInter] = useState<any>();
    const [data, setData] = useState<any>([]);
    useEffect(()=>{
        const i = setInterval(() => {
            getData().then((res: any) => {
                const dif = _.difference(res, data)
                console.log(dif)
                if (dif.length != 0) {
                    console.log(res);
                    setData(res);
                }
                // setLoading(false);
            }).catch(error => {
                console.log(error);
                // setLoading(false);
            })
        }, 5000);
        setInter(i);
        return () => {
            clearInterval(inter);
        }
    },[]);
    const coinss = [['uakt','uatom','ubtsg','ucom'],
        ['udsm','udvpn','ugcyb', 'uiris'],
        ['uluna', 'ungm','uregen','uxprt']
    ]
    return (
        <div
            style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}
        >
            {/*<div>{analysisData}</div>*/}
            {coinss.map((row,i)=>{
                return (<Row key={`iiiii${i}`}>
                    {row.map((col,j) => {
                        return (<Col span={6} key={`jjjjjj${j}`}><CheckCoin data={data} startPoint={col}/></Col>)
                    })}
                </Row>)
                })}
        </div>
    )
}

export default withTranslation(['home', 'common'])(Home)
