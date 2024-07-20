const fs = require('fs');
const axios = require('axios');

// Flask应用的POST接口URL
const url = 'http://158.220.116.212:12581/add_addresses';
// 从命令行参数获取文件名
const fileName = process.argv[2];
if (!fileName) {
    console.log("Please provide a file name.");
    process.exit(1);
}
// 读取本地success.txt文件
fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // 将文件内容按行分割成数组
    const addresses = data.split('\n').filter(line => line.trim() !== '');

    // 构造POST请求的body
    const postData = {
        addresses: addresses
    };

    // 发送POST请求到Flask应用
    axios.post(url, postData)
        .then(response => {
            console.log('Response from server:', response.data);
        })
        .catch(error => {
            console.error('Error sending request:', error);
        });
});