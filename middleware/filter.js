const jsonwebtoken = require("jsonwebtoken");

//拦截器
module.exports =  async (ctx,next) => {
    //添加收藏和取消收藏，获取收藏列表需要登录
    const allowpage = ['/addFavorite','/getFavorite',"/deleteFavorite","/updateUser"]
    let url = ctx.originalUrl
    for(let i = 0; i < allowpage.length; i++){
        if(ctx.originalUrl.indexOf(allowpage[i])!=-1){
            let token = ctx.cookies.get("token");
            if(token){
                var userData = jsonwebtoken.decode(token);
                if(userData){

                }
                ctx.body = {

                    msg:"未登录"
                }
            }else{
                ctx.body = {
                    msg:"未登录"
                }
                ctx.status = 403;
                return ;
            }
        }
    }
    await next()
}