const Router = require("koa-router");//路由
const {query,fail,success} = require("../service/connection");//mysql数据库连接
const router = new Router();
const fs = require("fs");
const request =require('request');//服务请求
const path = require("path");


//下载图片
//http://localhost:3000/service/movie//download/movie_my_exclusive
//http://localhost:3000/service/movie//download/movie_banner
router.get("/download/:tablename",async(ctx)=>{
    let {tablename} = ctx.params;
    let result = await new Promise((resolve,reject)=>{
        query(`SELECT * FROM ${tablename} WHERE local_img IS NULL`,(err,data)=>{
            if(data.length > 0){
                data.forEach((item)=>{
                    let {name,img} = item;
                    let ext = img.slice(img.lastIndexOf(".")).replace(/\?.+/g,"").replace("webp","jpg");//扩展名
                    let file = path.resolve(__dirname,`../../public/movie/images/aiqiyi/${tablename}`,name+ext);
                    console.log(file);
                    request(img).pipe(fs.createWriteStream(file)).on("close",()=>{
                        query(`UPDATE ${tablename} SET local_img='/movie/aiqiyi/${tablename}/${name+ext}'`,(err,data)=>{
                            if(err)return console.log(err);
                            if(data.affectedRows!=0){
                                console.log(`更新${name}成功`);
                            }else{
                                console.log(`更新${name}失败`);
                            }
                        });
                    });
                });
                resolve(data);
            }
        });
    });
    ctx.body = result;
});

module.exports = router;
