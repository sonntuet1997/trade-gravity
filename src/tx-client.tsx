import {txClient} from "./@starport/tendermint-liquidity-js/tendermint/liquidity/tendermint.liquidity.v1beta1/module"
import axios from "axios";
import {chainInfo} from "./config"
import {coins} from "cosmjs-amm/launchpad"

const generateMessage = (txInfo, txGenerator) => {
    if (txInfo.type === 'msgCreatePool') {
        try {
            return  txGenerator.msgCreatePool(txInfo.data)
        } catch (e) {
            console.log(e)
        }
    } else if (txInfo.type === 'msgDeposit') {
        try {
            return  txGenerator.msgDepositWithinBatch(txInfo.data)
        } catch (e) {
            console.log(e)
        }
    } else if (txInfo.type === 'msgWithdraw') {
        try {
            return  txGenerator.msgWithdrawWithinBatch(txInfo.data)
        } catch (e) {
            console.log(e)
        }
    } else if (txInfo.type === 'msgSwap') {
        try {
            return  txGenerator.msgSwapWithinBatch(txInfo.data)
        } catch (e) {
            console.log(e)
        }
    }
}

export async function BroadcastLiquidityTx(txInfoList, data, dispatch) {
    const signer = (window as any).getOfflineSigner(chainInfo.chainId);
    const txGenerator = await txClient(signer, {addr: chainInfo.rpc})
    let msgList = txInfoList.map(t => generateMessage(t, txGenerator));
    const fee = {
        amount: coins(2000, "uatom"),
        gas: Math.max(msgList.length * 80000, 100000).toString(),
    };
    try {
        const txBroadcastResponse = await txGenerator.signAndBroadcast(msgList, {fee: fee, memo: "competition-keplr"})
        console.log(txBroadcastResponse);
        if ((txBroadcastResponse as any).code !== undefined) {
            const failMsg = {type: data.type, resultData: txBroadcastResponse.rawLog}
            dispatch({status: 'broadcastFail', data: failMsg})

            console.log("error")
            console.log(txBroadcastResponse.rawLog)
        } else {
            console.log("success")
            console.log(txBroadcastResponse)

            dispatch({status: 'broadcastSuccess', data})

            const txResult = setInterval(async () => {
                try {
                    let response: any = await getTxResult(txBroadcastResponse.height, data)

                    if (data.type === "Swap") {
                        if (response.success === 'fail') {
                            response = "There may have been a drastic change in pool price recently or increase slippage tolerance(top-right gear button)"
                        }
                    }

                    const result = {type: data.type, resultData: response}
                    if (result.resultData.success === "success") {
                        dispatch({status: 'txSuccess', data: result})
                    } else {
                        dispatch({status: 'txFail', data: result})
                    }
                    clearInterval(txResult)
                } catch (e) {
                    console.log(e)
                }
            }, 1000)
        }

    } catch (e) {
        console.log("error", e)
        const failMsg = {type: data.type, resultData: String(e)}
        dispatch({status: 'broadcastFail', data: failMsg})
        console.log(e.rawLog?.split(':')[2].trim())
    }


    async function getTxResult(height, data) {
        const response = await axios.get(`${chainInfo.rpc}/block_results?height=${height}`)
        const checks = getEndBlockChecks(data)
        let successData = {}

        if (data.type === "Create") {
            successData = {success: "success"}
        } else {
            console.log(response.data)
            if (response.data.result?.end_block_events) {
                let isMine = false
                response.data.result?.end_block_events?.forEach((item) => {
                    if (item.type === checks.type) {
                        item.attributes.forEach((result) => {
                            console.log(atob(result.key), atob(result.value))

                            if (atob(result.key) === checks.txAddress) {
                                if (atob(result.value) === checks.userAddress) {
                                    isMine = true
                                } else {
                                    isMine = false
                                }
                            }
                            if (isMine) {
                                successData[atob(result.key)] = atob(result.value)
                            }

                        })
                    }
                })
            } else {
                successData['success'] = "fail"
            }
        }
        return successData
    }

    function getTxProcessingStatus(status, data) {
        if (status === 'init') {
            return {type: 'store/setTxModalStatus', payload: {type: data.type, broadcastStatus: 'pending'}}
        }

        if (status === 'broadcastSuccess') {
            return {
                type: 'store/setTxModalStatus',
                payload: {type: data.type, broadcastStatus: 'success', transactionResultStatus: 'pending'}
            }
        }

        if (status === 'broadcastFail') {
            return {
                type: 'store/setTxModalStatus',
                payload: {
                    type: data.type,
                    broadcastStatus: 'fail',
                    resultData: {data: data.resultData, isSuccess: false}
                }
            }
        }


        if (status === 'txSuccess') {
            return {
                type: 'store/setTxModalStatus',
                payload: {
                    type: data.type,
                    broadcastStatus: 'success',
                    transactionResultStatus: 'success',
                    resultData: {data: data.resultData, isSuccess: true}
                }
            }
        }
        if (status === 'txFail') {
            return {
                type: 'store/setTxModalStatus',
                payload: {
                    type: data.type,
                    broadcastStatus: 'success',
                    transactionResultStatus: 'fail',
                    resultData: {data: data.resultData, isSuccess: false}
                }
            }
        }
    }
}

