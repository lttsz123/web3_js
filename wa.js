const fs = require('fs');
const { DirectSecp256k1HdWallet } = require("@cosmjs/stargate"); // 替换为 @cosmjs/stargate
const { stringToPath } = require("@cosmjs/crypto");

async function generateWalletsFromMnemonics(file) {
    try {
        const mnemonics = fs.readFileSync(file, { encoding: 'utf-8' }).split('\n').map(m => m.trim()).filter(Boolean);
        const outputFile = file + '.addresses'; // 添加后缀以避免覆盖原始文件
        const addresses = [];

        for (const mnemonic of mnemonics) {
            if (mnemonic) { // 确保助记词不为空
                const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
                    prefix: "cosmos",
                    hdPaths: [stringToPath("m/44'/118'/0'/0/0")]
                });
                const [firstAccount] = await wallet.getAccounts();
                addresses.push(firstAccount.address);
            }
        }

        fs.writeFileSync(outputFile, addresses.join('\n'));
        console.log(`Addresses have been written to ${outputFile}`);
    } catch (error) {
        console.error(`Error generating wallets: ${error.message}`);
    }
}

// 从命令行参数获取文件名
const fileName = process.argv[2];
if (!fileName) {
    console.log("Please provide a file name.");
    process.exit(1);
}

generateWalletsFromMnemonics("testmnumonics.txt");
