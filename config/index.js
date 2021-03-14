module.exports = {
    SECRET:"wuwenqiang",//秘钥
    ERR_OK: 0,
    FAIL:{status:"fail"},//失败的状态
    SUCCESS:{status:"success"},//成功的状态
    OPARATION:{
        INSERT:"insert",
        DELETE:"delete",
        UPDATE:"update",
        SELECT:"select",
        UPLOAD:"upload",
        LOGIN:"login",
        LOGOUT:"logout"
    },
    APPID:"com.koa.music",
    APPNAME:"在线音乐播放器",
    USER_AVATER_PATH:"E:\\static\\music\\images\\avater\\user\\",//用户头像存放地址
    RELATIVE_AVATER_PATH:"/static/music/images/avater/user/",//头像文件目录
    INIT_TOKEN_OPTIONS:{ expiresIn:  60 * 60 * 24 * 30,algorithm: 'HS256'},//初始化token加密配置
    TOKEN_OPTIONS:{algorithm: 'HS256'},//token加密配置
    COOKIE_OPTIONS:{
        // domain: 'localhost',  // 写cookie所在的域名
        // path: '/',       // 写cookie所在的路径
        // expires: new Date(startDate.getTime()+  1000 * 60 * 60 * 24 * 365),  // cookie失效时间
        maxAge: 0, // cookie有效时长
        httpOnly: false,  // 是否只用于http请求中获取
        overwrite: false  // 是否允许重写
    }
}