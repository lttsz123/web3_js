const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const fs = require('fs');
const {DirectSecp256k1HdWallet} = require("@cosmjs/proto-signing");
const {stringToPath} = require("@cosmjs/crypto");
// Configure axios to retry failed requests using axios-retry
axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000, // exponential backoff
    retryCondition: (error) => {
        // Retry on network errors and idempotent requests, including 504 errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 504;
    },
});
axios.defaults.timeout = 100000; // 30 seconds

//
// // Configure axios default timeout
// axios.defaults.timeout = 20000; // 20 seconds

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to read addresses from file and claim faucet
async function processAddresses(file) {
    const result_list = []
    let count = 0
    try {
        const mnemonics = fs.readFileSync(file, { encoding: 'utf-8' }).split('\n').map(a => a.trim()).filter(Boolean);
        for (const mnemonic of mnemonics) {
            for (const mnemonic of mnemonics) {
                if (mnemonic) { // 确保助记词不为空
                    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
                        prefix: "allo",
                        hdPaths: [stringToPath("m/44'/118'/0'/0/0")]
                    });
                    const [firstAccount] = await wallet.getAccounts();
                    const address=firstAccount.address;
                    if (address) { // Ensure address is not empty
                        await  axios.post(`https://api.upshot.xyz/v2/allora/users/connect`,{
                            "allora_address": address,
                            "evm_address": null
                        },{headers:{"x-api-key":"UP-0d9ed54694abdac60fd23b74"}})
                            .then(response => {
                                const result = response.data;
                                try{
                                    // let rid = `${result.request_id}`
                                    // console.log(result)
                                    // console.log(rid)
                                    axios.get(`https://api.upshot.xyz/v2/allora/points/${result.data.id}`,{headers:{"x-api-key":"UP-0d9ed54694abdac60fd23b74"}})
                                        .then(response => {
                                            const result = response.data;
                                            try{
                                                // let myData = `${address}:${result.data.campaign_points}`
                                                let myData = result.data.campaign_points
                                                if (myData.length !==0){
                                                    console.log(mnemonic)
                                                    console.log(address)
                                                    console.log(myData)
                                                    count++
                                                }

                                            }catch {
                                                console.log(response.data)
                                            }

                                        })
                                        .catch(error => {
                                            console.error('Error fetching addresses:', error);

                                        });
                                }catch {
                                    console.log(response.data)
                                }

                            })
                            .catch(error => {
                                console.error('Error fetching addresses:', error);

                            });
                    }
                }
            }

        }
        console.log("total:"+count+"/"+mnemonics.length)
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
