import {useEffect, useState} from "react";
import {getBlockHeight} from "../../src/tx-client";
import axios from "axios";
import {chainInfo} from "../../src/config";
import { isEmpty, result } from "lodash";

const transactionStatistics = (transaction) => {
    let resObj = {}
    resObj['type'] = transaction.data
    resObj['data'] = transaction.events.map((eventItem) => 
         eventItem.type === 'transfer' ? (
            {
                'recipient': eventItem.attributes[0], 
                'sender': eventItem.attributes[1], 
                'amount': eventItem.attributes[2],
                'detailData': transaction.events[6]?.attributes,
            }) : null 
    ).filter(sender => sender != null);
    // if (resObj['sender'].length !== 2) debugger;
    return resObj
}

const getBlockData = async (blockHeight) => {
    const blockData = await axios.get(`${chainInfo.rpc}/block_results?height=${blockHeight}`);
    const data = blockData.data.result
    const dataConfig = [data.begin_block_events, data.end_block_events, data.txs_results]
    // console.log(dataConfig)
    dataConfig[0]?.map((item) => {
        item.attributes.map((attItem) => {
            attItem.key = atob(attItem.key)
            attItem.value = atob(attItem.value)
            // console.log(attItem)
        })
    })
    dataConfig[1]?.map((item) => {
        item.attributes.map((attItem) => {
            attItem.key = atob(attItem.key)
            attItem.value = atob(attItem.value)
            // console.log(attItem)
        })
    })
    dataConfig[2]?.map((item) => {
        item.data = atob(item.data)
        item.events.map((eventItem) => {
            eventItem.attributes.map((attItem) => {
                attItem.key = atob(attItem.key)
                attItem.value = atob(attItem.value)
                // console.log(attItem)
            })
        })
    })
    let newData = {...blockData.data.result,
        begin_block_events: dataConfig[0],
        end_block_events: dataConfig[1],
        txs_results: dataConfig[2] }
    // console.log(blockData)
    console.log(newData) 
    // console.log(JSON.stringify(newData))
    if(!newData.txs_results) console.log(`Bug in ${blockHeight}:\n ${newData}`)
    
    return ({
        dataItem: newData.txs_results?.filter(resItem => {
            return resItem.data.includes('swap_within_batch')
            }).map(txsItem => {
                // if (txsItem.type.includes('deposit_within_batch'))
                // console.log(txsItem)
                console.log(transactionStatistics(txsItem))
                return transactionStatistics(txsItem)
            }),
        dataOption: newData
    })
    // console.log(dataConfig)
}

const Test = () => {
    const [tsx, setTsx] = useState([])
    useEffect( () => {
        setTimeout(async  ()=> {
            let blockHeight = (await getBlockHeight());
            const data = (await Promise.all(Array(15).fill(0).map(async(_,index)=>{
                let dataItem = await getBlockData(blockHeight- index - 1);
                setTsx([...tsx, dataItem.dataOption])
                // console.log(dataItem)
                // console.log(tsx)
                return dataItem.dataItem;
            }))).reduce((pre, cur)=> {
                cur && (pre = pre.concat(...cur))
                return pre;
            }, []);
            let lastData = data.reduce((pre, cur) => {
                pre.push(...cur.data);
                return pre;
            }, [])
            lastData = lastData.map(item =>({
                sender: item.sender.value,
                amount : item.amount.value,
                detailData: item.detailData,
            }));
            // console.log(lastData)
            //// allData need in lastData ////
            setTsx([...tsx, lastData])

            const [feeData, transactionData] = lastData.reduce((pre,cur, cI)=>{
                // console.log(cI)
                if(cI%2 === 0){
                  const preObj = pre[0];
                  let sender = preObj[cur.data];
                //   console.log(cur)
                  if(sender){
                    sender = {amount: sender.amount + parseFloat(cur.amount.split('uatom')[0])}
                    // if(parseFloat(cur.amount.split('uatom')[0]) !== 300000) {
                    //     console.log(cur)
                    //     debugger
                    // };
                    // console.log('if:', cur.amount.split('uatom')[0])
                  } else {
                    sender = {amount: parseFloat(cur.amount.split('uatom')[0])}
                    // if(sender.amount !== 300000) debugger;
                    // console.log('else', cur.amount.split('uatom')[0])
                  }
                  return [{...preObj, [cur.sender] : sender}, pre[1]]
                } else {
                    const preObj = pre[1];
                  let sender = preObj[cur.sender];
                  if(sender){
                    console.log(sender)
                    sender = {
                        amount: sender.amount 
                        + ' || ' 
                        + cur.amount
                        + ' to '
                        //   + parseFloat(cur.amount.replace(/[a-z]+/g, ''))
                        + parseFloat(cur.detailData.find(item => item.key === "offer_coin_amount").value) 
                        /
                        + parseFloat(cur.detailData.find(item => item.key === "order_price").value) 
                      //   + ' '
                        + cur.detailData.find(item => item.key === "demand_coin_denom").value 

                    };
                  } else {
                      sender = {
                          amount: cur.amount
                          + ' to '
                        //   + parseFloat(cur.amount.replace(/[a-z]+/g, ''))
                          + parseFloat(cur.detailData.find(item => item.key === "offer_coin_amount").value) 
                          /
                          + parseFloat(cur.detailData.find(item => item.key === "order_price").value) 
                        //   + ' '
                          + cur.detailData.find(item => item.key === "demand_coin_denom").value 
                        }
                  }
                  return [pre[0], {...preObj, [cur.sender] : sender}];
                }
            }, [{},{}])

            console.log(feeData, transactionData)
        }, 1000)
    }, []);
    
    return (<>{JSON.stringify(tsx)}</>)
}

export default Test;