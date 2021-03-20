const fs = require("fs");
const Router = require("koa-router");
const axios = require("axios");
const connection = require("../connection");
const {Base64} = require('js-base64');
const router = new Router();
const request = require('request');
const jsonwebtoken = require("jsonwebtoken");
const {
    SECRET,
    ERR_OK,
    SUCCESS,
    FAIL,
    OPARATION,
    USER_AVATER_PATH,
    RELATIVE_AVATER_PATH,
    TOKEN_OPTIONS,
    INIT_TOKEN_OPTIONS,
    COOKIE_OPTIONS,
    CHEADERS:headers,
    UHEADERS:uHeaders,
} = require("../../config");
const {getFullTime,getValue,getUserId,getParams} = require("../../utils/common");
const redisClient = require("../redisConnect");

//获取推荐音乐数据,请求地地址：/service/music/getDiscList
router.get("/getDiscList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取推荐音乐数据",method:"getDiscList",oparation:OPARATION.SELECT};
    let queryString = getParams({
        g_tk: 5381,
        inCharset: "utf-8",
        outCharset: "utf-8",
        notice: 0,
        format: "json",
        platform: "yqq",
        hostUin: 0,
        sin: 0,
        ein: 29,
        sortId: 5,
        needNewCode: 0,
        categoryId: 10000000,
    })

    const url = "https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg" + queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let options = {
        headers,
        params:{
            rnd: Math.random(),
        }
    }
    let response = await axios.get(url,options);
    ctx.response.status = 200;//返回状态
    var res = response.data;//请求结果
    if(res.code == ERR_OK){
        ctx.body = {
            ...SUCCESS,
            msg:"",
            data:res.data//请求结果,
        };
    }else {
        ctx.body = {
            ...FAIL,
            msg:res.message,
            data:res.data//请求结果,
        };
    }
    redisClient.set(url, ctx.body);
});

//获取歌词数据,请求地地址：/service/music/lyric
router.get("/getLyric",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌词数据",method:"getLyric",oparation:OPARATION.SELECT};
    let url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg';
    let {songmid} = ctx.query;
    let queryString = getParams({
        g_tk: 5381,
        inCharset: "utf-8",
        outCharset: "utf-8",
        notice: 0,
        format: "json",
        songmid,
        platform: "yqq",
        hostUin: 0,
        needNewCode: 0,
        categoryId: 10000000,
    });
    url += queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let options ={
        headers,
        params:{
            pcachetime: + new Date(),
        }
    }
    let response = await axios.get(url,options);
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
    if(res.code == ERR_OK){
        ctx.body = {
            ...SUCCESS,
            msg:"获取歌词成功",
            data:res//请求结果,
        };
    }else{
        ctx.body = {
            ...false,
            msg:res.message,
            data:null//请求结果,
        };
    }
    redisClient.set(url, ctx.body);
});

//获取歌手列表,请求地地址：/service/music/getSingerList
router.get("/getSingerList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌手列表",method:"getSingerList",oparation:OPARATION.SELECT};
    let queryString = getParams({
        jsonpCallback:"getSingerList",
        g_tk: 5381,
        inCharset: "utf-8",
        outCharset: "utf-8",
        notice: 0,
        format: "jsonp",
        channel: "singer",
        page: "list",
        key: "all_all_all",
        pagesize: 100,
        pagenum: 1,
        hostUin: 0,
        needNewCode: 0,
        platform: "yqq"
    });
    const url = `https://c.y.qq.com/v8/fcg-bin/v8.fcg` + queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let response = await axios.get(url,{headers});
    ctx.response.status = 200;//写入状态
    let res =  response.data;
    if (typeof res === 'string') {
        var matches = res.trim().replace(/^getSingerList\(/,"").replace(/\)$/,"");
        res=JSON.parse(matches)
    }
    if(res.code == ERR_OK){
        ctx.body = {
            ...SUCCESS,
            msg:"获取歌手列表成功",
            data:res.data//请求结果,
        };
    }else {
        ctx.body = {
            ...FAIL,
            msg:res.message,
            data:res.data//请求结果,
        };
    }
    redisClient.set(url, ctx.body);
});

