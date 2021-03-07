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


var $text = document.querySelectorAll(".qy-mod-header .qy-mod-title .qy-mod-text");
var num = 0;
var result=[];
var timeout = setInterval(()=>{
    if(num >= document.body.offsetHeight){
        var $qyModWrap = [...document.querySelectorAll(".qy-mod-wrap")];
        $qyModWrap.forEach((item,index)=>{
            var category = (item.querySelector(".qy-mod-text")||{}).innerText||"";
            var $qyModLink = [...item.querySelectorAll(".qy-mod-link")];
            let result = [];
            $qyModLink.forEach((eItem,eIndex)=>{
                var name = eItem.querySelector("img").getAttribute("alt");
                var target_href = `https:${eItem.getAttribute("href")}`;
                var img = `https:${eItem.querySelector("img").getAttribute("src")}`;
                var $parent = eItem.parentNode.parentNode;
                var description = ($parent.querySelector(".sub")||{}).innerText||"";
                var score = ($parent.querySelector(".text-score")||{}).innerText||"";
                var viewing_state = (eItem.querySelector(".qy-mod-label")||{}).innerText||"";
                if(name && ["围观剧透社","即将上线"].indexOf(category)==-1){
                    // queryStr += `INSERT INTO movie_network(name,img,target_href,description,score,viewing_state,source_name,source_url,create_time,update_time,classify,category,is_recommend,use_status) SELECT '${name}','${img}','${target_href}','${description}','${score}','${viewing_state}','爱奇艺','https://www.iqiyi.com','${getFullDate()}','${getFullTime()}','电视剧','${category}','1','1' FROM DUAL WHERE NOT EXISTS (SELECT * FROM movie_network WHERE name='${name}' AND category = '${category}');`
                    result.push([name,img,target_href,description,score,viewing_state,"爱奇艺","https://www.iqiyi.com/",getFullTime(),getFullDate(),"电视剧",category,"0","1"])
                }
            });
            save(result,category)
        })
        clearInterval(timeout);
    }else{
        window.scrollTo(0,num);
    }
    num+=300;
},1000*1);

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

function getFullTime() {
    let date = new Date();
    return `${zerofull(date.getFullYear())}-${zerofull(date.getMonth() + 1)}-${zerofull(date.getDate())} ${zerofull(date.getHours())}:${zerofull(date.getMinutes())}:${zerofull(date.getSeconds())}`
}

function save(result,category) {
    ajax({
        url:"http://localhost:3000/service/movie/save_dianshiju",
        type:"post",
        headers:{
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        data:JSON.stringify(result),
        success:(res)=>{
            console.log(`更新${category}成功`)
        }
    })
}
