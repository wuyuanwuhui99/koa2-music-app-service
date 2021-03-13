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
module.exports = {zerofill,getFullTime,getValue}