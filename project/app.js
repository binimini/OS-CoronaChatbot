var client = require('cheerio-httpcli'); 
let url = 'https://www.seoul.go.kr/coronaV/coronaStatus.do';
var param = {}; 
let itemObj = {};
client.set('headers', { // 크롤링 방지 우회를 위한 User-Agent setting 
  'user-agent' : 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36', 
  'Accept-Charset': 'utf-8' 
}); 
var express = require('express');
const request = require('request');
const cheerio = require('cheerio');//크롤링 module
const xlsx = require("xlsx");//엑셀 파싱 module
const puppeteer = require('puppeteer');
const TARGET_URL = 'https://api.line.me/v2/bot/message/reply'
const MAP_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'
const TOKEN = 'r/qgCfP0wwGegeaGmAvPTztE0nCDg5t35IUJap+U2i0Kvm0DMMjxdiAPQ/Pg+zAqaJrMh8c1Oj/QtGZTBOwgKLmQrT3xkAyCA26ipxYPmMwbjg7C6JhxeGI7TEyBXDP2qKmACxledtL8zzqRMOlLvAdB04t89/1O/w1cDnyilFU=';
const KAKAO_ID = 'fb1345dd38817291d1f9105a21488b17';
const fs = require('fs');
const path = require('path');
const HTTPS = require('https');
const domain = "www.osschatbotassignment.ml";
const sslport = 23023;
const bodyParser = require('body-parser');
const router = express.Router();
var resultmessage = "";
const { info } = require('console');
var app = express();
app.use(bodyParser.json());

var all_gu = ["종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구"];
//서울시 자치구

app.post('/hook', function (req, res) {

    var eventObj = req.body.events[0];
    var source = eventObj.source;
    var message = eventObj.message;

    // request log
    console.log('======================', new Date() ,'======================');
    console.log('[request]', req.body);
    console.log('[request source] ', eventObj.source);
    console.log('[request message]', eventObj.message);

    if (eventObj.message.text.indexOf("장소")!=-1){//2. "_구" 확진자 방문 "장소"
        places(eventObj.replyToken, eventObj.message);
    }
    else if(message.text.indexOf("오늘") !== -1 || message.text.indexOf("확진자") !== -1 || message.text.indexOf("명")!==-1){ 
      //1. 오늘의 서울시 총 확진자
      today_all(eventObj.replyToken);
    }

    else if(all_gu.indexOf(message.text) !== -1){ //1-1. 오늘의 서울시 __구 확진자 수
      today_gu(eventObj.replyToken, eventObj.message.text);
    }

    else if(message.text.indexOf("선별진료소") !== -1 || message.text.indexOf("선별 진료소") !== -1){
      // 3. __구 선별진료소
      hospital_information(eventObj.replyToken, eventObj.message.text);
    }
    else if (eventObj.message.text.indexOf("거리두기")!=-1){//4. 사회적 "거리두기" "_단계" (1, 1.5, 2, 2.5, 3)
        steps(eventObj.replyToken, eventObj.message);
    }
    else{ //매뉴얼 이외의 입력은 모두 도움말 출력
      information(eventObj.replyToken);
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
                //#DataTables_Table_0 > tbody > tr:nth-child(3) > td > div > table
                //#DataTables_Table_0 > tbody > tr:nth-child(2) > td > div > table > tbody
                var tr_lists = ttr_lists.eq(t).children("td").children("div").children("table").children("tbody").children("tr");
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
                    if (scrapingResult['district']!=my) continue;//구역이 내 구역인 경우만
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
                
            }            if (cnt==0){
            resultmessage+="확진자 방문 장소가 없습니다.\n\n";
            }
            resultmessage+="「확진환자의 이동경로 등 정보공개 지침(1판)」에 따라 확진환자의 성별, 연령, 국적, 거주지(읍면동 단위 이하) 등 개인을 특정하는 정보는 공개되지 않습니다.\n"
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

function today_all(replyToken){ //오늘의 서울시 총 확진자

  var result = {};

  client.fetch(url, param, function(err, $, res, body){ 
    if(err){ console.log(err); 
      return; 
    } 

    result['all'] = $("#container > div.layout-inner.layout-sub > div > div.status > div.status-seoul > div > div.cell.cell1 > div.num.num10 > div > p.counter").text();

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
                      "text":"오늘의 서울시 확진자는 총 "+result['all']+"명입니다."
                  },
                  {
                      "type":"text",
                      "text":"자치구별 확진자를 확인하시려면 원하시는 구를 입력해주세요! ex) 종로구"
                  }
              ]
          }
      },(error, response, body) => {
          console.log(body)
      });


  })

}

