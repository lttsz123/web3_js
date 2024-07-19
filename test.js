const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const fs = require('fs');
const path = require('path');
const successPath = "success.txt"
// Faucet API endpoint
const FAUCET_URL = 'https://faucet.testnet-1.testnet.allora.network/send/allora-testnet-1/';

// Confirm axios-retry is loaded
console.log(`axiosRetry loaded: ${typeof axiosRetry === 'function'}`);

// 定义一个包含不同User-Agent的数组
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Linux; Android 11; Pixel 5 Build/RP1A.201005.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; SM-G986U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/95.0.4638.54 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
];

// 定义一个函数，用于随机选择一个User-Agent
function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}


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
axios.defaults.timeout = 20000; // 20 seconds

// Function to claim faucet tokens
async function claimFaucet(address) {
    try {
        const response = await axios.get(`${FAUCET_URL}${address}`, {
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                "authority": "faucet.testnet-1.testnet.allora.network",
                "method": "GET",
                "path": "/send/allora-testnet-1/fsdfsdf",
                "scheme": "https",
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                "Accept-Language": "zh-CN,zh;q=0.9",
                "Priority": "u=1, i",
                "Referer": "https://faucet.testnet-1.testnet.allora.network/",
                "Sec-Ch-Ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": "\"Windows\"",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin"
            }
        });
        if (response.status === 200 && response.data.result.code === 0) {
            console.log(`Successfully claimed faucet for address: ${address}.Response: ${JSON.stringify(response.data)}`);
            fs.appendFileSync(successPath, address + "\n", 'utf8');
            return true
        } else if (response.status === 200 && response.data.result.code === 429) {
            console.log(`error claimed faucet for address: ${address}.Response: ${JSON.stringify(response.data)}`);
        } else {
            console.error(`Failed to claim faucet for address: ${address}. Response: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        if (error.response) {
            console.error(`Request failed with status code ${error.response.status} for address: ${address}`);
        } else if (error.request) {
            console.error(`No response received for address: ${address}`);
        } else {
            console.error(`Error claiming faucet for address: ${address}`, error.message);
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
        const addresses = fs.readFileSync(file, {encoding: 'utf-8'}).split('\n').map(a => a.trim()).filter(Boolean);
        const successAddresses = fs.readFileSync(successPath, {encoding: 'utf-8'}).split('\n').map(a => a.trim()).filter(Boolean);
        if (addresses.length === successAddresses.length) {
            console.log("已经全跑好了")
            return
        }
        for (const address of addresses) {
            if (successAddresses.indexOf(address) !== -1) {
                console.log(`这个地址已经成功领水，不用跑了:${address}`)
            }
            if (address) { // Ensure address is not empty
                // let success = false
                // let many = false;
                // while (!success){
                //     success = await claimFaucet(address);
                await claimFaucet(address);
                await sleep(1000)
                // }
            }
        }
    } catch (error) {
        console.error(`Error processing addresses: ${error.message}`);
    }
}

// // Get the file name from command line arguments
const fileName = process.argv[2];
if (!fileName) {
    console.log('Please provide a file name.');
    process.exit(1);
}
//
// // Ensure the file path is correct
// const filePath = path.resolve(__dirname, fileName);

processAddresses(fileName);

