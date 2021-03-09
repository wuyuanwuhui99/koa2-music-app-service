const zerofill = (value)=>  {
        return value < 10 ? "0"+value : value+"";
    };

const getFullTime = (date)=>{
    if(!date) date = new Date()
    return `${date.getFullYear()}-${zerofill(date.getMonth()+1)}-${zerofill(date.getDate())} ${zerofill(date.getHours())}:${zerofill(date.getMinutes())}:${zerofill(date.getSeconds())}`
}

module.exports = {zerofill,getFullTime}