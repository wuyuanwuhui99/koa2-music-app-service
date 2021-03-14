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
    COOKIE_OPTIONS
} = require("../../config");
const {getFullTime,getValue} = require("../../utils/common");


//获取推荐音乐数据,请求地地址：/service/music/getDiscList
router.get("/getDiscList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取推荐音乐数据",method:"getDiscList",oparation:OPARATION.SELECT}
    let options = {
        headers:{//设置请求头
            referer:'https://c.y.qq.com/',
            host: 'c.y.qq.com',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        },
        params:{
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
            rnd: Math.random(),
        }
    }
    const url = "https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg";
    await axios.get(url,options).then((response)=>{
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

    }).catch((e)=>{
        console.log(e);
    })
});

//获取歌词数据,请求地地址：/service/music/lyric
router.get("/getLyric",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌词数据",method:"getLyric",oparation:OPARATION.SELECT}
    const url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg';
    let {songmid} = ctx.query;
    let options ={
        headers:{//设置请求头
            referer: 'https://c.y.qq.com/',
            host: 'c.y.qq.com',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        },
        params:{
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
            pcachetime: + new Date(),
        }
    }
    await axios.get(url,options).then((response)=>{
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
                data:{lyric:res.lyric}//请求结果,
            };
        }else{
            ctx.body = {
                ...false,
                msg:res.message,
                data:null//请求结果,
            };
        }
    }).catch((e)=>{
        console.log(e);
    })
});

//获取歌手列表,请求地地址：/service/music/getSingerList
router.get("/getSingerList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌手列表",method:"getSingerList",oparation:OPARATION.SELECT}
    let params = {
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
    }
    const url = `https://c.y.qq.com/v8/fcg-bin/v8.fcg`
    await axios.get(url,{params}).then((response)=>{
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
                data:res.data.list//请求结果,
            };
        }else {
            ctx.body = {
                ...FAIL,
                msg:res.message,
                data:res.data//请求结果,
            };
        }

    }).catch((err)=>{
        console.log(err)
    })
});

//获取热门推荐,请求地地址：/service/music/getHotKey
router.get("/getHotKey",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取热门推荐",method:"getHotKey",oparation:OPARATION.SELECT}
    let params = {
        g_tk: 5381,
        inCharset: "utf-8",
        outCharset: "utf-8",
        notice: 0,
        format: "jsonp",
        uin: 0,
        needNewCode: 1,
        platform: "h5",
        jsonpCallback:"getHotKey"
    }
    const url = "https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg";
    await axios.get(url,{
        params
    }).then((response)=>{
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

    })
});

//搜索,请求地地址：/service/music/search
router.get("/search",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"搜索",method:"search",oparation:OPARATION.SELECT}
    let {catZhida,p,n,w} = ctx.query;
    let params = {
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
        w
    }
    const url = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp';
    await axios.get(url,{
        params
    }).then((response)=>{
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
    })
});

//获取歌手的歌曲,请求地地址：/service/music/getSingerDetail
router.get("/getSingerDetail",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌手的歌曲",method:"getSingerDetail",oparation:OPARATION.SELECT}
    let {singermid} = ctx.query;
    let params = {
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
    }
    const url = `https://c.y.qq.com/v8/fcg-bin/fcg_v8_singer_track_cp.fcg`;
    await axios.get(url,{params}).then((response)=>{
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

    });
});