//获取热门推荐,请求地地址：/service/music/getHotKey
router.get("/getHotKey",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取热门推荐",method:"getHotKey",oparation:OPARATION.SELECT};
    let queryString = getParams({
        g_tk: 5381,
        inCharset: "utf-8",
        outCharset: "utf-8",
        notice: 0,
        format: "jsonp",
        uin: 0,
        needNewCode: 1,
        platform: "h5",
        jsonpCallback:"getHotKey"
    });
    const url = "https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg" + queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let response = await axios.get(url,{headers});
    ctx.response.status = 200;//写入状态
    let res =  response.data;
    if (typeof res === 'string') {
        var matches = res.trim().replace(/^getHotKey\(/,"").replace(/\)$/,"");
        res=JSON.parse(matches)
    }
    if(res.code == ERR_OK){
        ctx.body = {
            ...SUCCESS,
            msg:"获取热门推荐成功",
            data:res.data//请求结果,
        };
    }else{
        ctx.body = {
            ...FAIL,
            msg:"获取热门推荐失败",
            data:res.data//请求结果,
        };
    }
    redisClient.set(url, ctx.body);
});

//搜索,请求地地址：/service/music/search
router.get("/search",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"搜索",method:"search",oparation:OPARATION.SELECT};
    let {catZhida,p,n,w} = ctx.query;
    let queryString = getParams({
        g_tk: 5381,
        inCharset: "utf-8",
        outCharset: "utf-8",
        notice: 0,
        format: "jsonp",
        ct: 24,
        qqmusic_ver: 1298,
        new_json: 1,
        remoteplace: "txt.yqq.center",
        searchid: 37276201631470540,
        t: 0,
        aggr: 1,
        cr: 1,
        lossless: 0,
        flag_qc: 0,
        loginUin: 0,
        hostUin: 0,
        platform: "yqq",
        needNewCode: 1,
        jsonpCallback:"search",
        catZhida,
        p,
        n,
        w:encodeURIComponent(w)
    });
    const url = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp' + queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let response = await axios.get(url,{headers});
    ctx.response.status = 200;//写入状态
    let res =  response.data;
    if (typeof res === 'string') {
        var matches = res.trim().replace(/^search\(/,"").replace(/\)$/,"");
        res=JSON.parse(matches)
    }
    if(res.code == ERR_OK){
        ctx.body = {
            ...SUCCESS,
            msg:"搜索成功",
            data:res.data//请求结果,
        };
    }else {
        ctx.body = {
            ...FAIL,
            msg:"搜索成功",
            data:res.data//请求结果,
        };
    }
    redisClient.set(url,ctx.body);
});

//获取歌手的歌曲,请求地地址：/service/music/getSingerDetail
router.get("/getSingerDetail",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌手的歌曲",method:"getSingerDetail",oparation:OPARATION.SELECT};
    let {singermid} = ctx.query;
    let queryString = getParams({
        jsonpCallback:"getSingerDetail",
        g_tk:5381,
        inCharset:"utf-8",
        outCharset:"utf-8",
        notice:0,
        format:"jsonp",
        hostUin:0,
        needNewCode:0,
        platform:"yqq",
        order:"listen",
        begin:0,
        num:80,
        songstatus:1,
        singermid
    });
    const url = `https://c.y.qq.com/v8/fcg-bin/fcg_v8_singer_track_cp.fcg` + queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let response = await axios.get(url,{headers});
    ctx.response.status = 200;//写入状态
    let res =  response.data;
    if (typeof res === 'string') {
        var matches = res.trim().replace(/^getSingerDetail\(/,"").replace(/\)$/,"");
        res=JSON.parse(matches)
    }
    if(res.code == ERR_OK){
        ctx.body = {
            ...SUCCESS,
            msg:"获取歌手歌曲成功",
            data:res.data//请求结果,
        };
    }else{
        ctx.body = {
            ...FAIL,
            msg:res.message,
            data:res.data//请求结果,
        };
    }
    redisClient.set(url,ctx.body);
});

