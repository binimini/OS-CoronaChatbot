var express = require('express');
const request = require('request');
const cheerio = require('cheerio');//크롤링 module
const xlsx = require("xlsx");//엑셀 파싱 module
const puppeteer = require('puppeteer');
const TARGET_URL = 'https://api.line.me/v2/bot/message/reply';
//merge하기전 토큰과 도메인 수정할것!!
const TOKEN = 'r/qgCfP0wwGegeaGmAvPTztE0nCDg5t35IUJap+U2i0Kvm0DMMjxdiAPQ/Pg+zAqaJrMh8c1Oj/QtGZTBOwgKLmQrT3xkAyCA26ipxYPmMwbjg7C6JhxeGI7TEyBXDP2qKmACxledtL8zzqRMOlLvAdB04t89/1O/w1cDnyilFU=';
const fs = require('fs');
const path = require('path');
const HTTPS = require('https');
const domain = "www.osschatbotassignment.ml";
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
    else if (eventObj.message.text.indexOf("거리두기")!=-1){//사회적 "거리두기" "_단계" (1, 1.5, 2, 2.5, 3)
        steps(eventObj.replyToken, eventObj.message);
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
            var my= "";// 내 구
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
                        
                scrapingResult = {//결과 나타낼 형식
                        'district': '',
                        'type': '',
                        'business_name': '',
                        'address': '',
                        'date_time':'',
                        'disinfection':''
                    }
                for (var row = 0; row<tr_lists.length; row++){
                    scrapingResult['district'] = String(tr_lists.eq(row).find('td:nth-child(1)').text());
                    if (scrapingResult['district']!==my) continue;//구역이 내 구역인 경우만
                    scrapingResult['type'] = String(tr_lists.eq(row).find('td:nth-child(2)').text());
                    if (scrapingResult['type']=="자택") continue;//자택 장소 필요X
                    scrapingResult['business_name'] = String(tr_lists.eq(row).find('td:nth-child(3)').text());
                    if (scrapingResult['business_name'].indexOf("비공개")!=-1) continue;//다 처리되어서 비공개인 장소들 처리
                    if (scrapingResult['business_name'].indexOf("완료")!=-1) continue;
                    scrapingResult['address'] = String(tr_lists.eq(row).find('td:nth-child(4)').text());
                    if (scrapingResult['address'].indexOf("비공개")!=-1) continue;
                    scrapingResult['date_time'] = String(tr_lists.eq(row).find('td:nth-child(5)').text());
                    if (scrapingResult['date_time'].indexOf("비공개")!=-1) continue;
                    if (scrapingResult['date_time'].indexOf("자가격리")!=-1) continue;//자가격리 환자 경로 처리
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
            resultmessage+="확진자 방문 장소가 없습니다.\n\n";
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
    function steps(replyToken, message){
        console.log("steps");
        const workbook = xlsx.readFile("stepexcel.xlsx");//거리두기 정보 담긴 엑셀 읽기
        var firstSheetName = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[firstSheetName];
        var step_num;
        if (message.text.indexOf("1단계")!=-1){
            step_num = "2"; 
        }
        else if (message.text.indexOf("1.5단계")!=-1){
            step_num = "3"; 
        }
        else if (message.text.indexOf("2단계")!=-1){
            step_num = "4"; 
        }
        else if (message.text.indexOf("2.5단계")!=-1){
            step_num = "5"; 
        }
        else if (message.text.indexOf("3단계")!=-1){
            step_num = "6"; 
        }
        else{
            step_num = -1;
        }
        if (step_num!=-1){
            var alpha = 'B';
            var resultmessage = new Array();
            for (var i = 0; i<6; i++){
                deserved_step = alpha+step_num;
                resultmessage[i] = worksheet[alpha+'1'].v+"\n";
                resultmessage[i] += worksheet[deserved_step].v;
                alpha = String.fromCharCode(alpha.charCodeAt(0)+1);
            }
        }
        if (step_num==-1){
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
                                "text":"거리두기 단계 입력이 잘못되었습니다."
                            }
                        ]
                
                    }
                },(error, response, body) => {
                    console.log(body);
                });
        }
        else{
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
                                "text":resultmessage[0]
                            },
                            {
                                "type":"text",
                                "text":resultmessage[1]
                            },                           
                            {
                                "type":"text",
                                "text":resultmessage[2]
                            },                            
                            {
                                "type":"text",
                                "text":resultmessage[3]
                            },
                            {
                                "type":"text",
                                "text":resultmessage[4]
                            }
                        ]
                
                    }
                },(error, response, body) => {
                    console.log(body);
                });
        }
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
    