//获取推荐列表,请求地地址：/service/music/getRecommend
router.get("/getRecommend",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取推荐列表",method:"getRecommend",oparation:OPARATION.SELECT}
    let options = {
        headers:{//设置请求头
            referer: 'https://y.qq.com/',
            host: 'u.y.qq.com',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        },
        params:{
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
            data:JSON.stringify({
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
            })
        }

    }
    const url = 'https://u.y.qq.com/cgi-bin/musics.fcg';
    // const url = "https://u.y.qq.com/cgi-bin/musics.fcg?-=recom15635130779109763&g_tk=5381&sign=zzavgi6x8os5ocff15c4441255ee9ef959d8dacccc3f88&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&data=%7B%22comm%22%3A%7B%22ct%22%3A24%7D%2C%22category%22%3A%7B%22method%22%3A%22get_hot_category%22%2C%22param%22%3A%7B%22qq%22%3A%22%22%7D%2C%22module%22%3A%22music.web_category_svr%22%7D%2C%22recomPlaylist%22%3A%7B%22method%22%3A%22get_hot_recommend%22%2C%22param%22%3A%7B%22async%22%3A1%2C%22cmd%22%3A2%7D%2C%22module%22%3A%22playlist.HotRecommendServer%22%7D%2C%22playlist%22%3A%7B%22method%22%3A%22get_playlist_by_category%22%2C%22param%22%3A%7B%22id%22%3A8%2C%22curPage%22%3A1%2C%22size%22%3A40%2C%22order%22%3A5%2C%22titleid%22%3A8%7D%2C%22module%22%3A%22playlist.PlayListPlazaServer%22%7D%2C%22new_song%22%3A%7B%22module%22%3A%22newsong.NewSongServer%22%2C%22method%22%3A%22get_new_song_info%22%2C%22param%22%3A%7B%22type%22%3A5%7D%7D%2C%22new_album%22%3A%7B%22module%22%3A%22newalbum.NewAlbumServer%22%2C%22method%22%3A%22get_new_album_info%22%2C%22param%22%3A%7B%22area%22%3A1%2C%22sin%22%3A0%2C%22num%22%3A20%7D%7D%2C%22new_album_tag%22%3A%7B%22module%22%3A%22newalbum.NewAlbumServer%22%2C%22method%22%3A%22get_new_album_area%22%2C%22param%22%3A%7B%7D%7D%2C%22toplist%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%2C%22focus%22%3A%7B%22module%22%3A%22music.musicHall.MusicHallPlatform%22%2C%22method%22%3A%22GetFocus%22%2C%22param%22%3A%7B%7D%7D%7D"
    await axios.get(url,options).then((response)=>{
        ctx.response.status = 200;//写入状态
        let list = getValue(response,["data","focus","data","shelf","v_niche","0","v_card"],[]);
        ctx.body = {
            ...SUCCESS,
            msg:"获取推荐列表成功",
            data:list//请求结果,
        };
    }).catch((err)=>{
        console.log(err)
    })
})

//获取歌单数据,请求地地址：/service/music/getSongList
router.get("/getSongList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌单数据",method:"getSongList",oparation:OPARATION.SELECT};
    const url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg';
    let {disstid} = ctx.query;
    await axios.get(url,{//同步请求
        headers: {//设置请求头
            referer: 'https://y.qq.com/n/yqq/playlist/4151357153.html',
            host: 'c.y.qq.com',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        },
        params:{
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
            jsonpCallback:"playlistinfoCallback"
        }
    }).then((response)=>{
        ctx.response.status = 200;//写入状态
        var res = response.data
        if (typeof res === 'string') {
            var matches = res.replace(/^playlistinfoCallback\(/,"").replace(/\)$/,"")
            res=JSON.parse(matches)
        }
        if(res.code == ERR_OK){
            ctx.body = {
                ...SUCCESS,
                msg:"获取歌单数据成功",
                data:res.cdlist ? res.cdlist[0] :{}//请求结果,
            };
        }else{
            ctx.body = {
                ...FAIL,
                msg:res.message,
                data:res.data//请求结果,
            };
        }

    }).catch((e)=>{
        console.log(e);
    })
});

//获取排行版数据,请求地地址：/service/music/getTopList
router.get("/getTopList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌单数据",method:"getTopList",oparation:OPARATION.SELECT};
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
        ctx.body = {
            ...SUCCESS,
            msg:"获取排行版数据成功",
            data:res//请求结果,
        };
    });
});

//获取音乐列表,请求地地址：/service/music/getMusicList
router.get("/getMusicList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取音乐列表",method:"getMusicList",oparation:OPARATION.SELECT};
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
        ctx.body = {
            ...SUCCESS,
            msg:"获取音乐列表成功",
            data:res//请求结果,
        };
    });
});

//获取歌曲的url,请求地地址：/service/music/getAudioUrl
router.get("/getAudioUrl",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌曲的url",method:"getAudioUrl",oparation:OPARATION.SELECT};//日志记录
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
        ctx.body = {
            ...SUCCESS,
            msg:"获取歌曲的url成功",
            data:res//请求结果,
        };
    });
});

