const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const index = require('./routes/index')
const users = require('./routes/users')
const session = require("koa-session");
const log = require("./middleware/log");
const {createProxyMiddleware} = require('http-proxy-middleware')
const koaConnect = require('koa2-connect')
const setCookie = require("./middleware/setCookie");
const filter = require("./middleware/filter");

// 代理兼容封装
const proxy = function (context, options) {
  if (typeof options === 'string') {
    options = {
      target: options
    }
  }
  return async function (ctx, next) {
    await koaConnect(createProxyMiddleware(context, options))(ctx, next)
  }
}

// 代理配置
const proxyTable = {
  '/static': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}

Object.keys(proxyTable).map(context => {
  const options = proxyTable[context]
  // 使用代理
  app.use(proxy(context, options))
})

onerror(app)
app.use(log);//日志记录
app.use(setCookie);//设置cookie
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))
app.use(views(__dirname + '/views', {
  extension: 'pug'
}));
app.use(filter);

const CONFIG = {
  key:"koa:sess",
  maxAge:1000*60*60*24*265,
  overwrite:true,
  httpOnly:true,
  signed:false,
  rolling:true,
  renew:false
}
app.use(session(CONFIG, app));

//session拦截
app.use(async (ctx, next) => {
  //添加收藏和取消收藏，获取收藏列表需要登录
  const allowpage = ['/addFavorite','/getFavorite',"/deleteFavorite"]
  let url = ctx.originalUrl
  for(let i = 0; i < allowpage.length; i++){
    if(ctx.originalUrl.indexOf(allowpage[i])!=-1){
      // if(!ctx.session.userId){//登录判断
      //   ctx.body = {
      //     msg:"未登录"
      //   }
      //   ctx.status = 403;
      //   return;
      // }
      let token = ctx.cookies.get("token");
      if(token){

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
})

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
