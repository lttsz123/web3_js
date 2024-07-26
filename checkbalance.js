const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const fs = require('fs');

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


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to read addresses from file and claim faucet
async function processAddresses(file) {
    const result_list = []
    try {
        const addresses = fs.readFileSync(file, { encoding: 'utf-8' }).split('\n').map(a => a.trim()).filter(Boolean);
        for (const address of addresses) {
            if (address) { // Ensure address is not empty
                await  axios.get(`https://allora-api.testnet-1.testnet.allora.network/cosmos/bank/v1beta1/balances/${address}`)
                    .then(response => {
                        const result = response.data;
                        try{
                            let myData = `${address}:${result.balances[0].amount}`
                            console.log(myData)
                        }catch {
                            result_list.push(address)
                            console.log(response.data)
                        }

                    })
                    .catch(error => {
                        console.error('Error fetching addresses:', error);

                    });
            }
        }
        const addressText = result_list.join('\n');
        fs.writeFile('not_balance.txt', addressText, err => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('Addresses written to success_get.txt');
            }
        });
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


processAddresses(fileName);
