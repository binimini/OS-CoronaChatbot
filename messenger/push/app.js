const request = require('request');
const TARGET_URL = 'https://api.line.me/v2/bot/message/push'
const MULTI_TARGET_URL = 'https://api.line.me/v2/bot/message/multicast'
const BROAD_TARGET_URL = 'https://api.line.me/v2/bot/message/broadcast'
const TOKEN = '채널 토큰으로 교체'
const USER_ID = '사용자의 ID, 메세지 수신 시에 확인할 수 있음'

// Single User
// request.post(
//     {
//         url: TARGET_URL,
//         headers: {
//             'Authorization': `Bearer ${TOKEN}`
//         },
//         json: {
//             "to": `${USER_ID}`,
//             "messages":[
//                 {
//                     "type":"text",
//                     "text":"Hello, user"
//                 },
//                 {
//                     "type":"text",
//                     "text":"May I help you?"
//                 }
//             ]
//         }
//     },(error, response, body) => {
//         console.log(body)
//     });


// Multicast User
// request.post(
//     {
//         url: MULTI_TARGET_URL,
//         headers: {
//             'Authorization': `Bearer ${TOKEN}`
//         },
//         json: {
//             "to": [`${USER_ID}`],
//             "messages":[
//                 {
//                     "type":"text",
//                     "text":"Hello, user"
//                 },
//                 {
//                     "type":"text",
//                     "text":"May I help you?"
//                 }
//             ]
//         }
//     },(error, response, body) => {
//         console.log(body)
//     });


// Broadcast
    request.post(
        {
            url: BROAD_TARGET_URL,
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            },
            json: {
                "messages":[
                    {
                        "type":"text",
                        "text":"Hello, user"
                    },
                    {
                        "type":"text",
                        "text":"May I help you?"
                    }
                ]
            }
        },(error, response, body) => {
            console.log(body)
        });