/**
 *@description 连接redis的方法，get set
 *@author bokolin
 */
const redis = require('redis')
const { REDIS_CONF } = require('../config/redis');
//创建客户端
const redisClient = redis.createClient(REDIS_CONF.port,REDIS_CONF.host)
/**
 * @param {string} key 键
 * @param {string} val 值
 * @param {number} timeout 过期时间 单位s
 */
const set =(key, val, timeout = 60*60*24)=>{
    if(typeof val == 'object'){
        //
        val = JSON.stringify(val)
    }
    redisClient.set(key, val)
    redisClient.expire(key,timeout)
}
/**
 *
 * @param {string} key
 */
const get=(key)=>{
    return new Promise((resolve, reject)=>{
        redisClient.get(key,(err,val)=>{
            if(err) {
                reject(err)
                return
            }
            if(val ==  null) {
                resolve(null)
                return
            }
            try {
                resolve(
                    JSON.parse(val)
                )
            } catch (error) {
                resolve(val)
            }
        })
    })
}

module.exports = {
    set,get
}