const jsonwebtoken = require("jsonwebtoken");
const {FAIL} = require("../config")
//拦截器
module.exports =  async (ctx,next) => {
    //添加收藏和取消收藏，获取收藏列表需要登录
    let url = ctx.originalUrl
    for(let i = 0; i < allowpage.length; i++){
        if(ctx.originalUrl.indexOf("/music-getway/")!=-1){
            let token = ctx.cookies.get("token");
            if(token){
                var userData = jsonwebtoken.decode(token);
                if(!userData){
                    ctx.status = 403;//返回状态
                    ctx.body = {
                        ...FAIL,
                        msg:"未登录",
                        data:null
                    }
                    return ;
                }

            }else{
                ctx.status = 403;//返回状态
                ctx.body = {
                    ...FAIL,
                    msg:"未登录",
                    data:null
                }
                return ;
            }
        }
    }
    await next()
}
