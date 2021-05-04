import {Button, Form, Tag} from "antd";
import {Input} from "@components";
import {CheckCircleOutlined, CloseCircleOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import _ from "lodash";
import Link from 'next/link'

const solve = (a,b,c) => {
    if(a == 0) {
        if(b == 0) {
            if (c == 0) {
                return [];
            } else {
                return [];
            }
        } else {
            return [-c/b];
        }
    } else {
        const delta = b*b - 4*a*c;
        if(delta > 0) {
            const x1 = (-b+Math.sqrt(delta))/(2*a);
            const x2 = (-b-Math.sqrt(delta))/(2*a);
            return [x1,x2]
        } else if ( delta == 0) {
            const sum = -b/2*a
            return [sum];
        } else {
            return [null];
        }
    }
}
const getBestTrade = (graph, start, coin, gas) => {
    const fee = ( graph['uatom'][finish].rate) * parseFloat(gas);
    if (!graph[start]) return {};
    const oriV = graph[start];
    const a1 = oriV[finish].first;
    const d = oriV[finish].second;
    const best = Object.keys(oriV).reduce((pre,cur)=>{
        if(cur === finish) return pre;
        const a0 = oriV[cur].first;
        const b0 = oriV[cur].second;
        const b1 = graph[cur][finish].first;
        const c = graph[cur][finish].second;
        const x = 2 * a0
        const tradeCoin = parseFloat(coin) > x ? x : parseFloat(coin);
        const conversionRate = ((b0 - tradeCoin)/(a0 + tradeCoin)) * (c/b1);
        const originValue = tradeCoin*oriV[finish].rate;
        const profit = conversionRate * tradeCoin - originValue - fee;
        const result = {
            name: cur,
            x,
            tradeCoin,
            profit,
            conversionRate,
            profitRation: profit/originValue,
            ex: oriV[cur].rate
        }
        console.log(result);
        console.log(result.profit)
        if(result.profit > pre.profit) return result;
        return pre;
    }, {x: 0, profit: 0})

    return best
}

const finish = 'xrun'

export const convertedObj = (array) => { 
    return array?.reduce((pre, cur) => {
        const [first,second] = cur;
        const firstAmount = parseFloat(first.amount);
        const secondAmount = parseFloat(second.amount);

        if(!pre[first.denom]){
            pre[first.denom] = {
                [second.denom] : { rate : secondAmount/ firstAmount, first: firstAmount, second : secondAmount}
            }
        } else {
            pre[first.denom] = {
                ...pre[first.denom],
                [second.denom] : { rate :secondAmount / firstAmount, first: firstAmount, second : secondAmount}
            }
        }
        if (!pre[second.denom]) {
            pre[second.denom] = {
                [first.denom] : { rate :firstAmount/secondAmount, first: secondAmount, second : firstAmount}
            }
        } else {
            pre[second.denom] = {
                ...pre[second.denom],
                [first.denom] : { rate :firstAmount/secondAmount, first: secondAmount, second : firstAmount}
            }
        }
        return pre;
    }, {})
}

export const CheckCoin = ({data, startPoint} : {data: any, startPoint: string}) =>{
    const layout = {
        labelCol: {span: 8},
        wrapperCol: {span: 8},
    };
    const tailLayout = {
        wrapperCol: {offset: 8, span: 8},
    };
    const [values, setValues] = useState<any>({startPoint, coin:'10000', gas:'0.3'});
    const [result , setResult] = useState<any>({});
    useEffect(()=>{
        if(!(values.startPoint && values.coin && values.gas) ) return;
        const obj = convertedObj(data);
        if(!obj['uatom']) return;
        const result = getBestTrade(obj, values.startPoint,values.coin,values.gas );
        setResult(result)
    }, [data]);
    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };
    const onFinish = (values: any) => {
        setValues(values);
    };
    return (
        <Form
        {...layout}
        initialValues={values}
        name="basic"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
    >
        <Form.Item name="startPoint" label="sentence" rules={[{required: true}]}>
            <Input/>
        </Form.Item>
        <Form.Item name="coin" label="coin" rules={[{required: true}]}>
            <Input/>
        </Form.Item>
        <Form.Item name="gas" label="gas" rules={[{required: true}]}>
            <Input/>
        </Form.Item>
        <Form.Item {...tailLayout}>
            <Tag icon={<CloseCircleOutlined/>} color="error">
                {`https://gravitydex.io/app#/swap?from=${values.startPoint?.substr(1)}&to=${result.name?.substr(1)}`}
            </Tag>
            {Object.keys(result).map((name, i ) => {
                return <Tag icon={<CheckCircleOutlined/>} color="success" key={`xxxxx${i}`}>
                    {name}: {result[name]}
                </Tag>
            })
            }
        </Form.Item>
        <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit">
                Submit
            </Button>
        </Form.Item>
    </Form>)
}