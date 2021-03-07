const {query} = require("../service/connection");//mysql数据库连接
const request =require('request');//服务请求
const cheerio = require('cheerio');//数据解析
const puppeteer = require("puppeteer");

request('https://www.iqiyi.com/dianshiju',  (error, response, body) => {
    if(error)return console.log(error);
    let $ = cheerio.load(response.body);
    let bannerResult = [],category=[]
    $(".qy-focus-dotSlide .img-item").each((index,item)=>{
        let $item = $(item);
        let dataImg = $item.attr("data-jpg-img");
        if(!dataImg){
            dataImg=($item.attr(":style")||"").replace(/\{backgroundImage: .+url\(|\)' : ''}/g,"")
        }
        let img = `https:${dataImg}`;
        let target_href = $item.find("a").attr('href');
        if(target_href.indexOf("https:")== -1) target_href = `https:${target_href}`
        bannerResult.push([img,target_href,"爱奇艺","https://www.iqiyi.com","电视剧","轮播"])
    });

    query(`SELECT * FROM movie_network WHERE category='轮播' AND classify='电视剧'`,(err,data)=>{
       if(err)console.log(err);
        let filterData = bannerResult.filter((bItem)=>{
            let res = data.find((dItem)=>{
                return dItem.target_href == bItem[1];
            });
            return !res;
        });
        console.log("filterData=",filterData);
        query(`INSERT INTO movie_network(img,target_href,source_name,source_url,classify,category)VALUES ?`,[filterData],(err,data)=>{
            filterData.forEach((item)=>{
                request(item[1],  (error, response, body) => {
                    if(error)return console.log(error);
                    let $ = cheerio.load(response.body);
                    let name = $(".header-link").text();
                    let plot = $(".color_999").text();
                    let viewing_stateArr = $(".update-tip").text().split(" ");
                    let viewing_state = viewing_stateArr[viewing_stateArr.length-1];
                    query(`UPDATE movie_network SET name='${name}',plot='${plot}',viewing_state='${viewing_state}' WHERE  target_href='${item[1]}'`,(err,data)=>{
                        if(err)return console.log(err);
                        if(data.affectedRows>0){
                            console.log(`更新${name}成功`)
                        }else{
                            console.log(`更新${name}失败`)
                        }
                    });
                })
            })
        });
    });
});

// (async ()=>{
//     const browser = await puppeteer.launch({headless: true});
//     const page = await browser.newPage();
//     const result = [];
//     await page.goto("https://www.iqiyi.com/dianshiju");await page.setViewport({
//         width:1920,
//         height:1080
//     });
//     page.on("load",async ()=>{
//         await page.evaluate(async()=>{
//             let content = await page.content();
//             let $ = cheerio.load(content);
//             let $text = document.querySelectorAll(".qy-mod-header .qy-mod-title .qy-mod-text");
//             let curIndex = 0;
//             console.log("$text=",$text)
//             let timeout = setInterval(()=>{
//                 if(curIndex == $text.length){
//                     $(".qy-mod-wrap").each((index,item)=>{
//                         let $item = $(item);
//                         let category = $item.find(".qy-mod-text").text();
//                         $item.find(".qy-mod-link").each((eIndex,eItem)=>{
//                             let $eItem = $(eItem);
//                             let name = $eItem.attr("title");
//                             let target_href = `https:${$eItem.attr("href")}`;
//                             let img = $eItem.find("img").attr("src");
//                             result.push([name,img,target_href,"爱奇艺","https://www.iqiyi.com/",getFullDate(),"电视剧",category])
//                         });
//                     });
//                     console.log("result=",result)
//                     clearInterval(timeout);
//                     return result;
//                 }else{
//                     let scrollTop = $text[curIndex].getBoundingClientRect().y;
//                     window.scrollTop(0,scrollTop-60);
//                 }
//                 curIndex++;
//             },1000*10);
//         });
//     });
// })();

function getFullDate() {
    let date = new Date();
    return `${zerofull(date.getFullYear())}-${zerofull(date.getMonth() + 1)}-${zerofull(date.getDate())} ${zerofull(date.getHours())}:${zerofull(date.getMinutes())}:${zerofull(date.getSeconds())}`
}

function zerofull (value){//零填充
    if(value<10){
        return "0"+value
    }
    return value
}