//获取歌曲的key,请求地地址：/service/music/getSingleSong
router.get("/getSingleSong",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取歌曲的key",method:"getSingleSong",oparation:OPARATION.SELECT};//日志记录
    let {songmid} = ctx.query;
    let params =  {
        jsonpCallback:"getSingleSong",
        "-":"getplaysongvkey"+(Math.random()+"").replace("0.",""),
        g_tk:5381,
        loginUin:275018723,
        hostUin:0,
        format:"json",
        inCharset:"utf8",
        outCharset:"utf-8",
        notice:0,
        platform:"yqq.json",
        needNewCode:0,
        data:JSON.stringify({
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
        })
    }
    const url = "https://u.y.qq.com/cgi-bin/musicu.fcg"
    await axios.get(url,{//同步请求
        params
    }).then((response)=>{
    	console.log(response)
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
    });
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
        var token = ctx.cookies.get("token");
        var userData = token ? jsonwebtoken.decode(token) : null;
        if(userData){
            connection.query("SELECT user_id AS userId,create_date AS createDate ,update_date AS updateDate,username,telephone,email,avater,birthday,sex,role from  user WHERE user_id = ?",userData.userId,(error,response)=>{
                var userData = JSON.parse(JSON.stringify(response[0]));
                var token =  jsonwebtoken.sign(userData,SECRET, TOKEN_OPTIONS);
                ctx.cookies.set("token",token,COOKIE_OPTIONS);
                resolve({
                    ...SUCCESS,
                    msg:"获取用户信息成功",
                    data:userData
                })
            })
        }else{
            connection.query("SELECT user_id AS userId,create_date AS createDate ,update_date AS updateDate,username,telephone,email,avater,birthday,sex,role from  user WHERE role ='public'  order by rand() LIMIT 1",(error,response)=>{
                let userData = JSON.parse(JSON.stringify(response[0]));
                let token = jsonwebtoken.sign(userData,SECRET, INIT_TOKEN_OPTIONS);
                ctx.cookies.set("token",token,COOKIE_OPTIONS);
                resolve({
                    ...SUCCESS,
                    msg:"获取用户信息成功",
                    data: userData
                })
            })

        }
    });
    ctx.body = result;
});

//根据用户id查询收藏的歌曲,请求地地址：/service/music/getFavorite
router.get("/getFavorite",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"根据用户id查询收藏的歌曲",method:"getFavorite",oparation:OPARATION.SELECT};//日志记录
    let result = await new Promise((resolve,reject)=>{
        let token = ctx.cookies.get("token");
        var userData = jsonwebtoken.decode(token);
        connection.query("SELECT * FROM favorite_music WHERE user_id = ?",[userData ? userData.userId : ""],function(err,response){
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
        let {id,albummid,duration,image,localImage="",mid,name,singer,url,userId,lyric="",localUrl,playMode,kugouUrl} = item;
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
                        console.log("response=",response,url,image)
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
    let result = await new Promise((resolve,reject)=>{
        connection.query("DELETE FROM favorite_music WHERE id = ? AND user_id = ?",[item.id,item.userId],(error,response)=>{
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

//获取抖音歌曲列表,请求地地址：/service/music/getDouyinList
router.get("/getDouyinList",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"获取抖音歌曲列表",method:"getDouyinList",oparation:OPARATION.SELECT};//日志记录
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

//修改用户信息,请求地地址：/service/music/updateUser
router.put("/updateUser",async(ctx)=>{
    ctx.state.bodyAttribs = {description:"修改用户信息",method:"updateUser",oparation:OPARATION.UPDATE};//日志记录
    let item = ctx.request.body;
    let updateDate =  getFullTime();//当前时间
    let {username,telephone,email,avater,birthday,sex,role,userId} = item;
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
    let {newPassword,oldPassword,userId} = item;
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
    let token = ctx.cookies.get("token");
    let userData = jsonwebtoken.decode(token);
    if(!userData.userId){
        return  ctx.body = {
            ...FAIL,
            data:null,
            msg:"token无效",
        };
    }
    userData = {...userData};
    let updateDate =  getFullTime();//当前时间
    // 创建可读流
    const reader = fs.createReadStream(file.path);
    let ext = file.name.slice(file.name.lastIndexOf(".")+1);//获取文件后缀
    // 创建可写流
    let filename =  `${userData.userId}_${new Date().getTime()}.${ext}`;
    const upStream = fs.createWriteStream(USER_AVATER_PATH + filename);
    let avater = RELATIVE_AVATER_PATH +  filename;
    // 可读流通过管道写入可写流
    reader.pipe(upStream);
    let result = await new Promise((resolve,reject)=>{
        //向记录表中插入一条播放记录，同时更新抖音歌曲的播放次数
        //https://www.cnblogs.com/hzj680539/p/8032270.html
        //返回的response[0]表示执行第一条sql的结果，response[1]表示执行第一条sql的结果
        connection.query(`
            UPDATE user SET avater = ?, update_date = ? WHERE user_id = ?`,[avater,updateDate,userData.userId],(error,response)=>{
            if(error){
                console.log("错误",error);
                reject(error)
            }else{
                userData.avater = avater;
                let token = jsonwebtoken.sign(userData,SECRET, TOKEN_OPTIONS);
                ctx.cookies.set("token",token,COOKIE_OPTIONS)
                resolve({
                    ...SUCCESS,
                    data:userData,
                    msg:"修改头像成功",
                });
            }
        });
    })
    ctx.body = result
});

module.exports = router;
