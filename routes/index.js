const router = require('koa-router')()
const service = require("../service/index");
const fs = require("fs");
const path = require("path");

router.get('/', async (ctx, next) => {
  ctx.redirect('/music') 
})
router.use("/service",service.routes());

router.get("/music",async(ctx)=>{
  ctx.body = fs.readFileSync(path.resolve(__dirname,'../public/music/index.html'), 'utf8');
})

module.exports = router
