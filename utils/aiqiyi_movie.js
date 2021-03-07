
//仿jquery中ajax请求
function ajax(obj) {
    if(!obj.url) return;
    var xhr=new XMLHttpRequest() || new ActiveXObject("Microsoft.XMLHTTP");
    var type=(obj.type||"GET").toUpperCase();
    var timeout=false;
    var timer=null;
    xhr.onreadystatechange = function() {
        // try{
        if(xhr.readyState==4) {
            if(obj.complete) {
                obj.complete()
            }
            if(xhr.status==200&&obj.success) {
                if(obj.dataType=="json"){
                    obj.success(isJSON(xhr.responseText) ? JSON.parse(xhr.responseText) : xhr.responseText);
                    //obj.success(JSON.parse(xhr.responseText));
                }else if(obj.dataType=="text") {
                    obj.success(xhr.responseText);
                }
                if(timer) clearTimeout(timer);
            }else if(xhr.status==204&&obj.success) {
                obj.success();
                if(timer) clearTimeout(timer);
            }else if(xhr.status == 408 && typeof(obj.timeout) == "function") {
                if(timer) clearTimeout(timer);
                obj.timeout()
            }else if(xhr.status!=200 && obj.error&&!timeout) {
                obj.error();
                if(timer)clearTimeout(timer);
            }
        }
        // }catch(e){
        // 	if(obj.error)obj.error();
        //   if(timer)clearTimeout(timer);
        // }
    }

    if(obj.time && (typeof obj.time).toUpperCase()=="NUMBER"){//请求超时方法
        timer=setTimeout(function(){
            timeout=true;
            xhr.abort();
            if(obj.timeout&&xhr.status!=200)obj.timeout();
        },parseInt(obj.time))
    }

    if(obj.async == undefined || obj.async =="" ) obj.async = true;

    if(obj.cache == false){
        if(obj.url.indexOf("?")!=-1){
            obj.url+="&version"+new Date().getTime()
        }else{
            obj.url+="?version"+new Date().getTime();
        }
    }

    if(type=="POST" || type=="PUT" || type =="DELETE") {
        xhr.open(type,obj.url,obj.async);
        if(!isEmptyObject(obj.headers)&&isJsonObject(obj.headers)){
            for(var key in obj.headers){
                xhr.setRequestHeader(key,obj.headers[key]);
            }
            if((obj.headers["Content-Type"]|| obj.headers["Content-type"] || obj.headers["content-type"]) == "application/x-www-form-urlencoded"){
                xhr.send(_params(obj.data||{}).replace(/^&/,""));
            }else{
                xhr.send(obj.data||null);
            }
        }else{
            xhr.setRequestHeader('Content-Type',"application/x-www-form-urlencoded");
            xhr.send(_params(obj.data)||null);
        }
    }else if(type=="GET"){
        if(obj.url.indexOf("?") != -1) {
            obj.url += _params(obj.data)
        }else{
            obj.url += _params(obj.data || {}).replace(/^&/,"?")
        }
        xhr.open(type,obj.url,obj.async);
        xhr.send(null);
        if(!isEmptyObject(obj.headers) && isJsonObject(obj.headers)){
            for(var key in obj.headers) {
                xhr.setRequestHeader(key, obj.headers[key])
            }
        }
    }else if(type=="JSONP" || (obj.dataType||"").toUpperCase() =="JSONP") {
        var id = ("jsonp_"+Math.random()).replace(".","");
        var name = obj.jsonp || "callback";
        var time = Number(obj.time) ? Number(obj.time) : "";
        var target = document.getElementsByTagName("script")[0] || document.head;
        var script = null ,timer =null;
        if(time){
            timer = setTimeout(function(){
                cleanup();
                if(obj.timeout)obj.timeout();
            },time)
        }
        function cleanup(){
            if(script.parentNode){
                script.parentNode.removeChild(script);
                window[id] = null;
                if(timer) clearTimeout(timer);
            }
        }
        obj.url += (obj.url.indexOf("?")!=-1 ? "&" :"?") + name + "=" +encodeURIComponet(id)+_params(obj.data);
        script = document.createElement("script");
        script.src = obj.url;
        target.parentNode.insertBefore(script,target)
    }
}

//判断对象是否是json对象
function isJsonObject(json){
    var str=JSON.stringify(json);
    if(/^{.*}$/.test(str)){
        return true;
    }
    return false
}

//格式化参数
function _params(data,key){
    var params="";
    key=key||"";
    var type={"string":true,"number":true,"boolean":true};
    if(type[typeof(data)]){//如果data是字符串或者数字或者布尔类型
        params=data;
    }else{//如果data是json对象
        for(var i in data){//遍历json对象
            if(type[typeof(data[i])]){//判断属性值类型，如果属性是字符串或者数字
                params+="&"+key+(!key?i:('['+i+']'))+"="+data[i]
            }else{//如果属性值为json对象
                params+=_params(data[i],key+(!key?i:('['+i+']')));
            }
        }
        return !key?encodeURI(params).replace(/%5B/g,'[').replace(/%5D/g,']'):params;
    }
}

