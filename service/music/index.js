const fs = require("fs");
const path = require("path");
const Router = require("koa-router");
const axios = require("axios");
const connection = require("../connection");
const success = {status:"success"};
const fail = {status:"fail"}
const {Base64} = require('js-base64');
const router = new Router();
const request = require('request');
const jsonwebtoken = require("jsonwebtoken");
const {SECRET} = require("../../config");
const {getFullTime} = require("../../utils/common")


//获取推荐音乐数据,请求地地址：/service/music/getDiscList
router.get("/getDiscList",async(ctx)=>{
    const url = "https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg";
    await axios.get(url,{//同步请求
        headers:{//设置请求头
            referer:'https://c.y.qq.com/',
            host: 'c.y.qq.com',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        },
        params:ctx.query//请求参数
    }).then((response)=>{
        ctx.response.status = 200;//返回状态
        ctx.body=response.data;//请求结果
    }).catch((e)=>{
        console.log(e);
    })
});

//获取歌词数据,请求地地址：/service/music/lyric
router.get("/lyric",async(ctx)=>{
    const url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'
    await axios.get(url,{//同步请求
        headers:{//设置请求头
            referer: 'https://c.y.qq.com/',
            host: 'c.y.qq.com',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        },
        params:ctx.query
    }).then((response)=>{
        ctx.response.status = 200;//返回状态
        var res = response.data;//请求结果
        if (typeof res === 'string') {
            var reg = /^\w+\(({[^()]+})\)$/
            var matches = res.match(reg)
            if (matches) {
                res = JSON.parse(matches[1])
            }
        }
        //把歌词保存到数据库
        connection.query("UPDATE douyin SET lyric=? WHERE mid=? AND lyric IS NULL",[encodeURIComponent(Base64.decode(res.lyric)),ctx.query.songmid],(error,response)=>{
            console.log(response)
        });
        ctx.body = res;
    }).catch((e)=>{
        console.log(e);
    })
});

//获取歌手列表,请求地地址：/service/music/getSingerList
router.get("/getSingerList",async(ctx)=>{
    const url = "https://c.y.qq.com/v8/fcg-bin/v8.fcg";
    await axios.get(url,{
        params:{...ctx.query,jsonpCallback:"getSingerList"}
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        let res =  response.data;
        if (typeof res === 'string') {
            var matches = res.trim().replace(/^getSingerList\(/,"").replace(/\)$/,"");
            console.log(matches)
            res=JSON.parse(matches)
        }
        ctx.body = res;
    })
});

//获取热门推荐,请求地地址：/service/music/getHotKey
router.get("/getHotKey",async(ctx)=>{
    const url = "https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg";
    await axios.get(url,{
        params:{...ctx.query,jsonpCallback:"getHotKey"}
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        let res =  response.data;
        if (typeof res === 'string') {
            var matches = res.trim().replace(/^getHotKey\(/,"").replace(/\)$/,"");
            console.log(matches)
            res=JSON.parse(matches)
        }
        ctx.body = res;
    })
});

//获取热门推荐,请求地地址：/service/music/search
router.get("/search",async(ctx)=>{
    const url = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp';
    await axios.get(url,{
        params:{...ctx.query,jsonpCallback:"search"}
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        let res =  response.data;
        if (typeof res === 'string') {
            var matches = res.trim().replace(/^search\(/,"").replace(/\)$/,"");
            console.log(matches)
            res=JSON.parse(matches)
        }
        ctx.body = res;
    })
});

//获取歌手的歌曲,请求地地址：/service/music/getSingerDetail
router.get("/getSingerDetail",async(ctx)=>{
    const url = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_singer_track_cp.fcg';
    await axios.get(url,{
        params:{...ctx.query,jsonpCallback:"getSingerDetail"}
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        let res =  response.data;
        if (typeof res === 'string') {
            var matches = res.trim().replace(/^getSingerDetail\(/,"").replace(/\)$/,"");
            console.log(matches)
            res=JSON.parse(matches)
        }
        ctx.body = res;
    });
});

//获取推荐列表,请求地地址：/service/music/getRecommend
router.get("/getRecommend",async(ctx)=>{
    const url = 'https://c.y.qq.com/musichall/fcgi-bin/fcg_yqqhomepagerecommend.fcg';
    await axios.get(url,{
        params:{...ctx.query,jsonpCallback:"getRecommend"}
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        let res =  response.data;
        if (typeof res === 'string'){
            var matches = res.trim().replace(/^getRecommend\(/,"").replace(/\)$/,"");
            console.log(matches)
            res=JSON.parse(matches)
        }
        ctx.body = res;
    });
})

