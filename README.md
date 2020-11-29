서울시 코로나 정보봇
------------------------
## 라인 메신저 아이콘

![서울시코로나정보봇](https://user-images.githubusercontent.com/48651358/100540555-5600e000-3281-11eb-9ec4-1b9732f7c76e.jpg)

## QR코드

![qr](https://user-images.githubusercontent.com/48651358/100540638-cdcf0a80-3281-11eb-8950-ef1264f4307b.png)

## 챗봇 제공 기능

###### 1. 오늘의 서울시 총 확진자 수를 알려줍니다.
###### 1-1. 서울시 내의 자치구 이름을 입력하면 해당하는 구의 오늘의 확진자 수를 보여줍니다. ex) '종로구' 입력
###### 2. 서울시 내의 자치구에서 발생한 확진자의 방문 장소를 알려줍니다. ex) '종로구 확진자 방문 장소' 입력
###### 3. 서울시 내의 자치구 이름과 '선별진료소'를 함께 입력하면 해당 자치구와 가까운 선별진료소 이름과 위치를 알려줍니다. ex) '종로구 선별진료소' 입력
###### 4. 거리두기 단계별 안전 수칙 및 정보를 알려줍니다.

## 챗봇 사용법

###### 서울시 코로나 정보봇은 서울시 내의 코로나 정보를 한눈에 보여줍니다.
###### 먼저 사용전 '도움말'을 입력합니다.
###### 도움말의 매뉴얼대로 원하는 정보의 키워드를 입력합니다.

## 챗봇 명령어

###### 1. 도움말 : 챗봇을 사용하는 방법을 알려줍니다.
###### 2. 오늘 확진자 : 오늘의 서울시 확진자를 알려줍니다.
###### 2-1. ____구 : 오늘의 서울시 ____구 확진자를 알려줍니다.
###### 3. ____구 확진자 장소: 서울시 ____구 확진자 방문 장소를 알려줍니다.
###### 4. ____구 선별 진료소(____구 선별진료소) : ____구와 가까운 선별진료소 이름과 위치를 알려줍니다.
###### 5. // 거리두기 관련 정보


###### 서울시 내의 구는 종로구, 중구, 용산구, 성동구, 광진구, 동대문구, 중랑구, 성북구, 강북구, 도봉구, 노원구, 은평구, 서대문구, 마포구, 양천구, 강서구, 구로구, 금천구, 영등포구, 동작구, 관악구, 서초구, 강남구, 송파구, 강동구가 있습니다.

## API List

###### - KAKAO Maps API
###### - Line Messaging API

## 설치 방법

##### 1. repository를 clone 합니다.
###### git clone http://khuhub.khu.ac.kr/2018102223/coronabot.git
##### 2. project에 필요한 key들을 발급받습니다.
###### 지도 API 키(REST API 키): https://apis.map.kakao.com/
###### Line Messaging API 키(Channel access token): https://developers.line.biz/en/services/messaging-api/
##### 3. project에 필요한 module을 다운받습니다.
###### npm install
##### 4. app.js를 수정합니다.
###### const TOKEN = 'line messaging api' // line messaging api의 channel access token 값으로 수정합니다.
###### const KAKAO_ID = 'kakao maps api' // kakao maps api의 REST API 키 값으로 수정합니다.
###### const domain = "your domain" // EC2 인스턴스와 연결된 도메인의 주소로 수정합니다.
