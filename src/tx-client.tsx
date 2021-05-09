import {txClient} from "./@starport/tendermint-liquidity-js/tendermint/liquidity/tendermint.liquidity.v1beta1/module"
import axios from "axios";
import {chainInfo} from "./config"
import {coins} from "cosmjs-amm/launchpad"

export async function BroadcastLiquidityTx(txInfo, data) {
    if (!(window as any).getOfflineSigner) return;
    const signer = (window as any).getOfflineSigner(chainInfo.chainId);

    const txGenerator = await txClient(signer, {addr: chainInfo.rpc})
    let msg = null
    // if (txInfo.type === 'msgCreatePool') {
    //     try {
    //         msg = txGenerator.msgCreatePool(txInfo.data)
    //     } catch (e) {
    //         console.log(e)
    //         throw e;
    //     }
    // } else if (txInfo.type === 'msgDeposit') {
    //     try {
    //         msg = txGenerator.msgDepositWithinBatch(txInfo.data)
    //     } catch (e) {
    //         console.log(e)
    //         throw e;
    //     }
    // } else if (txInfo.type === 'msgWithdraw') {
    //     try {
    //         msg = txGenerator.msgWithdrawWithinBatch(txInfo.data)
    //     } catch (e) {
    //         console.log(e)
    //         throw e;
    //     }
    // } else
    if (txInfo.type === 'msgSwap') {
        try {
            msg = txGenerator.msgSwapWithinBatch(txInfo.data)
        } catch (e) {
            console.log(e)
            throw e;
        }
    }
    const fee = {
        amount: coins(2000, "uatom"),
        gas: "300000", // 180k
    };
    const waitTime = (time) => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true)
            }, time)
        })
    };
    const total = async () => {
        try {
            const txBroadcastResponse: any = await txGenerator.signAndBroadcast([msg], {
                fee: fee,
                memo: 'night mutual code obscure series jacket april keen narrow move thing hungry'
            })
            if (txBroadcastResponse.code !== undefined) {
                const failMsg = {type: data.type, resultData: txBroadcastResponse.rawLog}
                console.log("error")
                console.log(txBroadcastResponse, failMsg)
                throw new Error('fail');
            } else {
                let count = 0;
                const t = setInterval(() => {
                    if (count < 11) {
                        count++;
                        return;
                    }
                    clearInterval(t);
                }, 1000)
                const txResult = setInterval(async () => {
                    try {
                        let response = await getTxResult(txBroadcastResponse.height, data)

                        if (data.type === "Swap") {
                            response.demand_coin_denom = data?.demandCoinDenom
                            if (response.success === 'fail') {
                                response = "There may have been a drastic change in pool price recently or increase slippage tolerance(top-right gear button)"
                            }
                        }
                        const result = {type: data.type, resultData: response}
                        if (result.resultData.success === "success") {
                            clearInterval(txResult);
                            return result;
                        } else {
                            throw new Error(JSON.stringify(response));
                        }
                    } catch (e) {
                        console.log(e);
                        if (count > 10) {
                            clearInterval(txResult);
                        }
                        throw (e);
                    }
                }, 1000)
            }
        } catch (e) {
            console.log("error", e)
            const failMsg = {type: data.type, resultData: String(e)}
            console.log(failMsg);
            throw e;
        }
    }
    const re = await total();
    return;
}


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