import {useEffect} from "react";
import {getBlockHeight} from "../../src/tx-client";
import axios from "axios";
import {chainInfo} from "../../src/config";

const getBlockData = async (blockHeight) => {
    const blockData = await axios.get(`${chainInfo.rpc}/block_results?height=${blockHeight}`);
    const data = blockData.data.result
    const dataConfig = [data.begin_block_events, data.end_block_events, data.txs_results]
    dataConfig[0]?.map((item) => {
        item.attributes.map((attItem) => {
            attItem.key = atob(attItem.key)
            attItem.value = atob(attItem.value)
            console.log(attItem)
        })
    })
    dataConfig[1]?.map((item) => {
        item.attributes.map((attItem) => {
            attItem.key = atob(attItem.key)
            attItem.value = atob(attItem.value)
            console.log(attItem)
        })
    })
    dataConfig[2]?.map((item) => {
        item.data = atob(item.data)
        item.events.map((eventItem) => {
            eventItem.attributes.map((attItem) => {
                attItem.key = atob(attItem.key)
                attItem.value = atob(attItem.value)
                console.log(attItem)
            })
        })
    })
    let newData = {...blockData.data.result,
        begin_block_events: dataConfig[0],
        end_block_events: dataConfig[1],
        txs_results: dataConfig[2] }
    console.log(newData)
    console.log(JSON.stringify(newData))
    console.log(dataConfig)
    console.log(blockHeight);
    console.log(blockData)
}

const Test = () => {
    useEffect( () => {
        setTimeout(async  ()=>{
            const blockHeight1 = await getBlockHeight() - 1;
            const blockHeight2 = await getBlockHeight() - 2;
            await getBlockData(blockHeight1)
            await getBlockData(blockHeight2)

        }, 1000)
    }, []);
    return (<>ádasd</>)
}

export default Test;