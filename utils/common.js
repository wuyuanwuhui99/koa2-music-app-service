const jsonwebtoken = require("jsonwebtoken");
const { CHEADERS: cheaders, UHEADERS: uheaders,ERR_OK,SUCCESS} = require("../config")
const axios = require("axios");
const redisClient = require("./redisConnect");

const zerofill = (value)=>  {
        return value < 10 ? "0"+value : value+"";
};

const getFullTime = (date)=>{
    if(!date) date = new Date()
    return `${date.getFullYear()}-${zerofill(date.getMonth()+1)}-${zerofill(date.getDate())} ${zerofill(date.getHours())}:${zerofill(date.getMinutes())}:${zerofill(date.getSeconds())}`
}
const getValue=(data,props,defaultValue)=>{
    if(typeof data !== "object"){
        return defaultValue
    }
    let result = data;
    for(let i = 0; i < props.length; i++){
        if(i != props.length - 1){
            result = result[props[i]] || {}
        }else{
            result = result[props[i]]
        }
    }
    if(result === undefined || result === null){
        result = defaultValue;
    }
    return result
}

const getUserId = (ctx)=>{
    let token = ctx.headers.authorization;
    var userData = jsonwebtoken.decode(token);
    return userData ? userData.userId : null;
}

const getParams = (obj)=>{
    var str = ""
    for(var key in obj){
        str += `&${key}=${obj[key]}`
    }
    return str.replace(/&/,"?")
}

const getQQMusicData = async (url, methodName="",queryString="") =>{
    return new Promise(async (resolve, reject) => {
        let data = await redisClient.get(url);
        if (data) {
            resolve(data)
            return;
        }
        let response = await axios.get(url + queryString, {headers:url.includes("c.y.qq.com") ? cheaders : uheaders});
        var res = response.data;//请求结果
        if (typeof res === 'string') {
            if (methodName == "getLyric") {
                var reg = /^\w+\(({[^()]+})\)$/
                var matches = res.match(reg)
                if (matches) {
                    res = JSON.parse(matches[1])
                }
            } else if(methodName){
                var reg = new RegExp(methodName + "\\(|\\)$","g")
                var matches = res.trim().replace(reg,"")
                res = JSON.parse(matches)
            }
        }
        if (res.code == ERR_OK || res.code === undefined) {
            body = {
                ...SUCCESS,
                msg: "",
                data: res.data || res//请求结果,
            };
        } else{
            body = {
                ...FAIL,
                msg: res.message,
                data: res.data || res//请求结果,
            };
        }
        redisClient.set(url, body);
        resolve(body);
    })

}

module.exports = {zerofill,getFullTime,getValue,getUserId,getParams,getQQMusicData}