//获取推荐列表,请求地地址：/service/music/getRecommend
router.get("/getRecommend",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取推荐列表",method:"getRecommend",oparation:OPARATION.SELECT};
    let queryString = getParams({
        "-": "recom29349756051626663",
        g_tk: 5381,
        sign: "zzadg8hsrunooakff15c4441255ee9ef959d8dacccc3f88",
        loginUin: 0,
        hostUin: 0,
        format: "json",
        inCharset: "utf8",
        outCharset: "utf-8",
        notice: 0,
        platform: "yqq.json",
        needNewCode: 0,
        data:encodeURIComponent(JSON.stringify({
            "comm": {"ct": 24},
            "category": {"method": "get_hot_category", "param": {"qq": ""}, "module": "music.web_category_svr"},
            "recomPlaylist": {
                "method": "get_hot_recommend",
                "param": {"async": 1, "cmd": 2},
                "module": "playlist.HotRecommendServer"
            },
            "playlist": {
                "method": "get_playlist_by_category",
                "param": {"id": 8, "curPage": 1, "size": 40, "order": 5, "titleid": 8},
                "module": "playlist.PlayListPlazaServer"
            },
            "new_song": {"module": "newsong.NewSongServer", "method": "get_new_song_info", "param": {"type": 5}},
            "new_album": {
                "module": "newalbum.NewAlbumServer",
                "method": "get_new_album_info",
                "param": {"area": 1, "sin": 0, "num": 20}
            },
            "new_album_tag": {"module": "newalbum.NewAlbumServer", "method": "get_new_album_area", "param": {}},
            "toplist": {"module": "musicToplist.ToplistInfoServer", "method": "GetAll", "param": {}},
            "focus": {"module": "music.musicHall.MusicHallPlatform", "method": "GetFocus", "param": {}}
        }))
    });
    const url = 'https://u.y.qq.com/cgi-bin/musics.fcg' + queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let response = await axios.get(url,{headers:uHeaders});
    ctx.response.status = 200;//写入状态
    ctx.body = {
        ...SUCCESS,
        msg:"获取推荐列表成功",
        data:response.data//请求结果,
    };
    redisClient.set(url,ctx.body);
})

//获取歌单数据,请求地地址：/service/music/getSongList
router.get("/getSongList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌单数据",method:"getSongList",oparation:OPARATION.SELECT};
    let {disstid} = ctx.query;
    let queryString = getParams({
        g_tk: 5381,
        inCharset: "utf-8",
        outCharset: "utf-8",
        notice: 0,
        format: "jsonp",
        type: 1,
        json: 1,
        utf8: 1,
        onlysong: 0,
        disstid,
        loginUin: 0,
        hostUin: 0,
        platform: "yqq",
        needNewCode: 0,
        jsonpCallback:"getSongList"
    });
    const url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg' + queryString;
    let data = await redisClient.get(ctx.req.url);
    if(data){
        return ctx.body = data;
    }
    let response = await axios.get(url,{//同步请求
        headers,
    });
    ctx.response.status = 200;//写入状态
    var res = response.data
    if (typeof res === 'string') {
        var matches = res.replace(/^getSongList\(/,"").replace(/\)$/,"")
        res=JSON.parse(matches)
    }
    if(res.code == ERR_OK){
        ctx.body = {
            ...SUCCESS,
            msg:"获取歌单数据成功",
            data:res//请求结果,
        };
    }else{
        ctx.body = {
            ...FAIL,
            msg:res.message,
            data:res//请求结果,
        };
    }
    redisClient.set(url,ctx.body);
});

//获取排行版数据,请求地地址：/service/music/getTopList
router.get("/getTopList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌单数据",method:"getTopList",oparation:OPARATION.SELECT};
    let queryString = getParams({
        g_tk: 5381,
        inCharset: 'utf-8',
        outCharset: 'utf-8',
        notice: 0,
        format: 'jsonp',
        uin: 0,
        needNewCode: 1,
        platform: 'h5',
        jsonpCallback:"getTopList"
    })
    const url = 'https://c.y.qq.com/v8/fcg-bin/fcg_myqq_toplist.fcg' + queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let response = await axios.get(url,{ headers });
    ctx.response.status = 200;//写入状态
    var res = response.data
    if (typeof res === 'string') {
        var matches = res.replace(/^getTopList\(/,"").replace(/\)$/,"")
        res=JSON.parse(matches)
    }
    if(res.code == ERR_OK){
        ctx.body = {
            ...SUCCESS,
            msg:"获取排行版数据成功",
            data:res.data//请求结果,
        };
    }else{
        ctx.body = {
            ...FAIL,
            msg:res.message,
            data:res.data//请求结果,
        };
    }
    redisClient.set(url,ctx.body);
});

