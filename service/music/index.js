const Router = require("koa-router");
const connection = require("../connection");
const {Base64} = require('js-base64');
const router = new Router();
const jsonwebtoken = require("jsonwebtoken");
const {
    SECRET,
    SUCCESS,
    FAIL,
    OPARATION,
    TOKEN_OPTIONS,
    INIT_TOKEN_OPTIONS,
    COOKIE_OPTIONS,
} = require("../../config");
const {getFullTime,getUserId,getQQMusicData} = require("../../utils/common");
const redisClient = require("../../utils/redisConnect");

//获取推荐音乐数据,请求地地址：/service/music/getDiscList
router.get("/getDiscList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取推荐音乐数据",method:"getDiscList",oparation:OPARATION.SELECT};
    let url = "https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=json&platform=yqq&hostUin=0&sin=0&ein=29&sortId=5&needNewCode=0&categoryId=10000000"
    let queryString = `&rnd=${Math.random()}`
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"",queryString);//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//获取歌词数据,请求地地址：/service/music/lyric
router.get("/getLyric",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌词数据",method:"getLyric",oparation:OPARATION.SELECT};
    let {songmid} = ctx.query;
    const url = "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=json&songmid="+songmid+"&platform=yqq&hostUin=0&needNewCode=0&categoryId=10000000"
    let queryString = "&pcachetime=" + new Date().getTime();
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"getLyric",queryString);//从缓存中获取数据，如果缓存没有再从接口中获取数据
    //把歌词保存到数据库
    connection.query("UPDATE douyin SET lyric=? WHERE mid=? AND lyric IS NULL",[encodeURIComponent(Base64.decode(ctx.body.data.lyric)),ctx.query.songmid],(error,response)=>{
        console.log(response)
    });
});

//获取歌手列表,请求地地址：/service/music/getSingerList
router.get("/getSingerList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌手列表",method:"getSingerList",oparation:OPARATION.SELECT};
    const url =  "https://c.y.qq.com/v8/fcg-bin/v8.fcg?jsonpCallback=getSingerList&g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&channel=singer&page=list&key=all_all_all&pagesize=100&pagenum=1&hostUin=0&needNewCode=0&platform=yqq";
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"getSingerList","");//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//获取热门推荐,请求地地址：/service/music/getHotKey
router.get("/getHotKey",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取热门推荐",method:"getHotKey",oparation:OPARATION.SELECT};
    const url = "https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&uin=0&needNewCode=1&platform=h5&jsonpCallback=getHotKey";
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"getHotKey","");//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//搜索,请求地地址：/service/music/search
router.get("/search",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"搜索",method:"search",oparation:OPARATION.SELECT};
    let {catZhida,p,n,w} = ctx.query;
    const url = "https://c.y.qq.com/soso/fcgi-bin/client_search_cp?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.center&searchid=37276201631470540&t=0&aggr=1&cr=1&lossless=0&flag_qc=0&loginUin=0&hostUin=0&platform=yqq&needNewCode=1&jsonpCallback=search&catZhida="+catZhida+"&p="+p+"&n="+n+"&w="+encodeURIComponent(w);
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"search","");//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//获取歌手的歌曲,请求地地址：/service/music/getSingerDetail
router.get("/getSingerDetail",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌手的歌曲",method:"getSingerDetail",oparation:OPARATION.SELECT};
    let {singermid} = ctx.query;
    const url = "https://c.y.qq.com/v8/fcg-bin/fcg_v8_singer_track_cp.fcg?jsonpCallback=getSingerDetail&g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&hostUin=0&needNewCode=0&platform=yqq&order=listen&begin=0&num=80&songstatus=1&singermid=" + singermid
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"search","");//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//获取推荐列表,请求地地址：/service/music/getRecommend
router.get("/getRecommend",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取推荐列表",method:"getRecommend",oparation:OPARATION.SELECT};
    const url = "https://u.y.qq.com/cgi-bin/musics.fcg?-=recom29349756051626663&g_tk=5381&sign=zzadg8hsrunooakff15c4441255ee9ef959d8dacccc3f88&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&data=%7B%22comm%22%3A%7B%22ct%22%3A24%7D%2C%22category%22%3A%7B%22method%22%3A%22get_hot_category%22%2C%22param%22%3A%7B%22qq%22%3A%22%22%7D%2C%22module%22%3A%22music.web_category_svr%22%7D%2C%22recomPlaylist%22%3A%7B%22method%22%3A%22get_hot_recommend%22%2C%22param%22%3A%7B%22async%22%3A1%2C%22cmd%22%3A2%7D%2C%22module%22%3A%22playlist.HotRecommendServer%22%7D%2C%22playlist%22%3A%7B%22method%22%3A%22get_playlist_by_category%22%2C%22param%22%3A%7B%22id%22%3A8%2C%22curPage%22%3A1%2C%22size%22%3A40%2C%22order%22%3A5%2C%22titleid%22%3A8%7D%2C%22module%22%3A%22playlist.PlayListPlazaServer%22%7D%2C%22new_song%22%3A%7B%22module%22%3A%22newsong.NewSongServer%22%2C%22method%22%3A%22get_new_song_info%22%2C%22param%22%3A%7B%22type%22%3A5%7D%7D%2C%22new_album%22%3A%7B%22module%22%3A%22newalbum.NewAlbumServer%22%2C%22method%22%3A%22get_new_album_info%22%2C%22param%22%3A%7B%22area%22%3A1%2C%22sin%22%3A0%2C%22num%22%3A20%7D%7D%2C%22new_album_tag%22%3A%7B%22module%22%3A%22newalbum.NewAlbumServer%22%2C%22method%22%3A%22get_new_album_area%22%2C%22param%22%3A%7B%7D%7D%2C%22toplist%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%2C%22focus%22%3A%7B%22module%22%3A%22music.musicHall.MusicHallPlatform%22%2C%22method%22%3A%22GetFocus%22%2C%22param%22%3A%7B%7D%7D%7D";
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"search","");//从缓存中获取数据，如果缓存没有再从接口中获取数据
})

