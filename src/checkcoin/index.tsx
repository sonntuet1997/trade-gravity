import {Button, Col, Form, Row, Tag} from "antd";
import {Input} from "@components";
import {CheckCircleOutlined, CloseCircleOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {getBestTrade} from "./strategies";


export const convertedObj = (array) => {
    return array?.reduce((pre, cur) => {
        const [first, second] = cur.balances;
        const firstAmount = parseFloat(first.amount);
        const secondAmount = parseFloat(second.amount);

        if (!pre[first.denom]) {
            pre[first.denom] = {
                [second.denom]: {rate: secondAmount / firstAmount, first: firstAmount, second: secondAmount, info: cur}
            }
        } else {
            pre[first.denom] = {
                ...pre[first.denom],
                [second.denom]: {rate: secondAmount / firstAmount, first: firstAmount, second: secondAmount, info: cur}
            }
        }
        if (!pre[second.denom]) {
            pre[second.denom] = {
                [first.denom]: {rate: firstAmount / secondAmount, first: secondAmount, second: firstAmount, info: cur}
            }
        } else {
            pre[second.denom] = {
                ...pre[second.denom],
                [first.denom]: {rate: firstAmount / secondAmount, first: secondAmount, second: firstAmount, info: cur}
            }
        }
        return pre;
    }, {})
}

export const CheckCoin = ({
                              dispatch,
                              data,
                              startPoint,
                              prices,
                              coin,
                              balances,
                              loading,
                              pending,
                          }: { dispatch: React.Dispatch<any>, loading: boolean, pending: boolean, data: any, balances: any, startPoint: string, prices: any, coin?: any }) => {
    const layout = {
        labelCol: {span: 0},
        wrapperCol: {span: 0},
    };
    const tailLayout = {
        wrapperCol: {offset: 0, span: 0},
    };
    const [values, setValues] = useState<any>({startPoint, coin: coin ?? '10000'});
    const [result, setResult] = useState<any>({});
    const [bestResult, setBestResult] = useState<any>({});
    const gas = '0.1';
    useEffect(() => {
        if (!balances) return;

        setValues((pre) => ({...pre, custom: auto ? '' : pre.custom, coin: balances[startPoint] / 1000000}));
    }, [balances]);
    // const [curVal, setCurVal] = useState<any>(0);
    // const [interCount, setInterCount] = useState<any>(0);

    useEffect(() => {
        if (!(startPoint)) return;
        if (!(prices && data)) return;
        if (!data['uatom']) return;
        const coin = (values.custom && values.custom != '') ? parseFloat(values.custom) : values.coin;
        if (!coin) return;
        const _result = getBestTrade(data, startPoint, coin, gas, prices, '', false, auto);
        const bResult = getBestTrade(data, startPoint, coin, gas, prices, '', false, false);
        // setBestResult(bResult);
        // const bIResult = getBestInternalTrade(data, startPoint, coin, gas, '', false);
        // const b2Result = getBestInternalTrade(data, startPoint, coin, gas, '', true);
        setResult(_result);
        setBestResult(bResult);
    }, [data, values]);
    const auto = true;
    const autoCommit = true;
    useEffect(() => {
        auto && setValues((pre) => ({...pre, custom: ''}));
    }, [data]);

    useEffect(() => {
        if (!auto) return;
        if(!autoCommit) return;
        if (!result?.priceImpact) return;
        // if (startPoint === 'uatom' && ((!values.custom) || values.custom === '' || values.custom === -1)) return;
        const profit = parseFloat(result.profit);
        const coin = parseFloat(result.tradeCoin);
        if (!pending && !loading && profit >= 5) {
            trade(result.name.split('___')[0], coin, profit)
        }
    }, [result, pending, loading]);
    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };
    const onFinish = (valuess: any) => {
        setValues((pre) => ({...pre, ...valuess}));
    };
    const shouldTrade = () => {
        if (!(result.profitRation && result.priceImpact)) return;
        return result.profit > 150;
    }
    const trade = (endCoin, coin, profit) => {
        dispatch({
            type: 'trade',
            data: {
                startCoin: startPoint,
                endCoin,
                coin,
                balance: values.coin,
                profit: profit
            }
        });
    }
    return (
        <Form
            {...layout}
            initialValues={values}
            name="basic"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            style={{backgroundColor: `rgba(0,0,255,${shouldTrade() ? '.3' : '0'})`}}
        >
            <Row>
                <Col span={6}>
                    <b>{startPoint}</b>
                </Col>
                <Col span={18}>
                    <Button type={shouldTrade() ? "primary" : "dashed"} loading={pending || loading}
                            onClick={() => trade(bestResult.name.split('___')[0], bestResult.tradeCoin, bestResult.profit)}>
                        {pending ? 'pending' : loading ? 'loading' : 'trade!'}({values.coin})
                    </Button>
                </Col>
            </Row>
            <Row>
                <Col span={6}>
                    <Form.Item name="custom" label="custom">
                        <Input/>
                    </Form.Item>
                </Col>
                <Col span={18}>
                    <Button type={shouldTrade() ? "primary" : "dashed"} loading={pending || loading}
                            onClick={() => trade(result.name.split('___')[0], result.tradeCoin, bestResult.profit)}>
                        {pending ? 'pending' : loading ? 'loading' : 'trade!'}({result.tradeCoin})
                    </Button>
                </Col>
            </Row>
            {/*<Form.Item name="swapNumber" label="swap number">*/}
            {/*    <Input/>*/}
            {/*</Form.Item>*/}
            {/*<Form.Item name="gas" label="gas" rules={[{required: true}]}>*/}
            {/*    <Input/>*/}
            {/*</Form.Item>*/}
            <Form.Item>
                <Tag icon={<CloseCircleOutlined/>} color="error" key={'fixxxxx1'}>
                    <a href={`https://gravity.bharvest.io/#/swap?from=${startPoint?.substr(1)}&to=${result.name?.split('___')[0].substr(1)}`}>Link</a>
                </Tag>
                <Tag icon={<CloseCircleOutlined/>} color="error" key={'fixxxxx2'}>
                    <a href={`https://gravity.bharvest.io/#/swap?from=${result.name?.split('___')[0].substr(1)}&to=${result.name?.split('___')[1]?.substr(1)}`}>Link</a>
                </Tag>
                {Object.keys(result).map((name, i) => {
                    if (name === 'color') return null;
                    if (name === 'originValue') return null;
                    if (name === 'ex') return null;
                    if (name === 'chain_info') return null;
                    if (name === 'bestAmount') return null;
                    if (name === 'exEndCoin') return null;
                    if (name === 'tradeCoin2') return null;
                    if (name === 'PPI') return null;
                    // if (name === 'tradeCoin') return null;
                    return (<div key={`xxxxx${i}`}>
                        <Tag icon={<CheckCircleOutlined/>} color={(result?.color) ?? 'error'}>
                            {name}: {name === 'chain_info' ? result[name].id : result[name]}
                        </Tag><Tag icon={<CheckCircleOutlined/>} color={(bestResult?.color) ?? 'error'}>
                        {name === 'chain_info' ? bestResult[name].id : bestResult[name]}
                    </Tag></div>)
                })}
            </Form.Item>
            <Form.Item {...tailLayout}>
                <Button type="primary" htmlType="submit">
                    Change setup
                </Button>
            </Form.Item>
        </Form>)
}


// const t = () => {
//     const calculatedCoinFee = Math.floor(tradeCoin * (1 - SwapFeeRate / 2) * 0.001500000000000000);
//     const calculatedOfferCoin = Math.floor(tradeCoin * (1 - SwapFeeRate / 2));
//     const minWantedAmountEndCoinPerStartPoint = graph[startCoin][endCoin].rate * calculatedOfferCoin;
//     const expectedAmountEndCoin = minWantedAmountEndCoinPerStartPoint * SlippageRange;
//     // const conversionRate = ((b0)/(a0)) * (prices[cur.substr(1)] ?? 0);
//     const originValue = tradeCoin * (prices[startCoin.substr(1)] ?? 0);
//     const profit = expectedAmountEndCoin * prices[endCoin.substr(1)] - calculatedCoinFee - originValue - fee;
// }