// export async function BroadcastLiquidityTx(txInfo, data, callback) {
//     if (!(window as any).getOfflineSigner) return;
//     const signer = (window as any).getOfflineSigner(chainInfo.chainId);
//
//     const txGenerator = await txClient(signer, {addr: chainInfo.rpc})
//     let msg = null
//     // if (txInfo.type === 'msgCreatePool') {
//     //     try {
//     //         msg = txGenerator.msgCreatePool(txInfo.data)
//     //     } catch (e) {
//     //         console.log(e)
//     //         throw e;
//     //     }
//     // } else if (txInfo.type === 'msgDeposit') {
//     //     try {
//     //         msg = txGenerator.msgDepositWithinBatch(txInfo.data)
//     //     } catch (e) {
//     //         console.log(e)
//     //         throw e;
//     //     }
//     // } else if (txInfo.type === 'msgWithdraw') {
//     //     try {
//     //         msg = txGenerator.msgWithdrawWithinBatch(txInfo.data)
//     //     } catch (e) {
//     //         console.log(e)
//     //         throw e;
//     //     }
//     // } else
//     if (txInfo.type === 'msgSwap') {
//         try {
//             msg = txGenerator.msgSwapWithinBatch(txInfo.data)
//         } catch (e) {
//             console.log(e)
//             throw e;
//         }
//     }
//     const fee = {
//         amount: coins(2000, "uatom"),
//         gas: "100000", // 180k
//     };
//     const total = async () => {
//         try {
//             const txBroadcastResponse: any = await txGenerator.signAndBroadcast([msg], {
//                 fee: fee,
//             })
//             console.log(1);
//             if (txBroadcastResponse.code !== undefined) {
//                 const failMsg = {type: data.type, resultData: txBroadcastResponse.rawLog}
//                 console.log("error")
//                 console.log(txBroadcastResponse, failMsg)
//                 console.log(2);
//                 throw new Error('fail');
//             } else {
//                 let count = 0;
//
//                 const txResult = setInterval(async () => {
//                     try {
//                         let response = await getTxResult(txBroadcastResponse.height, data)
//                         if (data.type === "Swap") {
//                             response.demand_coin_denom = data?.demandCoinDenom
//                             if (response.success === 'fail') {
//                                 response = "There may have been a drastic change in pool price recently or increase slippage tolerance(top-right gear button)"
//                             }
//                         }
//                         const result = {type: data.type, resultData: response}
//                         console.log(3);
//                         if (result.resultData.success === "success") {
//                             clearInterval(txResult);
//                             return result;
//                         } else {
//                             console.log(4);
//                             throw new Error(JSON.stringify(response));
//                         }
//                     } catch (e) {
//                         console.log(e);
//                         if (count > 7) {
//                             clearInterval(txResult);
//                         }
//                         console.log(5);
//                         throw (e);
//                     }
//                 }, 1000);
//                 const t = setInterval(() => {
//                     if (count < 11) {
//                         count++;
//                         return;
//                     }
//                     clearInterval(txResult);
//                     clearInterval(t);
//                 }, 1000)
//             }
//         } catch (e) {
//             console.log("error", e)
//             const failMsg = {type: data.type, resultData: String(e)}
//             console.log(failMsg);
//             throw e;
//         }
//     }
//     await total();
//     return;
// }


async function getTxResult(height, data) {
    const response = await axios.get(`${chainInfo.rpc}/block_results?height=${height}`)
    const checks = getEndBlockChecks(data)
    let successData: any = {}

    if (data.type === "Create") {
        successData = {success: "success"}
    } else {
        console.log(response.data)
        if (response.data.result?.end_block_events) {
            let isMine = false
            response.data.result?.end_block_events?.forEach((item) => {
                if (item.type === checks.type) {
                    item.attributes.forEach((result) => {
                        console.log(atob(result.key), atob(result.value))

                        if (atob(result.key) === checks.txAddress) {
                            if (atob(result.value) === checks.userAddress) {
                                isMine = true
                            } else {
                                isMine = false
                            }
                        }
                        if (isMine) {
                            successData[atob(result.key)] = atob(result.value)
                        }

                    })
                }
            })
        } else {
            successData.success = "fail"
        }
    }
    return successData
}


function getEndBlockChecks(data) {
    if (data.type === "Swap") {
        return {type: "swap_transacted", txAddress: 'swap_requester', userAddress: data.userAddress}
    }

    if (data.type === "Redeem") {
        return {type: "withdraw_from_pool", txAddress: 'withdrawer', userAddress: data.userAddress}
    }

    if (data.type === "Add Liquidity") {
        return {type: "deposit_to_pool", txAddress: 'depositor', userAddress: data.userAddress}
    }
}

export async function getBlockHeight() {
    try {
        const response = await axios.get(`${chainInfo.rpc}/abci_info`)
        return response.data.result.response.last_block_height
    } catch (e) {
        console.log(e)
    }
}