//判断是否为空对象
function isEmptyObject(obj){
    if((typeof obj).toUpperCase()==="OBJECT"){
        for(var key in obj){
            return false;
        }
    }
    return true;
}

function getFullTime() {
    let date = new Date();
    return `${zerofull(date.getFullYear())}-${zerofull(date.getMonth() + 1)}-${zerofull(date.getDate())} ${zerofull(date.getHours())}:${zerofull(date.getMinutes())}:${zerofull(date.getSeconds())}`
}

function getFullDate() {
    let date = new Date();
    return `${zerofull(date.getFullYear())}-${zerofull(date.getMonth() + 1)}-${zerofull(date.getDate())}`
}

function zerofull (value){//零填充
    if(value<10){
        return "0"+value
    }
    return value
}


class Aiqiyi_movie{
    getBanner(){//获取banner图片，并打印出sql
        let querySql = "",result=[];
        let $bannders =  document.querySelectorAll(".qy-focus-dotSlide .img-list .img-item");
        for(var i = 0; i < $bannders.length; i++){
            let $a = $bannders[i].querySelector(".img-link");
            let name = $a.getAttribute("data-indexfocus-currenttitleelem");
            let description = $a.getAttribute("data-indexfocus-description");
            let target_href = `https:${$a.getAttribute("href")}`;
            let img = window.getComputedStyle($bannders[i],null).backgroundImage.replace(/url\("|"\)/g,"")
            querySql += `INSERT INTO movie_network(name,img,description,source_name,source_url,target_href,use_status,create_time,update_time,classify,category) SELECT '${name}','${img}','${description}','爱奇艺','https://www.iqiyi.com','${target_href}','1','${getFullDate()}','${getFullTime()}','电影','轮播' FROM DUAL WHERE NOT EXISTS (SELECT name FROM movie_bannder WHERE target_href='${target_href}' AND category='轮播');`
            result.push([name,img,description,'爱奇艺','https://www.iqiyi.com',target_href,'0',getFullDate(),getFullTime(),'','电影','轮播'])
        }
        if(result.length == 0)console.log("获取banner图片");
        this.save(result);
        // console.log(querySql);
    }

    getMyMovie(){//抓取爱奇艺《你的专属影院》栏目的数据
        let $myMovies = document.querySelectorAll(`[data-name='私人专属影院'] .privateC_pic>a`);
        let querySql = "",result=[];
        for(var i=0 ; i < $myMovies.length; i++){
            let $img = $myMovies[i].querySelector("img")
            let img = `https:${$img.getAttribute("src") || $img.getAttribute("data-src")}`;
            let name = $myMovies[i].querySelector(".privateC_picTitle").innerHTML;
            let description = $myMovies[i].querySelector(".privateC_picTinfo").innerText;
            let score = ($myMovies[i].querySelector(".privateC_score")||"").innerText;
            let target_href = `https:${$myMovies[i].getAttribute("href")}`;
            querySql += `INSERT INTO movie_network(name,img,description,source_name,source_url,target_href,use_status,create_time,update_time,score,classify,category) SELECT '${name}','${img}','${description}','爱奇艺','https://www.iqiyi.com','${target_href}','1','${getFullDate()}','${getFullTime()}','${score}','电影','你的专属影院' FROM DUAL WHERE NOT EXISTS (SELECT name FROM movie_network WHERE target_href='${target_href}' AND category='你的专属影院');`
            result.push([name,img,description,'爱奇艺','https://www.iqiyi.com',target_href,'0',getFullDate(),getFullTime(),score,'电影','你的专属影院'])
        }
        if(result.length == 0)console.log("你的专属影院");
        this.save(result);
        // console.log(querySql)
    }

