const fs = require("fs");
const Router = require("koa-router");
const connection = require("../connection");
const router = new Router();
const jsonwebtoken = require("jsonwebtoken");
const {
    ERR_OK,
    SUCCESS,
    FAIL,
    OPARATION,
} = require("../../config");
const {getUserId} = require("../../utils/common");


//根据用户id查询收藏的歌曲,请求地地址：/service/music/getFavorite
router.get("/getFavorite",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"根据用户id查询收藏的歌曲",method:"getFavorite",oparation:OPARATION.SELECT};//日志记录
    let result = await new Promise((resolve,reject)=>{
        let userId = getUserId(ctx)
        connection.query("SELECT * FROM favorite_music WHERE user_id = ?",[userId],function(err,response){
            if(err){
                reject(err)
            }else{
                resolve({
                    data:[...response],
                    msg:"查询成功",
                    ...SUCCESS
                })
            }
        })
    });
    ctx.body = result;
})

//查询歌曲收藏,请求地地址：/service/music/queryFavorite
router.get("/queryFavorite",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"查询歌曲收藏",method:"queryFavorite",oparation:OPARATION.SELECT};//日志记录
    let {mid} = ctx.query;
    let userId = getUserId(ctx)
    let result =await new Promise((resolve,reject)=>{
        if(!mid || !userId){//没有歌曲获取用户id
            resolve([]);
        }else{
            connection.query(`SELECT 
            id,
            albummid,
            duration,
            mid,
            name,
            singer,
            url,
            create_time AS createTime,
            timer,
            update_time AS updateTime,
            kugou_url AS kugouUrl,
            play_mode AS playMode,
            other_url AS otherUrl,
            local_url AS localUrl,
            disabled,
            user_id AS userId,
            lyric,
            local_image AS localImage
        FROM favorite_music WHERE mid = ? AND user_id = ?`,[mid,userId],(err,result)=>{
                resolve({
                    data:result,
                    ...SUCCESS,
                    msg:"查询成功",
                })
            })
        }
    })
    ctx.body = result;
});

