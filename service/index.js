const Koa = require("koa");
const Router = require("koa-router");

let music = require("./music");//引入子路由
let router = new Router();

router.use("/music",music.routes());

router.get("/",async(ctx)=>{
    ctx.body = "service"
})

module.exports = router;
