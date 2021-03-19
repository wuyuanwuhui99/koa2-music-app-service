const Koa = require("koa");
const Router = require("koa-router");

const music = require("./music");//引入子路由
const musicGetway = require("./music/music-getway");//引入子路由

let router = new Router();
router.use("/music",music.routes());
router.use("/music-getway",musicGetway.routes());
router.get("/",async(ctx)=>{
    ctx.body = "service"
})

module.exports = router;