//获取歌单数据,请求地地址：/service/music/getSongList
router.get("/getSongList",async(ctx)=>{
    const url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg'
    await axios.get(url,{//同步请求
        headers: {//设置请求头
            referer: 'https://y.qq.com/n/yqq/playlist/4151357153.html',
            host: 'c.y.qq.com',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        },
        params:{...ctx.query,jsonpCallback:"playlistinfoCallback"}
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        var res = response.data
        if (typeof res === 'string') {
            var matches = res.replace(/^playlistinfoCallback\(/,"").replace(/\)$/,"")
            res=JSON.parse(matches)
        }
        ctx.body = res;
    }).catch((e)=>{
        console.log(e);
    })
});

//获取排行版数据,请求地地址：/service/music/getTopList
router.get("/getTopList",async(ctx)=>{
    const url = 'https://c.y.qq.com/v8/fcg-bin/fcg_myqq_toplist.fcg';
    await axios.get(url,{//同步请求
        params:{...ctx.query,jsonpCallback:"getTopList"}
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        var res = response.data
        if (typeof res === 'string') {
            var matches = res.replace(/^getTopList\(/,"").replace(/\)$/,"")
            res=JSON.parse(matches)
        }
        ctx.body = res;
    });
});

//获取音乐列表,请求地地址：/service/music/getMusicList
router.get("/getMusicList",async(ctx)=>{
    const url = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg';
    await axios.get(url,{//同步请求
        params:{...ctx.query,jsonpCallback:"getMusicList"}
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        var res = response.data
        if (typeof res === 'string') {
            var matches = res.replace(/^getMusicList\(/,"").replace(/\)$/,"")
            res=JSON.parse(matches)
        }
        ctx.body = res;
    });
});

//获取歌曲的url,请求地地址：/service/music/getAudioUrl
router.get("/getAudioUrl",async(ctx)=>{
    const url = 'https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg';
    await axios.get(url,{//同步请求
        params:{...ctx.query,jsonpCallback:"getAudioUrl"}
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        var res = response.data
        if (typeof res === 'string') {
            var matches = res.replace(/^getAudioUrl\(/,"").replace(/\)$/,"")
            res=JSON.parse(matches)
        }
        ctx.body = res;
    });
});

//获取歌曲的key,请求地地址：/service/music/getSingleSong
router.get("/getSingleSong",async(ctx)=>{
    const url = "https://u.y.qq.com/cgi-bin/musicu.fcg"
    await axios.get(url,{//同步请求
        params:{...ctx.query,jsonpCallback:"getSingleSong"}
    }).then((response)=>{
    	console.log(response)
        ctx.response.status = 200;//写入状态
        var res = response.data
        if (typeof res === 'string') {
            var matches = res.replace(/^getSingleSong\(/,"").replace(/\)$/,"")
            res=JSON.parse(matches)
        }
        ctx.body = res;
    });
});

//登录,请求地地址：/service/music/login
router.post("/login",async(ctx)=>{
    let {userId,password} = ctx.request.body;
    let result = await new Promise((resolve,reject)=>{
        if(!userId || !password){
            reject({
                ...fail,
                msg:"账号或密码不能为空"
            });
        }
        connection.query("SELECT * FROM user WHERE user_id = ? AND password = ?",[userId,password],(err,response)=>{
            if(err || response.length == 0){
                reject({
                    ...fail,
                    msg:"账号或密码不正确"
                })
            }else{
                ctx.session.userId = userId;
                let avater = "";
                if(response[0].avater){
                    avater = response[0].avater;
                }else{
                    let files = fs.readdirSync(path.resolve(__dirname,"../../public/images/avater/public"));
                    let index = Math.floor(Math.random()*files.length);
                    avater = `/images/avater/public/${files[index]}`;
                }
                resolve({
                    ...success,
                    msg:"登录成功",
                    data:{
                        name:userId,
                        avater
                    },

                });
            }
        })
    })
    ctx.body = result;
});

