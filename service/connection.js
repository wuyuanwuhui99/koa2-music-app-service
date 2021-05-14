var mysql=require("mysql");
var pool = mysql.createPool({
    host: '192.168.0.103',
    user:'root',
    password:'wwq_2021',
    database:'play',
    multipleStatements: true
});


var query=function(sql,options,callback){

  pool.getConnection(function(err,conn){
      if(err){
          if(callback)callback(err,null,null);
      }else{
          conn.query(sql,options,function(err,results,fields){
              //事件驱动回调
              callback(err,results,fields);
          });
          //释放连接，需要注意的是连接释放需要在此处释放，而不是在查询回调里面释放
          conn.release();
      }
  });
};

exports.query = query;

exports.fail = {status:"fail"};

exports.success = {status:"success"};