//添加收藏,请求地地址：/service/music/addFavorite
router.post("/addFavorite",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"添加收藏",method:"addFavorite",oparation:OPARATION.INSERT};//日志记录
    let result = await new Promise((resolve,reject)=>{
        let data = [];
        let item = ctx.request.body;
        let token = ctx.headers.Authorization;
        var userData = jsonwebtoken.decode(token);
        let userId = getUserId(ctx)
        let {id,albummid,duration,image,localImage="",mid,name,singer,url,lyric="",localUrl,playMode,kugouUrl} = item;
        let updateTime = getFullTime();
        let createTime = getFullTime();
        if(!playMode)playMode = null;
        data.push(id,albummid,duration,image,localImage,mid,name,singer,url,userId,createTime,lyric,localUrl,playMode,updateTime,kugouUrl);//参数字段
        let params =[id,albummid,duration,image,localImage,mid,name,singer,url,createTime,updateTime,lyric,userId,albummid];//插入抖音的参数
        //往收藏表中插入一条数据，要管理员才能插入都抖音歌曲表
        connection.query(
            `INSERT INTO favorite_music(id,albummid,duration,image,local_image,mid,name,singer,url,user_id,create_time,lyric,local_url,play_mode,update_time,kugou_url) 
                SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? FROM DUAL WHERE NOT EXISTS (SELECT id,name FROM favorite_music WHERE id=? AND user_id= ?);
        `,[...data,id,userId],(error,response)=>{
                //要管理员才能插入都抖音歌曲表
                if(!error){
                    if(response.affectedRows == 1){//response[0]表示第一条sql执行的结果
                        resolve({//不是管理员，不能插入抖音歌曲表
                            ...SUCCESS,
                            data:response,
                            msg:"收藏成功"
                        })
                    }else if(response.affectedRows == 0){//response[0]表示第一条sql执行的结果
                        reject({
                            ...FAIL,
                            msg:"收藏失败",
                            data:null
                        })
                    }
                    //如果是管理员账号，收藏之后添加到抖音歌曲表
                    connection.query(`INSERT INTO douyin(id,albummid,duration,image,local_image,mid,name,singer,url,create_time,update_time,lyric) SELECT ?,?,?,?,?,?,?,?,?,?,?,? FROM DUAL WHERE exists(SELECT role FROM user WHERE user_id=? AND role = 'admin') AND NOT EXISTS (SELECT albummid FROM douyin WHERE albummid=?)`,[...params],(error,response)=>{
                        if(!response)return;
                        if(url){//把歌曲下载到本地
                            let audioMatch = url.replace(/\?.+/,"").split(".");
                            let audioFilename =  name+"."+audioMatch[audioMatch.length-1];
                            let audioRoot = "E:\\static\\music\\audio\\"+ audioFilename;
                            let audioStream = fs.createWriteStream(audioRoot);
                            request(url).pipe(audioStream).on('close', ()=>{//下载文件成功后更新数据库
                                connection.query("UPDATE douyin SET local_url = ?,play_mode='local' WHERE id=?",["/audio/"+audioFilename,id],(err,res)=>{
                                    console.log(err,res,"下载音乐成功，更新数据库成功")
                                })
                            });
                        }else{
                            connection.query("UPDATE douyin SET local_url = ?,play_mode='local' WHERE id=?",[`/audio/${name}.m4a`,id],(err,res)=>{
                                console.log(err,res,"下载音乐失败，更新数据库成功")
                            })
                        }
                        if(image){//把图片下载到本地
                            let imgMatch = image.replace(/\?.+/g,"").split(".");
                            let imgFilename = name +"."+ imgMatch[imgMatch.length -1];
                            let imgRoot = "E:\\static\\music\\images\\" + imgFilename;
                            let imgStream = fs.createWriteStream(imgRoot);
                            request(item.image).pipe(imgStream).on('close', ()=>{//下载文件成功后更新数据库
                                connection.query("UPDATE douyin SET local_image = ? WHERE id = ?",["/images/song/"+imgFilename,id],(err,res)=>{
                                    console.log(err,res,"下载图片成功，更新数据库成功")
                                })
                            });
                        }

                    });
                }else{
                    reject({
                        ...FAIL,
                        msg:"收藏失败",
                        data:null
                    })
                }
            })
    });
    ctx.body = result;
});

//取消收藏,请求地地址：/service/music/deleteFavorite
router.post("/deleteFavorite",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"取消收藏",method:"deleteFavorite",oparation:OPARATION.DELETE};//日志记录
    let item = ctx.request.body;
    let userId = getUserId(ctx)
    let result = await new Promise((resolve,reject)=>{
        connection.query("DELETE FROM favorite_music WHERE id = ? AND user_id = ?",[item.id,userId],(error,response)=>{
            if(error){
                console.log("错误",error);
                reject(error)
            }else{
                if(response.affectedRows == 1){
                    resolve({
                        ...SUCCESS,
                        data:response,
                        msg:"取消收藏成功",
                    })
                }else{
                    resolve({
                        ...FAIL,
                        msg:"您收藏的歌曲不存在",
                        data:null
                    })
                }

            }
        })
    })
    ctx.body = result;
});


//修改用户信息,请求地地址：/service/music/updateUser
router.put("/updateUser",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"修改用户信息",method:"updateUser",oparation:OPARATION.UPDATE};//日志记录
    let item = ctx.request.body;
    let updateDate =  getFullTime();//当前时间
    let userId = getUserId(ctx);
    let {username,telephone,email,avater,birthday,sex,role} = item;
    if(!username){
        ctx.body = {
            ...FAIL,
            msg:"用户名不能为空",
            data:null
        };
    }else if(!telephone){
        ctx.body = {
            ...FAIL,
            msg:"电话不能为空",
            data:null
        };
        return;
    }else if(!email){
        ctx.body = {
            ...FAIL,
            msg:"邮箱不能为空",
            data:null
        };
        return;
    }
    let data = [updateDate,username,telephone,email,avater,birthday,sex,role,userId]
    let result = await new Promise((resolve,reject)=>{
        //向记录表中插入一条播放记录，同时更新抖音歌曲的播放次数
        //https://www.cnblogs.com/hzj680539/p/8032270.html
        //返回的response[0]表示执行第一条sql的结果，response[1]表示执行第一条sql的结果
        connection.query(`
            UPDATE user SET update_date = ?, username = ?, telephone=?, email= ? ,avater=?,birthday=?,sex=?,role=? WHERE user_id=? `,data,(error,response)=>{
                if(error){
                    console.log("错误",error);
                    reject(error)
                }else{
                    if(response.affectedRows == 1){
                        let token = jsonwebtoken.sign(
                            {username,telephone,email,avater,birthday,sex,role,userId},
                            SECRET,
                            TOKEN_OPTIONS
                        );
                        ctx.cookies.set("token",token,COOKIE_OPTIONS);
                        resolve({
                            ...SUCCESS,
                            data:{username,telephone,email,avater,birthday,sex,role,userId},
                            msg:"修改账号信息成功",
                        });
                    }else{
                        resolve({
                            ...FAIL,
                            msg:"修改账号信息失败",
                            data:null
                        })
                    }
                }
            });
    })
    ctx.body = result
});