//登出,请求地地址：/service/music/logout
router.get("/logout",async(ctx)=>{
    ctx.session.userId = "";
    let files = fs.readdirSync(path.resolve(__dirname,"../../public/images/avater/public"));
    let index = Math.floor(Math.random()*files.length);
    ctx.body = {
        ...success,
        msg:"退出登录成功",
        data:{
            name:files[index].replace(/\..+/g,""),
            avater:`/images/avater/public/${files[index]}`
        }
    }
})

//注册,请求地地址：/service/music/register
router.post("/register",async(ctx)=>{
    let {userId,password,telephone,email} = ctx.request.body;
    ctx.session.userId = "";
    let result = await new Promise((resolve,reject)=>{
        connection.query("INSERT INTO user(user_id,password,telephone,email) VALUES(?,?,?,?)",[userId,password,telephone,email],(err,response)=>{
            if(err){
                reject(err)
            }else{
                let files = fs.readdirSync(path.resolve(__dirname,"../../public/images/avater/public"));
                let index = Math.floor(Math.random()*files.length);
                resolve({
                    ...success,
                    msg:"插入成功",
                    data:{
                        name:userId,
                        avater:`/images/avater/public/${files[index]}`
                    },

                })
            }
        })
    });
    ctx.body = result;
})

//获取用户信息,请求地地址：/service/music/getUserData
router.get("/getUserData",async(ctx)=>{
    let result = await new Promise((resolve,reject)=>{
        let token = ctx.req.headers.Authorization;
        let userData = token ? jsonwebtoken.decode(token) : null;
        if(userData){
            connection.query("SELECT user_id AS userId,create_date AS createDate ,update_date AS updateDate,username,telephone,email,avater,birthday,sex,role from  user WHERE user_id = ?",userData.userId,(error,response)=>{
                let userData = JSON.parse(JSON.stringify(response[0]));
                let token = jsonwebtoken.sign(
                    userData,  // 加密userToken
                    SECRET,
                    { expiresIn: '365d',algorithm: 'HS256'}
                );
                resolve({
                    ...success,
                    msg:"",
                    token,
                    data:userData
                })
            })
        }else{
            connection.query("SELECT user_id AS userId,create_date AS createDate ,update_date AS updateDate,username,telephone,email,avater,birthday,sex,role from  user WHERE role ='public'  order by rand() LIMIT 1",(error,response)=>{
                let userData = JSON.parse(JSON.stringify(response[0]));
                let token = jsonwebtoken.sign(
                    userData ,  // 加密userToken
                    SECRET,
                    { expiresIn: 60*60*24*365,algorithm: 'HS256'}
                );
                resolve({
                    ...success,
                    msg:"",
                    token,
                    data: userData
                })
            })

        }
    });
    ctx.body = result;
});

//根据用户id查询收藏的歌曲,请求地地址：/service/music/getFavorite
router.get("/getFavorite",async(ctx)=>{
    let result = await new Promise((resolve,reject)=>{
        connection.query("SELECT * FROM favorite_music WHERE user_id = ?",ctx.query.userId,function(err,response){
            if(err){
                reject(err)
            }else{
                resolve({
                    data:[...response],
                    msg:"查询成功",
                    ...success
                })
            }
            // connection.end();
        })
    });
    ctx.body = result;
})

//查询歌曲收藏,请求地地址：/service/music/queryFavorite
router.get("/queryFavorite",async(ctx)=>{
    let {mid,userId} = ctx.query;
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
                    ...success,
                    msg:""
                })
            })
        }
    })
    ctx.body = result;
});

