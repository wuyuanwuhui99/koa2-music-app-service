const {createProxyMiddleware} = require('http-proxy-middleware');
const koaConnect = require('koa2-connect')
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
    '/static/script': {
        target: 'https://qq.ip138.com/',
        changeOrigin: true
    },
    '/static/style': {
        target: 'https://qq.ip138.com/',
        changeOrigin: true
    },
    '/static/image': {
        target: 'https://qq.ip138.com/',
        changeOrigin: true
    }
}

module.exports = {
    proxyTable,proxy
}