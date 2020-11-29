var express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const TARGET_URL = 'https://api.line.me/v2/bot/message/reply';
const TOKEN = 'kZcWJ5n53KJ9b/QJWFyAYz4xYX278PTqU3+UsLhSTFyrDp11WfzMKXXFTpefwdRrBcQz6hPr7wexoaVjbEbqrjyfIjMsocuFKGsYZTiWG0OdLwyZ4BfP785umJOeZod3lqyljmErg4/edTIOo9aHqAdB04t89/1O/w1cDnyilFU=';
const fs = require('fs');
const path = require('path');
const HTTPS = require('https');
const domain = "www.osstest1105.ml";
const sslport = 23023;
const bodyParser = require('body-parser');
const router = express.Router();
var resultmessage = "";
var app = express();
app.use(bodyParser.json());
app.post('/hook', function (req, res) {

    var eventObj = req.body.events[0];
    var source = eventObj.source;
    var message = eventObj.message;

    // request log
    console.log('======================', new Date() ,'======================');
    console.log('[request]', req.body);
    console.log('[request source] ', eventObj.source);
    console.log('[request message]', eventObj.message);

    if (eventObj.message.text.indexOf("장소")!=-1){//"_구" 확진자 방문 "장소"
        places(eventObj.replyToken, eventObj.message);
    }
    
    res.sendStatus(200);
});

function places(replyToken, message) {
    console.log(message.text);
    resultmessage = "";
    (async() => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("https://www.seoul.go.kr/coronaV/coronaStatus.do?menu_code=01");

        // 페이지의 HTML을 가져온다.
        const content = await page.content();
        // $에 cheerio를 로드한다.
        const $ = cheerio.load(content);
        var my= "";
        var all_gu = ["종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구"];
        for (var i = 0; i<all_gu.length; i++){
            if (message.text.indexOf(all_gu[i])!=-1){
                my = all_gu[i];
                break;
            }
        }
        console.log(my);
        var cnt = 0;
        var ttr_lists = $("#DataTables_Table_0").children("tbody").children("tr");
        for (var t = 0; t<ttr_lists.length; t++){
            var tr_lists = ttr_lists.eq(t).children("td").children("table").children("tbody").children("tr");
                    
            scrapingResult = {
                    'district': '',
                    'type': '',
                    'business_name': '',
                    'address': '',
                    'date_time':'',
                    'disinfection':''
                }
            for (var row = 0; row<tr_lists.length; row++){
                scrapingResult['district'] = String(tr_lists.eq(row).find('td:nth-child(1)').text());
                if (scrapingResult['district']!==my) continue;
                scrapingResult['type'] = String(tr_lists.eq(row).find('td:nth-child(2)').text());
                if (scrapingResult['type']=="자택") continue;
                scrapingResult['business_name'] = String(tr_lists.eq(row).find('td:nth-child(3)').text());
                if (scrapingResult['business_name'].indexOf("비공개")!=-1) continue;
                if (scrapingResult['business_name'].indexOf("완료")!=-1) continue;
                scrapingResult['address'] = String(tr_lists.eq(row).find('td:nth-child(4)').text());
                if (scrapingResult['address'].indexOf("비공개")!=-1) continue;
                scrapingResult['date_time'] = String(tr_lists.eq(row).find('td:nth-child(5)').text());
                if (scrapingResult['date_time'].indexOf("비공개")!=-1) continue;
                if (scrapingResult['date_time'].indexOf("자가격리")!=-1) continue;
                scrapingResult['disinfection'] = String(tr_lists.eq(row).find('td:nth-child(6)').text());
                resultmessage+=scrapingResult['district']+" ";
                resultmessage+=scrapingResult['type']+" ";
                resultmessage+=scrapingResult['business_name']+" ";
                resultmessage+=scrapingResult['address']+" ";
                resultmessage+=scrapingResult['date_time']+"\n\n";
                console.log(scrapingResult);
                cnt++;
                if (cnt==10) break;
            }
            if (cnt==10) break;
            
        }

        if (cnt==0){
        resultmessage+="확진자 방문 장소가 없습니다.\n";
        }
        resultmessage+="*「확진환자의 이동경로 등 정보공개 지침(1판)」에 따라 확진환자의 성별, 연령, 국적, 거주지(읍면동 단위 이하) 등 개인을 특정하는 정보는 공개되지 않습니다.*\n"
        browser.close();
            
        request.post(
            {
                url: TARGET_URL,
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                },
                json: {
                    "replyToken":replyToken,
                    "messages":[
                        {
                            "type":"text",
                            "text":resultmessage
                        }
                    ]
                }
            },(error, response, body) => {
                console.log(body);
            });
    })();

    }
    try {
        const option = {
        ca: fs.readFileSync('/etc/letsencrypt/live/' + domain +'/fullchain.pem'),
        key: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain +'/privkey.pem'), 'utf8').toString(),
        cert: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain +'/cert.pem'), 'utf8').toString(),
        };
    
        HTTPS.createServer(option, app).listen(sslport, () => {
        console.log(`[HTTPS] Server is started on port ${sslport}`);
        });
    } catch (error) {
        console.log('[HTTPS] HTTPS 오류가 발생하였습니다. HTTPS 서버는 실행되지 않습니다.');
        console.log(error);
    
    }

    