//获取音乐列表,请求地地址：/service/music/getMusicList
router.get("/getMusicList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取音乐列表",method:"getMusicList",oparation:OPARATION.SELECT};
    let {topid} = ctx.query;
    let queryString = getParams({
        needNewCode: 1,
        uin: 0,
        tpl: 3,
        page: 'detail',
        type: 'top',
        platform: 'h5',
        g_tk: 5381,
        inCharset: 'utf-8',
        outCharset: 'utf-8',
        notice: 0,
        format: 'jsonp',
        jsonpCallback:"getMusicList",
        topid
    })
    const url = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg' + queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let response = await axios.get(url,{headers});
    ctx.response.status = 200;//写入状态
    var res = response.data
    if (typeof res === 'string') {
        var matches = res.replace(/^getMusicList\(/,"").replace(/\)$/,"")
        res=JSON.parse(matches)
    }
    if(res.code == ERR_OK){
        ctx.body = {
            ...SUCCESS,
            msg:"获取音乐列表成功",
            data:res.data//请求结果,
        };
    }else{
        ctx.body = {
            ...FAIL,
            msg:res.message,
            data:res.data//请求结果,
        };
    }
    redisClient.set(url,ctx.body);
});

//获取歌曲的url,请求地地址：/service/music/getAudioUrl
router.get("/getAudioUrl",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌曲的url",method:"getAudioUrl",oparation:OPARATION.SELECT};//日志记录
    let {songmid,filename} = ctx.query;
    let queryString = getParams({
        inCharset: 'utf-8',
        outCharset: 'utf-8',
        format: 'jsonp',
        g_tk:5381,
        loginUin:0,
        hostUin:0,
        notice:0,
        platform:"yqq",
        needNewCode:0,
        cid:"205361747",
        uin:0,
        songmid,
        filename,
        guid:"3397254710",
        jsonpCallback:"getAudioUrl"
    });
    const url = 'https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg' + queryString;
    let data = await redisClient.get(url);
    if(data){
        return ctx.body = data;
    }
    let response = await axios.get(url,{ headers });
    ctx.response.status = 200;//写入状态
    var res = response.data
    if (typeof res === 'string') {
        var matches = res.replace(/^getAudioUrl\(/,"").replace(/\)$/,"")
        res=JSON.parse(matches)
    }
    ctx.body = {
        ...SUCCESS,
        msg:"获取歌曲的url成功",
        data:res//请求结果,
    };
    redisClient.set(url,ctx.body);
});

//获取歌曲的key,请求地地址：/service/music/getSingleSong
router.get("/getSingleSong",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌曲的key",method:"getSingleSong",oparation:OPARATION.SELECT};//日志记录
    let {songmid} = ctx.query;
    let queryString = getParams({
        jsonpCallback:"getSingleSong",
        g_tk:5381,
        loginUin:275018723,
        hostUin:0,
        format:"json",
        inCharset:"utf8",
        outCharset:"utf-8",
        notice:0,
        platform:"yqq.json",
        needNewCode:0,
        data:encodeURIComponent(JSON.stringify({
            "req":{
                "module":"CDN.SrfCdnDispatchServer",
                "method":"GetCdnDispatch",
                "param":{
                    "guid":"2807659112",
                    "calltype":0,
                    "userip":""
                }
            },
            "req_0":{
                "module":"vkey.GetVkeyServer",
                "method":"CgiGetVkey",
                "param":{
                    "guid":"2807659112",
                    "songmid":[songmid],
                    "songtype":[0],
                    "uin":"275018723",
                    "loginflag":1,
                    "platform":"20"
                }
            },
            "comm":{
                "uin":275018723,
                "format":"json",
                "ct":24,
                "cv":0
            }
        }))
    });
    const url = "https://u.y.qq.com/cgi-bin/musicu.fcg" + queryString;
    let data = await redisClient.get(url,{headers:uHeaders});
    if(data){
        return ctx.body = data;
    }
    let options = {
        headers:uHeaders,
        params:{
            "-":"getplaysongvkey"+(Math.random()+"").replace("0.",""),
        }
    }
    let response = await axios.get(url,options);
    ctx.response.status = 200;//写入状态
    var res = response.data
    if (typeof res === 'string') {
        var matches = res.replace(/^getSingleSong\(/,"").replace(/\)$/,"")
        res=JSON.parse(matches)
    }
    ctx.body = {
        ...SUCCESS,
        msg:"获取歌曲的key成功",
        data:res//请求结果,
    };
    redisClient.set(url,ctx.body);
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