function today_gu(replyToken, message){ //오늘의 서울시 __구 확진자 수

  var result={};

  client.fetch(url, param, function(err, $, res, body){

    if(err){
      console.log(err);
      return;
    }

    let parentTag = $("#move-cont1  div:nth-child(3)  table.tstyle-status.mobile.mobile-table  tbody ");

    parentTag.each(function(i, elem){
      result['종로구'] = $(this).find("tr:nth-child(3) > td:nth-child(1)").text();
      result['중구'] = $(this).find("tr:nth-child(3) > td:nth-child(2)").text();
      result['용산구'] = $(this).find("tr:nth-child(3) > td:nth-child(3)").text();
      result['성동구'] = $(this).find("tr:nth-child(3) > td:nth-child(4)").text();
      result['광진구'] = $(this).find("tr:nth-child(3) > td:nth-child(5)").text();
      result['동대문구'] = $(this).find("tr:nth-child(3) > td:nth-child(6)").text();
    
      result['중랑구'] = $(this).find("tr:nth-child(6) > td:nth-child(1)").text();
      result['성북구'] = $(this).find("tr:nth-child(6) > td:nth-child(2)").text();
      result['강북구'] = $(this).find("tr:nth-child(6) > td:nth-child(3)").text();
      result['도봉구'] = $(this).find("tr:nth-child(6) > td:nth-child(4)").text();
      result['노원구'] = $(this).find("tr:nth-child(6) > td:nth-child(5)").text();
      result['은평구'] = $(this).find("tr:nth-child(6) > td:nth-child(6)").text();
    
      result['서대문구'] = $(this).find("tr:nth-child(9) > td:nth-child(1)").text();
      result['마포구'] = $(this).find("tr:nth-child(9) > td:nth-child(2)").text();
      result['양천구'] = $(this).find("tr:nth-child(9) > td:nth-child(3)").text();
      result['강서구'] = $(this).find("tr:nth-child(9) > td:nth-child(4)").text();
      result['구로구'] = $(this).find("tr:nth-child(9) > td:nth-child(5)").text();
      result['금천구'] = $(this).find("tr:nth-child(9) > td:nth-child(6)").text();
    
      result['영등포구'] = $(this).find("tr:nth-child(12) > td:nth-child(1)").text();
      result['동작구'] = $(this).find("tr:nth-child(12) > td:nth-child(2)").text();
      result['관악구'] = $(this).find("tr:nth-child(12) > td:nth-child(3)").text();
      result['서초구'] = $(this).find("tr:nth-child(12) > td:nth-child(4)").text();
      result['강남구'] = $(this).find("tr:nth-child(12) > td:nth-child(5)").text();
      result['송파구'] = $(this).find("tr:nth-child(12) > td:nth-child(6)").text();
    
      result['강동구'] = $(this).find("tr:nth-child(15) > td:nth-child(1)").text();
    })

    result['날짜'] = $("#move-cont1 > div.status-confirm.map-status.display-none > p").text();

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
                      "text":"오늘의 "+ message +" 확진자는 총 "+ result[message]+"명입니다."
                  },
                  {
                      "type":"text",
                      "text":result['날짜']
                  }
              ]
          }
      },(error, response, body) => {
          console.log(body)
      });

  });

}

function hospital_information(replyToken, keyword){ //__구 선별 진료소

  request.get(
    {
      url: MAP_URL,
      headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': `KakaoAK ${KAKAO_ID}`
      },
      form : {
          'query' : keyword,
          'size' : 3
      },
      json : true
    }, (error,response,body) => {
        if(!error && response.statusCode == 200) {
          console.log(body.documents);
          var result_1 = body.documents[0];
          var result_2 = body.documents[1];
          var result_3 = body.documents[2];
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
                          "type": "location",
                          "title": result_1.place_name,
                          "address": result_1.road_address_name,
                          "latitude":  result_1.y,
                          "longitude": result_1.x
                        },
                        {
                          "type": "location",
                          "title": result_2.place_name,
                          "address": result_2.road_address_name,
                          "latitude":  result_2.y,
                          "longitude": result_2.x
                        },
                        {
                          "type": "location",
                          "title": result_3.place_name,
                          "address": result_3.road_address_name,
                          "latitude":  result_3.y,
                          "longitude": result_3.x
                        }
                    ]
                }
            },(error, response, body) => {
                console.log(body)
            });
    }
  });
  
  }

function information(replyToken){ //서울시 코로나 정보봇 사용 매뉴얼

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
                    "text":"안녕하세요! 서울시 코로나 정보봇입니다:)"
                },
                {
                    "type":"text",
                    "text":"서울시 코로나 정보봇 사용 방법\n\n 1. 오늘의 서울시 확진자 정보가 궁금하다면 '오늘 확진자'를 입력해주세요!\n\n 2. 확진자 발생 장소 관련 공지를 보고 싶으시다면 '공지'를 입력해주세요! \n\n 3. 코로나 선별진료소 정보가 궁금하다면 '__구 선별진료소'를 입력해주세요! ex) 종로구 선별진료소 \n\n 4. 거리두기 단계별 안전 수칙 및 정보가 궁금하다면 '거리두기'를 입력해주세요! "
                    //매뉴얼이므로 수정하기!
                }
            ]
        }
    },(error, response, body) => {
        console.log(body)
    });

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