//修改密码,请求地地址：/service/music/updatePassword
router.put("/updatePassword",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"修改密码",method:"updatePassword",oparation:OPARATION.UPDATE};//日志记录
    let item = ctx.request.body;
    let updateDate =  getFullTime();//当前时间
    let userId = getUserId(ctx);
    let {newPassword,oldPassword} = item;
    let data = [newPassword,updateDate,oldPassword,userId]
    let result = await new Promise((resolve,reject)=>{
        //向记录表中插入一条播放记录，同时更新抖音歌曲的播放次数
        //https://www.cnblogs.com/hzj680539/p/8032270.html
        //返回的response[0]表示执行第一条sql的结果，response[1]表示执行第一条sql的结果
        connection.query(`
            UPDATE user SET password = ?,update_date=? WHERE user_id=? AND password=? `,data,(error,response)=>{
            if(error){
                console.log("错误",error);
                reject(error)
            }else{
                if(response.affectedRows == 1){
                    resolve({
                        ...SUCCESS,
                        data:response,
                        msg:"修改密码成功",
                    });
                }else{
                    resolve({
                        ...FAIL,
                        msg:"修改密码失败，账号和密码不对",
                        data:null
                    })
                }
            }
        });
    })
    ctx.body = result
});

//修改密码,请求地地址：/service/music/update/用户id
router.post("/upload",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"文件上传",method:"upload",oparation:OPARATION.UPLOAD};//日志记录
    let file = ctx.request.files.img;
    let userId = getUserId(ctx);
    let updateDate =  getFullTime();//当前时间
    // 创建可读流
    const reader = fs.createReadStream(file.path);
    let ext = file.name.slice(file.name.lastIndexOf(".")+1);//获取文件后缀
    // 创建可写流
    let filename =  `${userId}_${new Date().getTime()}.${ext}`;
    const upStream = fs.createWriteStream(USER_AVATER_PATH + filename);
    let avater = RELATIVE_AVATER_PATH +  filename;
    // 可读流通过管道写入可写流
    reader.pipe(upStream);
    let result = await new Promise((resolve,reject)=>{
        //向记录表中插入一条播放记录，同时更新抖音歌曲的播放次数
        //https://www.cnblogs.com/hzj680539/p/8032270.html
        //返回的response[0]表示执行第一条sql的结果，response[1]表示执行第一条sql的结果
        connection.query(`
            UPDATE user SET avater = ?, update_date = ? WHERE user_id = ?`,[avater,updateDate,userId],(error,response)=>{
            if(error){
                console.log("错误",error);
                reject(error)
            }else{
                connection.query("SELECT user_id AS userId,create_date AS createDate ,update_date AS updateDate,username,telephone,email,avater,birthday,sex,role from  user WHERE user_id = ?",userId,(error,response)=>{
                    var userData = JSON.parse(JSON.stringify(response[0]));
                    var token =  jsonwebtoken.sign(userData,SECRET, TOKEN_OPTIONS);
                    resolve({
                        ...SUCCESS,
                        msg:"修改头像成功",
                        data:userData,
                        token
                    })
                })

            }
        });
    })
    ctx.body = result
});

module.exports = router;