    getRanking(){//获取电影排行榜
        let panel = document.querySelector(".col-right.j_slider")
        let $modlis = panel.querySelectorAll(".col-right.j_slider .qy-mod-ul.j_slider_list .qy-mod-li");
        let querySql = "",result=[];
        for(var i=0 ; i < $modlis.length; i++){
            let $a = $modlis[i].querySelector(".qy-mod-link");
            let target_href = `https:${$a.getAttribute("href")}`;
            let name = $a.getAttribute("title");
            let $img = $a.querySelector("img");
            let img = `https:${$img.getAttribute("data-src") || $img.getAttribute("src")}`
            let description = ($modlis[i].querySelector(".sub")||{}).innerText||"";
            let score =  ($modlis[i].querySelector(".text-score")||{}).innerText||"";
            querySql += `INSERT INTO movie_network(name,img,description,source_name,source_url,target_href,use_status,create_time,update_time,score,classify,category) SELECT '${name}','${img}','${description}','爱奇艺','https://www.iqiyi.com','${target_href}','1','${getFullDate()}','${getFullTime()}','${score}','电影','电影排行榜' FROM DUAL WHERE NOT EXISTS (SELECT name FROM movie_network WHERE target_href='${target_href}' AND category='电影排行榜');`
            result.push([name,img,description,'爱奇艺','https://www.iqiyi.com',target_href,'0',getFullDate(),getFullTime(),score,'电影','电影排行榜'])
        }
        // console.log(querySql)
        if(result.length == 0)console.log("获取电影排行榜");
        this.save(result)
    }

    getTrailerMovie(){//获取大片预热数据
        let $modlis = document.querySelectorAll("[data-name='大片预热'] .qy-mod-li");
        let querySql = "",result=[];
        for(var i=0 ; i < $modlis.length; i++){
            let $a = $modlis[i].querySelector(".qy-mod-link");
            let target_href = `https:${$a.getAttribute("href")}`;
            let title = $a.getAttribute("title")
            let nameArr = title.match(/《.+》/);
            let name= nameArr&&nameArr.length > 0 ? nameArr[0] : title;
            let $img = $a.querySelector("img");
            let img = `https:${$img.getAttribute("data-src") || $img.getAttribute("src")}`
            let description = $modlis[i].querySelector(".sub").innerText;
            querySql += `INSERT INTO movie_network(name,img,description,source_name,source_url,target_href,use_status,create_time,update_time,classify,category) SELECT '${name}','${img}','${description}','爱奇艺','https://www.iqiyi.com','${target_href}','1','${getFullDate()}','${getFullTime()}','电影','大片预热' FROM DUAL WHERE NOT EXISTS (SELECT name FROM movie_network WHERE target_href='${target_href}' AND category='大片预热');`
            result.push([name,img,description,'爱奇艺','https://www.iqiyi.com',target_href,'0',getFullDate(),getFullTime(),'电影','大片预热'])
        }
        this.save(result)
        // console.log(querySql)
    }

    getCategoryMovie(category){//获取分类电影
        let $modlis = document.querySelectorAll(`[data-name='${category}'] .qy-mod-li`);
        let querySql = "",result = [];
        for(var i=0 ; i < $modlis.length; i++){
            let $a = $modlis[i].querySelector(".qy-mod-link");
            let target_href = `https:${$a.getAttribute("href")}`;
            let name = $a.getAttribute("title").replace(/（.+）/,"");
            let $img = $a.querySelector("img");
            let img = `https:${$img.getAttribute("data-src") || $img.getAttribute("src")}`
            let description = $modlis[i].querySelector(".sub").innerText||"";
            let score =  ($modlis[i].querySelector(".text-score")||{}).innerText || "";
            querySql += `INSERT INTO movie_network(name,img,description,source_name,source_url,target_href,use_status,create_time,update_time,score,classify,category) SELECT '${name}','${img}','${description}','爱奇艺','https://www.iqiyi.com','${target_href}','1','${getFullDate()}','${getFullTime()}','${score}','电影','${category}' FROM DUAL WHERE NOT EXISTS (SELECT name FROM movie_network WHERE target_href='${target_href}' AND category='${category}');`
            result.push([name,img,description,'爱奇艺','https://www.iqiyi.com',target_href,'0',getFullDate(),getFullTime(),score,'电影',category])
        }
        if(result.length == 0)console.log(category);
        this.save(result)
        // console.log(querySql);
    }

    save(data){
        ajax({
            url:"http://localhost:3000/service/movie/save_dianying",
            type:"post",
            headers:{
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            data:JSON.stringify(data),
            success:(res)=>{

            }
        })
    }
}

let $qyModText = document.querySelectorAll(".qy-mod-text");
let num = 0;
let timeout = setInterval(()=>{
    if(num >= document.body.offsetHeight){
        let aiqiyi = new Aiqiyi_movie();
        aiqiyi.getBanner();
        aiqiyi.getRanking();//获取电影排行榜
        aiqiyi.getMyMovie();
        aiqiyi.getTrailerMovie()//获取预告电影
        var $text = document.querySelectorAll(".qy-mod-text");
        for(let i=0;i<$text.length;i++){
            console.log($text[i].innerText)
            let arr= ["帮你读电影","电影排行榜","大片预热"]
            if(arr.indexOf($text[i].innerText)==-1){
                aiqiyi.getCategoryMovie($text[i].innerText);
            }
        }
        clearInterval(timeout);
    }else{
        window.scrollTo(0,num);
    }
    num+=300;
},1000)





