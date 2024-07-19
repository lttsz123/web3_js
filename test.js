const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const fs = require('fs');
const path = require('path');
const successPath = "success.txt"
// Faucet API endpoint
const FAUCET_URL = 'https://faucet.testnet-1.testnet.allora.network/send/allora-testnet-1/';

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
axios.defaults.timeout = 20000; // 20 seconds

// Function to claim faucet tokens
async function claimFaucet(address) {
    try {
        const response = await axios.get(`${FAUCET_URL}${address}`,);
        if (response.status === 200 && response.data.result.code === 0) {
            console.log(`Successfully claimed faucet for address: ${address}.Response: ${JSON.stringify(response.data)}`);
            fs.appendFileSync(successPath, address+"\n", 'utf8');
            return true
        }else if (response.status === 200 && response.data.result.code === 429) {
            console.log(`error claimed faucet for address: ${address}.Response: ${JSON.stringify(response.data)}`);
        }
        else {
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
        const addresses = fs.readFileSync(file, { encoding: 'utf-8' }).split('\n').map(a => a.trim()).filter(Boolean);
        const successAddresses = fs.readFileSync(successPath, { encoding: 'utf-8' }).split('\n').map(a => a.trim()).filter(Boolean);
        if (addresses.length === successAddresses.length){
            console.log("已经全跑好了")
            return
        }
        for (const address of addresses) {
            if(successAddresses.indexOf(address)!==-1){
                console.log(`这个地址已经成功领水，不用跑了:${address}`)
            }
            if (address) { // Ensure address is not empty
                // let success = false
                // let many = false;
                // while (!success){
                //     success = await claimFaucet(address);
                    await claimFaucet(address);
                    await  sleep(1000)
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