//获取歌单数据,请求地地址：/service/music/getSongList
router.get("/getSongList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌单数据",method:"getSongList",oparation:OPARATION.SELECT};
    let {disstid} = ctx.query;
    const url  = "https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&type=1&json=1&utf8=1&onlysong=0&disstid="+disstid+"&loginUin=0&hostUin=0&platform=yqq&needNewCode=0&jsonpCallback=getSongList";
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"getSongList","");//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//获取排行版数据,请求地地址：/service/music/getTopList
router.get("/getTopList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌单数据",method:"getTopList",oparation:OPARATION.SELECT};
    const url = url = "https://c.y.qq.com/v8/fcg-bin/fcg_myqq_toplist.fcg?jsonpCallback=getTopList&g_tk=5381&loginUin=0&hostUin=0&platform=yqq&needNewCode=0&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&uin=0&needNewCode=1&platform=h5";
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"getTopList","");//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//获取音乐列表,请求地地址：/service/music/getMusicList
router.get("/getMusicList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取音乐列表",method:"getMusicList",oparation:OPARATION.SELECT};
    let {topid} = ctx.query;
    const url = "https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg?jsonpCallback=getMusicList&g_tk=5381&loginUin=0&hostUin=0&platform=yqq&needNewCode=0&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&topid=" + topid + "&needNewCode=1&uin=0&tpl=3&page=detail&type=top&platform=h5&needNewCode=1";
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"getMusicList","");//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//获取歌曲的url,请求地地址：/service/music/getAudioUrl
router.get("/getAudioUrl",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌曲的url",method:"getAudioUrl",oparation:OPARATION.SELECT};//日志记录
    let {songmid,filename} = ctx.query;
    const url = "https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?jsonpCallback=getAudioUrl&g_tk=5381&loginUin=0&hostUin=0&platform=yqq&needNewCode=0&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&cid=205361747&uin=0&songmid=" + songmid + "&filename=" + filename + "&guid=3397254710";
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"getAudioUrl","");//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//获取歌曲的key,请求地地址：/service/music/getSingleSong
router.get("/getSingleSong",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌曲的key",method:"getSingleSong",oparation:OPARATION.SELECT};//日志记录
    let {songmid} = ctx.query;
    const url = "https://u.y.qq.com/cgi-bin/musicu.fcg?jsonpCallback=getSingleSong&g_tk=5381&loginUin=275018723&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&data=%7B%22req%22:%7B%22module%22:%22CDN.SrfCdnDispatchServer%22,%22method%22:%22GetCdnDispatch%22,%22param%22:%7B%22guid%22:%222807659112%22,%22calltype%22:0,%22userip%22:%22%22%7D%7D,%22req_0%22:%7B%22module%22:%22vkey.GetVkeyServer%22,%22method%22:%22CgiGetVkey%22,%22param%22:%7B%22guid%22:%222807659112%22,%22songmid%22:[%22"+songmid+"%22],%22songtype%22:[0],%22uin%22:%22275018723%22,%22loginflag%22:1,%22platform%22:%2220%22%7D%7D,%22comm%22:%7B%22uin%22:275018723,%22format%22:%22json%22,%22ct%22:24,%22cv%22:0%7D%7D";
    const queryString = "&-=getplaysongvkey"+ new Date().getTime()
    ctx.response.status = 200;//写入状态
    ctx.body = await getQQMusicData(url,"getSingleSong",queryString);//从缓存中获取数据，如果缓存没有再从接口中获取数据
});

//登录,请求地地址：/service/music/login
router.post("/login",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"登录",method:"login",oparation:OPARATION.LOGIN};//日志记录
    let {userId,password} = ctx.request.body;
    let result = await new Promise((resolve,reject)=>{
        if(!userId || !password){
            reject({
                ...FAIL,
                msg:"账号或密码不能为空",
                data:null
            });
        }
        connection.query("SELECT * FROM user WHERE user_id = ? AND password = ?",[userId,password],(err,response)=>{
            if(err || response.length == 0){
                reject({
                    ...FAIL,
                    msg:"账号或密码不正确",
                    data:null
                })
            }else{
                var userData = JSON.parse(JSON.stringify(response[0]));
                var token =  jsonwebtoken.sign(userData,SECRET, INIT_TOKEN_OPTIONS);
                ctx.cookies.set('token', token,COOKIE_OPTIONS);
                resolve({
                    ...SUCCESS,
                    msg:"登录成功",
                    data:userData,
                });
            }
        })
    })
    ctx.body = result;
});

