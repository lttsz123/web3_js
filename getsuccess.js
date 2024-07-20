const axios = require('axios');
const fs = require('fs');

// 定义要请求的URL
const url = 'http://158.220.116.212:12581/get_addresses';

// 发送GET请求
axios.get(url)
    .then(response => {
        // 假设响应数据是一个JSON数组
        const addresses = response.data;

        // 将地址数组转换为字符串，每个地址一行
        const addressText = addresses.join('\n');

        // 写入文件
        fs.writeFile('success.txt', addressText, err => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('Addresses written to success.txt');
            }
        });
    })
    .catch(error => {
        console.error('Error fetching addresses:', error);
    });