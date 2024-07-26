const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const fs = require('fs');
const path = require('path');
const successPath = "success.txt"
// Faucet API endpoint
const FAUCET_URL = 'https://faucet.testnet-1.testnet.allora.network/send/';
const websiteUrl = "https://faucet.testnet-1.testnet.allora.network/"
const websiteKey = '6LeWDBYqAAAAAIcTRXi4JLbAlu7mxlIdpHEZilyo'
const taskType = "RecaptchaV2EnterpriseTaskProxyless"
// Confirm axios-retry is loaded
console.log(`axiosRetry loaded: ${typeof axiosRetry === 'function'}`);

// Configure axios to retry failed requests using axios-retry
axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000, // exponential backoff
    retryCondition: (error) => {
        // Retry on network errors and idempotent requests, including 504 errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 504;
    },
});

// Configure axios default timeout
axios.defaults.timeout = 30000; // 30 seconds

async function createTask() {
    const url = "https://tc.api.yescaptcha.com/createTask";
    const params = {
        clientKey: clientKey,
        task: {
            websiteURL: websiteUrl,
            websiteKey: websiteKey,
            type: taskType,
        },
        softID: clientKey,
    };

    const response = await axios.post(url, params);
    console.log(response.data)
    if (!response.data){
        return {"taskId":undefined}
    }
    return response.data;
}

// 获取验证码结果
async function getTaskResult(taskId) {
    const url = "https://tc.api.yescaptcha.com/getTaskResult";
    const params = {
        clientKey: clientKey,
        taskId: taskId,
    };

    const response = await axios.post(url, params);
    const sleep = (minutes) => {
        const milliseconds = minutes * 60 * 1000;
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    };
    await sleep(0.2);
    // console.log("get task result")
    // console.log(response.data)
    if (response.data.status === "ready") {
        return response.data;
    } else if (response.data.status === "processing") {
        await getTaskResult(taskId);
    }
}

async function recaptcha() {
    console.log("创建任务:")
    const {taskId} = await createTask();
    console.log("获取任务id:"+taskId)
    if (!taskId) {
        console.log("获取验证码任务失败")
        throw new Error(`error captcha`);
    }
    let result = await getTaskResult(taskId);
    console.log("第一次获取结果:"+result)
    // 如果result为空，等待6秒后再次请求
    if (!result) {
        await sleep(6);
        result = await getTaskResult(taskId);
        console.log("第二次获取结果:"+result)
    }
    if (!result) {
        await sleep(6);
        result = await getTaskResult(taskId);
        console.log("第三次获取结果:"+result)
    }
    // 如果再次为空，抛出错误
    if (!result) {
        console.log("获取验证码失败")
        throw new Error(`error captcha`);
    }
    // console.log(result)
    const {gRecaptchaResponse} = result.solution;
    console.log("获取验证码成功")
    // console.log(gRecaptchaResponse)
    return gRecaptchaResponse;
}


// Function to claim faucet tokens
async function claimFaucet(address) {
    try {
        const token = await recaptcha()
        const response = await axios.post(`${FAUCET_URL}`,{
            "chain": "allora-testnet-1",
            "address": address,
            "recapcha_token":token
        });
        console.log(response.data)
        console.log(response.status)
        if(response.status===429 || response.data.code === 429){
            return 429
        }
        if (response.status === 201 && response.data.message && response.data.message === 'Address enqueued for faucet processing.') {
            console.log(`Successfully claimed faucet for address: ${address}.Response: ${JSON.stringify(response.data)}`);
            fs.appendFileSync(successPath, address+"\n", 'utf8');
            return true
        }else if (response.status === 200 && response.data.code === 429) {
            console.log(`error claimed faucet for address: ${address}.Response: ${JSON.stringify(response.data)}`);
        }
        else {
            console.error(`Failed to claim faucet for address: ${address}. Response: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        console.log(`error.....`)
        if (error.response) {
            if(error.response.status===429){
                return 429
            }
            console.error(`Request failed with status code ${error.response.status} for address: ${address}`);
            // console.log(error.response)
        } else if (error.request) {
            console.error(`No response received for address: ${address}:${error.request}`);
            console.log(error.request)
        } else {
            console.error(`Error claiming faucet for address: ${address}`);
            // console.log(error.message)
        }
    }
    return false
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to read addresses from file and claim faucet
async function processAddresses(file) {
    try {
        const addresses = fs.readFileSync(file, { encoding: 'utf-8' }).split('\n').map(a => a.trim()).filter(Boolean);
        const successAddresses = fs.readFileSync(successPath, { encoding: 'utf-8' }).split('\n').map(a => a.trim()).filter(Boolean);

        for (const address of addresses) {
            if(successAddresses.indexOf(address)!==-1){
                console.log(`这个地址已经成功领水，不用跑了:${address}`)
                continue
            }
            if (address) { // Ensure address is not empty
                // let success = false
                // let many = false;
                // while (!success){
                //     success = await claimFaucet(address);
                console.log(`开始领水:${address}`)
                    let code = await claimFaucet(address);
                    if(code===429){
                        console.log("超过限制，退出。。。。")
                        break
                    }
                    // await  sleep(1000)
                // }
            }
        }
    } catch (error) {
        console.error(`Error processing addresses: ${error.message}`);
    }
}

// // Get the file name from command line arguments
const fileName = process.argv[2];
const clientKey = process.argv[3];
if (!fileName) {
    console.log('Please provide a file name.');
    process.exit(1);
}
if (!clientKey) {
    console.log('Please provide a clientKey.');
    process.exit(1);
}
//
// // Ensure the file path is correct
// const filePath = path.resolve(__dirname, fileName);

processAddresses(fileName);

