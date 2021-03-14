const {SECRET} = require("../config");
const jsonwebtoken = require("jsonwebtoken");

module.exports =  async (ctx,next) => {
    if(ctx.originalUrl.includes("/service/music/") && !ctx.originalUrl.includes("/getUserData") &&  !ctx.originalUrl.includes("/logout")){
        await next();
        var token = ctx.cookies.get("token");
        if(token){
            var userData = jsonwebtoken.decode(token);
            token = jsonwebtoken.sign(
                userData ,  // 加密userToken
                SECRET,
            );
            ctx.cookies.set(
                'token',
                token,    //可替换为token
                {
                    // domain: 'localhost',  // 写cookie所在的域名
                    // path: '/',       // 写cookie所在的路径
                    // expires: new Date(startDate.getTime()+  1000 * 60 * 60 * 24 * 365),  // cookie失效时间
                    maxAge: 1000 * 60 * 60 * 24 * 365, // cookie有效时长
                    httpOnly: false,  // 是否只用于http请求中获取
                    overwrite: false  // 是否允许重写
                }
            )
        }

    }else {
        await next();
    }
}