//登出,请求地地址：/service/music/logout
router.get("/logout",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"登录",method:"login",oparation:OPARATION.LOGOUT};//日志记录
    ctx.cookies.set( 'token', "",{...COOKIE_OPTIONS,maxAge: 0}
    );
    ctx.body = {
        ...SUCCESS,
        msg:"退出登录成功",
        data:null
    }
})

//注册,请求地地址：/service/music/register
router.post("/register",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"register",method:"login",oparation:OPARATION.INSERT};//日志记录
    let {userId,password,telephone,email} = ctx.request.body;
    ctx.session.userId = "";
    let result = await new Promise((resolve,reject)=>{
        connection.query("INSERT INTO user(user_id,password,telephone,email) VALUES(?,?,?,?)",[userId,password,telephone,email],(err,response)=>{
            if(err){
                reject(err)
            }else{
                resolve({
                    ...SUCCESS,
                    msg:"注册成功",
                    data:{
                        userId,
                        telephone,
                        email
                    },

                })
            }
        })
    });
    ctx.body = result;
})

//获取用户信息,请求地地址：/service/music/getUserData
router.get("/getUserData",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取用户信息",method:"getUserData",oparation:OPARATION.SELECT};//日志记录
    let result = await new Promise((resolve,reject)=>{
        let userId = getUserId(ctx)
        // userId = "吴怨吴悔"
        if(userId){
            connection.query("SELECT user_id AS userId,create_date AS createDate ,update_date AS updateDate,username,telephone,email,avater,birthday,sex,role from  user WHERE user_id = ?",userId,(error,response)=>{
                var userData = JSON.parse(JSON.stringify(response[0]));
                var token =  jsonwebtoken.sign(userData,SECRET, TOKEN_OPTIONS);
                resolve({
                    ...SUCCESS,
                    msg:"获取用户信息成功",
                    data:userData,
                    token
                })
            })
        }else{
            connection.query("SELECT user_id AS userId,create_date AS createDate ,update_date AS updateDate,username,telephone,email,avater,birthday,sex,role from  user WHERE role ='public'  order by rand() LIMIT 1",(error,response)=>{
                let userData = JSON.parse(JSON.stringify(response[0]));
                let token = jsonwebtoken.sign(userData,SECRET, INIT_TOKEN_OPTIONS);
                resolve({
                    ...SUCCESS,
                    msg:"获取用户信息成功",
                    data: userData,
                    token
                })
            })

        }
    });
    ctx.body = result;
});

//获取抖音歌曲列表,请求地地址：/service/music/getDouyinList
router.get("/getDouyinList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取抖音歌曲列表",method:"getDouyinList",oparation:OPARATION.SELECT};//日志记录
    let data = await redisClient.get(ctx.req.url);
    if(data){
        return ctx.body = data;
    }
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
            local_image AS localImage
        FROM douyin 
            WHERE disabled = '0' order by update_time desc limit 0 ,100`,(error,response)=>{
            if(error){
                console.log("错误",error);
                reject(error)
            }else{
                resolve({
                    msg:"查询成功",
                    ...SUCCESS,
                    data:response
                })
            }
        })
    });
    ctx.body = result;
    redisClient.set(ctx.req.url,result);
})

//记录播放和抖音歌曲的播放次数,请求地地址：/service/music/record
router.post("/record",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"记录播放和抖音歌曲的播放次数",method:"record",oparation:OPARATION.INSERT};//日志记录
    let item = ctx.request.body;
    let timer =  getFullTime();//当前时间
    let {id,albummid,duration,image,mid,name,singer,url,userId} = item
    let data = [[id,albummid,duration,image,mid,name,singer,url,userId,timer]]
    let result = await new Promise((resolve,reject)=>{
        //向记录表中插入一条播放记录，同时更新抖音歌曲的播放次数
        //https://www.cnblogs.com/hzj680539/p/8032270.html
        //返回的response[0]表示执行第一条sql的结果，response[1]表示执行第一条sql的结果
        connection.query(`
            INSERT INTO record_music(id,albummid,duration,image,mid,name,singer,url,user_id,create_time) VALUES ?;
            UPDATE douyin SET timer = timer+1 WHERE id = ?;
            UPDATE douyin SET url=? WHERE id = ? AND url='';`,
            [data,id,url,id],(error,response)=>{
                if(error){
                    console.log("错误",error);
                    reject(error)
                }else{
                    resolve({
                        ...SUCCESS,
                        data:response,
                        msg:"插入记录成功",
                    })
                }
            });
    })
    ctx.body = result
});


module.exports = router;
