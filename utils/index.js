function zerofull (value){//零填充
    if(value<10){
        return "0"+value
    }
    return value
}

//获取时间
exports.getNowTime=(value)=>{//获取当前时间
    let date;
    if(!value){
        date = new Date()
    }else if(typeof value == "string" || typeof value == "number"){
        date = new Date(value)
    }else if(typeof value == "object"){
        date = value;
    }   
    return `${date.getFullYear()}-${zerofull(date.getMonth()+1)}-${zerofull(date.getDate())} ${zerofull(date.getHours())}:${zerofull(date.getMinutes())}:${zerofull(date.getSeconds())}`;
}