//添加收藏,请求地地址：/service/music/addFavorite
router.post("/addFavorite",async(ctx)=>{
    let result = await new Promise((resolve,reject)=>{
        let data = [];
        let item = ctx.request.body;
        let {id,albummid,duration,image,localImage="",mid,name,singer,url,userId,lyric="",localUrl,playMode,kugouUrl} = item;
        let updateTime = getFullTime();
        let createTime = getFullTime();
        if(!playMode)playMode = null;
        data.push(id,albummid,duration,image,localImage,mid,name,singer,url,userId,createTime,lyric,localUrl,playMode,updateTime,kugouUrl);//参数字段
        let params =[id,albummid,duration,image,localImage,mid,name,singer,url,createTime,updateTime,lyric,userId,albummid];//插入抖音的参数
        //往收藏表中插入一条数据，要管理员才能插入都抖音歌曲表
        connection.query(
            `INSERT INTO favorite_music(id,albummid,duration,image,local_image,mid,name,singer,url,user_id,create_time,lyric,local_url,play_mode,update_time,kugou_url) 
                SELECT ? FROM DUAL WHERE NOT EXISTS (SELECT id,name FROM favorite_music WHERE id=? AND user_id= ?);
        `,[data,id,id,userId],(error,response)=>{
                //要管理员才能插入都抖音歌曲表
                if(!error){
                    if(response.affectedRows == 1){//response[0]表示第一条sql执行的结果
                        resolve({...response,...success,msg:"收藏成功"});//不是管理员，不能插入抖音歌曲表
                    }else if(response.affectedRows == 0){//response[0]表示第一条sql执行的结果
                        reject({
                            ...fail,
                            msg:"收藏失败"
                        })
                    }
                    //如果是管理员账号，收藏之后添加到抖音歌曲表
                    connection.query(`INSERT INTO douyin(id,albummid,duration,image,local_image,mid,name,singer,url,create_time,update_time,lyric) SELECT ?,?,?,?,?,?,?,?,?,?,?,? FROM DUAL WHERE exists(SELECT role FROM user WHERE user_id=? AND role = 'admin') AND NOT EXISTS (SELECT albummid FROM douyin WHERE albummid=?)`,[...params],(error,response)=>{
                        if(!response)return;
                        console.log("response=",response,url,image)
                        if(url){//把歌曲下载到本地
                            let audioMatch = url.replace(/\?.+/,"").split(".");
                            let audioFilename =  name+"."+audioMatch[audioMatch.length-1];
                            let audioRoot = path.resolve(__dirname,"../../","./public/audio/"+ audioFilename);
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
                            let imgRoot = path.resolve(__dirname,"../../","./public/images/song/"+ imgFilename);
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
                        ...fail,
                        msg:"收藏失败"
                    })
                }
            })
    });
    ctx.body = result;
});

//取消收藏,请求地地址：/service/music/deleteFavorite
router.post("/deleteFavorite",async(ctx)=>{
    let item = ctx.request.body;
    let result = await new Promise((resolve,reject)=>{
        connection.query("DELETE FROM favorite_music WHERE id = ? AND user_id = ?",[item.id,item.userId],(error,response)=>{
            if(error){
                console.log("错误",error);
                reject(error)
            }else{
                if(response.affectedRows == 1){
                    resolve({...response,...success});
                }else{
                    resolve({
                        ...fail,
                        msg:"您收藏的歌曲不存在"
                    })
                }

            }
        })
    })
    ctx.body = result;
});

//获取抖音歌曲列表,请求地地址：/service/music/getDouyinList
router.get("/getDouyinList",async(ctx)=>{
    let result = await new Promise((resolve,reject)=>{
        //查询数据库
        connection.query(`SELECT 
            id,
            albummid,
            duration,
            image,
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
            lyric,
            local_image AS localImage,
        FROM douyin 
            WHERE disabled = '0' order by update_time desc`,(error,response)=>{
            if(error){
                console.log("错误",error);
                reject(error)
            }else{
                // resolve(response)
                resolve({
                    msg:"查询成功",
                    ...success,
                    data:response
                })
            }
            // connection.end();
        })
    });
    ctx.body = result;
})

//记录播放和抖音歌曲的播放次数,请求地地址：/service/music/record
router.put("/record",async(ctx)=>{
    let item = ctx.request.body;
    let timer =  getFullTime();//当前时间
    let {id,albummid,duration,image,mid,name,singer,url,userId} = item
    let data = [[id,albummid,duration,image,mid,name,singer,url,userId,timer]]
    let result = await new Promise((resolve,reject)=>{
        //向记录表中插入一条播放记录，同时更新抖音歌曲的播放次数
        //https://www.cnblogs.com/hzj680539/p/8032270.html
        //返回的response[0]表示执行第一条sql的结果，response[1]表示执行第一条sql的结果
        connection.query(`
            INSERT INTO record_music(id,albummid,duration,image,mid,name,singer,url,user_id AS userId,create_time) VALUES ?;
            UPDATE douyin SET timer = timer+1 WHERE id = ?;
            UPDATE douyin SET url=? WHERE id = ? AND url='';`,
            [data,id,url,id],(error,response)=>{
                if(error){
                    console.log("错误",error);
                    reject(error)
                }else{
                    resolve({...response,...success})
                }
            });
    })
    ctx.body = result
});

module.exports = router;
