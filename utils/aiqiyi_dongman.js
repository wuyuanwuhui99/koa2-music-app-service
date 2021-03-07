
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

function getDongmanData() {

    console.log(sql);
    let $titles = document.querySelectorAll(".qy-mod-title");
    let num = 0;
    let timeout = setInterval(()=>{
        if(num == $titles.length){
            clearInterval(timeout);
            let $banners = document.querySelectorAll(".qy-focus-thumbnail .img-item");
            let sql = ""
            for(let i=0;i<$banners.length;i++){
                let img = `https:${$banners[i].getAttribute("data-jpg-img")}`;
                let name = $banners[i].querySelector(".img-link").getAttribute("title");
                let target_href = $banners[i].querySelector(".img-link").getAttribute("src");
                sql += `DELETE FROM movie_network WHERE name='${name}';INSERT INTO movie_network (name,img,target_href,source_name,source_url,create_time,update_time,classify,category,is_recommend,use_status) values('${name}','${img}','${target_href}','爱奇艺','https://www.iqiyi.com','${getFullTime()}','${getFullDate()}','动漫','轮播','0','1')`
            }
            let $qyModWrap = document.querySelectorAll(".qy-mod-wrap-side .mod-left");
            for(let i=0; i < $qyModWrap.length;i++){
                let category = $qyModWrap[i].getAttribute("data-block-name");
                let target_href = $qyModWrap[i].querySelector(".link-txt").getAttribute("href");
            }
        }else{
            var scrollTop = $titles[num].getBoundingClientRect().y-document.querySelector(".qy-focus-thumbnail .img-list").getBoundingClientRect().y;
            window.scrollTo(0,scrollTop);
        }
        num++;
    },1000)
}
