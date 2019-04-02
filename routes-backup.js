const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const getTax = require('./app-tax.js')
var isDataAvai = true

//setup ws server
/*var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({port: 9999})
	wss.on('connection', function (ws) {
		ws.on('message', function (message) {
		console.log('received: %s', message)
	})  
})
*/
//end setup ws server

const conn = mysql.createPool(
{
connectionLimit : 1000,
    connectTimeout  : 60 * 60 * 1000,
    aquireTimeout   : 60 * 60 * 1000,
    timeout         : 60 * 60 * 1000,

	host: process.env.DB_SERVER,
	user: process.env.DB_USER,
	password: process.env.DB_USER_PASSWORD,
	database: process.env.DB_NAME,
	multipleStatements: true
}
)
const processTrackingList = Array(300).fill(0)

var getConnection = function(callback) {
    conn.getConnection(function(err, connection) {
        callback(err, connection);
    });
};
var currentIndex = 0
var dataForUpdate = null
var isGettingData = false
function getDataForUpdate(i){
	return new Promise(function(resolve, reject){
		if (isGettingData || !isDataAvai){
			reject()
		}
		else{
			isGettingData = true
			var sql = 'SELECT cic FROM user_cic_old WHERE status=1 limit 1000000 OFFSET ?;';
			getConnection(function(err,connection){
				if (err){
					console.log(err)
				reject(err)
				}
				else{
					
				connection.query(sql,[i * 1000000], function(err, result){
					if (err){
						reject(err)
					}
					else{
						console.log("get data complete")					
						dataForUpdate = result
						if (result.length < 1000000) isDataAvai = false
						resolve()
					}					
					connection.release()
					isGettingData = false
				})
				}
			})
		}
	})	
}
getDataForUpdate(0)
let CMNDList = []
function getCMND(){
	return new Promise(function(resolve, reject){
			var sql = 'SELECT id as dbid, cmt FROM user_cic_old WHERE status=1 limit 1000000;';
			getConnection(function(err,connection){
				if (err){
					console.log(err)
					reject(err)
				}
				else{					
					connection.query(sql, function(err, result){
						connection.release()
						if (err){
							reject(err)
						}
						else{
							console.log("get cmnd complete")
							CMNDList = result
							//connection.release()
							resolve()
						}																	
					})
				}
			})
		
	})	
}

/*function getNotExistData(i){
	return new Promise(function(resolve, reject){
		if (isGettingData || !isDataAvai){
			reject()
		}
		else{
			isGettingData = true
			var sql = 'SELECT cic FROM user_cic_old limit 1000000 OFFSET ?;';
			getConnection(function(err,connection){
				if (err){
					console.log(err)
				reject(err)
				}
				else{
					
				connection.query(sql,[i * 1000000], function(err, result){
					if (err){
						reject(err)
					}
					else{
						console.log("notExist: get data complete")
						dataForUpdate = result
						if (result.length < 1000000) isDataAvai = false
						resolve()
					}					
					connection.release()
					isGettingData = false
				})
				}
			})
		}
	})	
}*/

//get proxy port list
var proxyList = null
var proxyIndex = 0
function getProxyList(){
	return new Promise(function(resolve, reject){
		var sql = 'SELECT port FROM cic_proxy_ports';
		getConnection(function(err,connection){
			if (err){
				console.log(err)
				reject(err)
			}
			else{
				
			connection.query(sql, function(err, result){
				if (err){
					reject(err)
				}
				else{
					console.log("get proxy list complete")
					proxyList = result
					resolve()
				}					
				connection.release() 
			})
			}
		})
	})	
}
getProxyList()
router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
router.post('/insert', (req, res) => {
  try {
    //console.log("insert to database", req.body)
    var values = Array.from(req.body)
    //console.log(values)
    
    var sql = "INSERT INTO user_cic(name, cic, cmt, address, content, cic_date, phone, status, created_at, updated_at) values ?;";
    /*var values = [
      ['demian', 'demian@gmail.com', 1],
      ['john', 'john@gmail.com', 2],
      ['mark', 'mark@gmail.com', 3],
      ['pete', 'pete@gmail.com', 4]
  ];*/
    conn.query(sql, [values], function (err, result) {

      if (err) {
        console.log(err)
        res.status(200).json({ status: 0, msg: err.message });
      }
      else {
        //res.send("1 record inserted");
        console.log('insert_complete')
        res.status(200).json({ status: 1, numrows: result.affectedRows })

        //
      }
    });
  }
  catch (error) {
    console.log(error)
  }
});
router.post('/update', async (req, res) => {
  try {
	console.log("update")
    
    var values = req.body
    
    let numrows = 0;
	let updateSql = ""
	let dbData = values.dbData
	let processId = parseInt(values.processId)
	processTrackingList[processId]++
	dbData.forEach(function(item){
		updateSql += `UPDATE user_cic_old SET name='${item[0]}', cmt='${item[1]}', address='${item[2]}', content='${item[3]}', cic_date='${item[4]}', phone='${item[5]}', status=${item[6]}, updated_at='${item[7]}', update_status=0 WHERE cic='${item[8]}';`
	})    
    res.status(200).json({ status: 1, numrows: values.length })    
	conn.query(updateSql, function(err, result){
		if (err)
			console.log(err)
		else{
			console.log("process: " + processId + " update result " + result.length)
		}
	})
  }
  catch (error) {

    console.log(error)
    res.status(200).json({ status: 0 })
  }
});
router.get('/viewProcessTracking', async (req, res) => {
  res.status(200).json({ status: 1, processList: processTrackingList })
});

router.post('/reportError', (req, res) => {
  try {
    //console.log("insert to database", req.body)
    var values = req.body
    console.log(values)
    
    var sql = "INSERT INTO error_reprot(message, cic, step) values (?,?,?);";
    conn.query(sql, [values.message, values.cic, values.step], function (err, result) {
      if (err) {
        console.log(err)
        res.status(200).json({ status: 0, msg: err.message });
      }
      else {
        //res.send("1 record inserted");
        res.status(200).json({ status: 1, numrows: result.affectedRows })

        //
      }

    });

  }
  catch (error) {
    console.log(error)
  }
});

router.get('/getTicket', (req, res) => {
  try {
    
    //var sql = "SELECT * FROM cic_crawl_def WHERE status=0 LIMIT 1;";        
    var sql = "SELECT getBlock() as block_index;"
    conn.query(sql, function (err, result) {
      if (err) {
        console.log(err)
        res.status(200).json({ status: 0, msg: err.message });
      }
      else {
        res.status(200).json({ status: 1, ticket: result[0].block_index })
        /*if (result.length > 0){
          const ticket = result[0]
          var updateSql = `UPDATE cic_crawl_def SET status=1 WHERE idcic_crawl_def=${ticket.idcic_crawl_def};`
          conn.query(updateSql, function (err, updateResult){
            if (err) {
              console.log(err)
              res.status(200).json({ status: 0, msg: err.message });
            }
            else{
              res.status(200).json({ status: 1, ticket: ticket.idcic_crawl_def })
              conn.end();
            }
          })              
        } */
        //
      }

    });
  }
  catch (error) {
    console.log(error)
  }
});
let processId = 0;
router.get('/getProxyPort', (req, res) => {	
  try {
	if (proxyList == null || proxyList.length <= 0){
		res.status(200).json({ status: 0})
	}
	else{		
		processId++		
		res.status(200).json({ status: 1, port: proxyList[proxyIndex] , processId:processId})
		console.log(processId)
		console.log(proxyList[proxyIndex])
		proxyIndex++
		if (proxyIndex >= 30) proxyIndex = 0
	}
  }
  catch (error) {
    console.log(error)
  }
});


router.get('/getUpdateList', (req, res) => {
  try {  
	const result = dataForUpdate.splice(0, 500)
		console.log(dataForUpdate.length + " available")
		res.status(200).json({ status: 1, data: result })
	if (!(dataForUpdate && dataForUpdate.length >= 100000) && isDataAvai){		
		currentIndex++
		if (currentIndex > 1) currentIndex = 0
		getDataForUpdate(currentIndex).then(result=>{			
			console.log("get data complete")
		}).catch(error=>{
			console.log("getUpdateList error" + error)
		})
	}
  }
  catch (error) {
    console.log(error)
  }
});

router.get('/getNotExistList', (req, res) => {
  try {  
	const result = dataForUpdate.splice(0, 500)
		console.log(dataForUpdate.length + " available")
		res.status(200).json({ status: 1, data: result })
	if (!(dataForUpdate && dataForUpdate.length >= 100000) && isDataAvai){		
		currentIndex++
		if (currentIndex > 1) currentIndex = 0
		getDataForUpdate(currentIndex).then(result=>{			
			console.log("get data complete")
		}).catch(error=>{
			console.log("getUpdateList error" + error)
		})
	}
  }
  catch (error) {
    console.log(error)
  }
});

router.post('/releaseTicket', (req, res) => {
  try {
    const data = req.body
    if (data && data.ticket) {
      console.log(data)
      
      var sql = `UPDATE cic_crawl_def SET status=0 WHERE idcic_crawl_def=${data.ticket};`;
      conn.query(sql, function (err, result) {
        if (err) {
          console.log(err)
          res.status(200).json({ status: 0, msg: err.message });
        }
        else {
          res.status(200).json({ status: 1 })
          //
        }
      });
    }
    else {
      res.status(200).json({ status: 0 });
    }

    //res.status(200).json({ a: 1, b: 0 });
  }
  catch (error) {
    console.log(error)
  }
});

router.get('/resetTicket', (req, res) => {
  try {
    
    var updateSql = `UPDATE cic_crawl_def SET status=0;`
    conn.query(updateSql, function (err, updateResult) {
      if (err) {
        console.log(err)
        res.status(200).json({ status: 0, msg: err.message });
      }
      else {
        res.status(200).json({ status: 1 })
      }
    })
  }
  catch (error) {
    console.log(error)
  }
});
//var uniqid = require('uniqid');
function IDGenerator() {
	 
  this.length = 8;
  this.timestamp = +new Date;
  
  var _getRandomInt = function( min, max ) {
   return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
  }
  
  this.generate = function() {
    var ts = this.timestamp.toString();
    var parts = ts.split( "" ).reverse();
    var id = "";
    
    for( var i = 0; i < this.length; ++i ) {
     var index = _getRandomInt( 0, parts.length - 1 );
     id += parts[index];	 
    }
    
    return id;
  }

  
}
var jobs =[]//Array(500).fill(0)
var processingJobs = []//Array(500).fill(0)
var finishedJobs = []//Array(500).fill(0)
var cicStatus = 0
var s37Status = 0
var isCicServerError = false
router.get('/getCicInfo', (req, res) => {
  try {
    var cmnd = req.query['cmnd']
	var generator = new IDGenerator();
    var id = generator.generate()
    var newJob = {}
    newJob.id = id
    newJob.cmnd = cmnd
	newJob.status = ''
	newJob.tryCount = 0
	var pos = jobs.push(newJob)
	
	var waitResultInterval = setInterval(function(){
		if (jobs[pos-1].status == 'finished' || isCicServerError){
			clearInterval(waitResultInterval)
			if (!jobs[pos-1].code) jobs[pos-1].code = 500
			if (jobs[pos-1].code == 500){
				jobs[pos-1].status = 'Hệ thống Đang có lỗi, bạn vui lòng thử lại'
			}
			else if (jobs[pos-1].code == 202){
				jobs[pos-1].status = 'Không có dữ liệu nào thỏa mãn điều kiện tìm kiếm'
			}
			res.status(jobs[pos-1].code).json(jobs[pos-1]);
			
		}
	}, 500)    
  }
  catch (error) {
    console.log(error)
    res.status(200).json({ status: 0});    
  }
});
router.get('/getCommand', (req, res) => {
  try {
    if (jobs.length && cicStatus == 1 && s37Status == 1){
		var isFound = false
		for (var i = 0; i < jobs.length; i++){
			if (jobs[i].status == ''){
				isFound = true
				jobs[i].status = 'processing'
				res.status(200).json({ status: 1, job: jobs[i] });
				break;
			}
		}
		if (!isFound){
			res.status(200).json({ status: 0});
		}
    }
    else{
      res.status(200).json({ status: 0});
    }
  }
  catch (error) {
    console.log(error)
  }
});

router.post('/rollbackCommand', (req, res) => {
  try {
	const job = req.body
    
	var isFound = false
	if (job.isReload == true){
		s37Status = 0
		cicStatus = 0
	}
	for (var i = 0; i < jobs.length; i++){
		if (jobs[i].id == job.id){
			isFound = true
			jobs[i].status = ''
			/*jobs[i].tryCount++
			if (jobs[i].tryCount >= 2){
				jobs[i].status = 'finished'
			}*/
			break;
		}
	}
	if (!isFound){
		res.status(200).json({ status: 0});	
    }
    else{
      res.status(200).json({ status: 0});
    }
  }
  catch (error) {
    console.log(error)
  }
});

router.get('/cicServerError', (req, res) => {
  try {
	isCicServerError = true
	res.status(200).json({ status: 1});	
  }
  catch (error) {
    console.log(error)
  }
});
router.get('/cicServerNotError', (req, res) => {
  try {
	isCicServerError = false
	res.status(200).json({ status: 1});	
  }
  catch (error) {
    console.log(error)
  }
});

router.get('/doTestCMND', (req, res) => {
  try {	
	getCMND().then(function(){		
		for (var i = 0; i < CMNDList.length; i++){
			jobs.push({id:i,dbid:CMNDList[i].dbid, cmnd:CMNDList[i].cmt,status:'',tryCount:0})
			
						
		}
		res.status(200).json({ status: 1, jobs:jobs});	
	})
	
  }
  catch (error) {
    console.log(error)
	res.status(200).json({ status: 0});	
  }
});

var countSaveCic = 0
var saveCicQuery = ''

function saveCicToDB(job){
	return new Promise(function(resolve, reject){		
		var sql = "INSERT INTO user_cic(name, cmt, address, content, cic_date, phone, status, updated_at, cic) values ? ON DUPLICATE KEY UPDATE name=VALUES(name), cic=VALUES(cic),cmt=VALUES(cmt),address=VALUES(address),content=VALUES(content),cic_date=VALUES(cic_date),phone=VALUES(phone),status=VALUES(status),updated_at=VALUES(updated_at);";
		getConnection(function(err,connection){			
			if (err){			
				console.log("get connection error")
				reject(err)
			}
			else{
				connection.query(query, [[job.detail]], function(err, result){
					connection.release();
					if (err){						
						console.log('query error')
						reject(err)
					}
					else{						
						resolve()
					}
				})
			}
		})
	})	
}
var buffQuery = ''
router.post('/saveCicDetail', (req, res) => {
  try {
	//console.log(req.body)
    const job = req.body
	var isFound = false
	for (var i=0; i < jobs.length; i++){
		if (jobs[i].id == job.id){
			jobs[i] = job
			jobs[i].status = 'finished'
			isFound = true
			/*if (job.cic && job.name && job.cmnd){
				saveCicQuery = saveCicQuery + `UPDATE user_cic_old SET cic='${job.cic}', name='${escape(job.name)}', address='${escape(job.address)}', content='${escape(job.content)}', cic_date='${escape(job.cicDate)}', phone='${escape(job.phone)}', status=0 WHERE id='${job.dbid}';`;
				countSaveCic++;
				
			}*/			
			if (job.detail && job.detail.length == 9){  // length of job.detail equal exactly 9
				saveCicToDB(job)
			}
			break;
		}
	}
	/*if (countSaveCic > 100) {					
		buffQuery = saveCicQuery
		saveCicQuery = ''
		countSaveCic = 0
		console.log(buffQuery)
		saveCicToDB(buffQuery)
	}*/
	if (isFound){
		res.status(200).json({ status: 1});
	}
	else{
		res.status(200).json({ status: 0});
	}
  }
  catch (error) {
    console.log(error)
  }
});
router.post('/sendS37State', (req, res) => {
	console.log(req.body)
  try {	
    s37Status = req.body.status
    res.status(200).json({ status: 1, cicStatus:cicStatus, s37Status:s37Status});
  }
  catch (error) {
    console.log(error)
  }
});
router.post('/sendGetCicState', (req, res) => {
	console.log(req.body)
  try {	
    cicStatus = req.body.status
    res.status(200).json({ status: 1, cicStatus:cicStatus, s37Status:s37Status});
  }
  catch (error) {
    console.log(error)
  }
});
var blockIndex = 0
router.get('/getAllBlocks', (req, res) => {	
  try {
	var blockQuery = "SELECT MAX(cic) as maxCic, MIN(cic) as minCic from user_cic_old WHERE CAST(cic AS UNSIGNED) < 140000000 and CAST(cic AS UNSIGNED) > 130000000 LIMIT 1;"
	
	
	conn.query(blockQuery, function(err1, result1){
		console.log("finish")
		if (err1){
			console.log(err1)					
			res.status(200).json({ status: 0, error:err1});
		}
		else{
			console.log(result1)					
			res.status(200).json({ status: 1, block:result1});
		}				
	})			
  }
  catch (error) {
    console.log(error)
  }
});

router.get('/saveTaxInfo', (req, res) => {	
  try {
	  console.log(req)
	var cmnd = req.query.cmnd
	console.log(cmnd)
getTax(cmnd).then(result=>{
	console.log(result)
	if (result.error && result.error == 'result not found'){
		conn.query('INSERT INTO user_tax(cmnd, cccd) values (?);', [[result.cmnd, result.cccd]], function(err, result){
			if (err){
				console.log(err)
				res.status(200).json({ status: 0, error:err});
			}
			else{
				//console.log(result)					
				res.status(200).json({ status: 1, block:result});
			}	
		})
	}
	else{
		conn.query('INSERT INTO user_tax(mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes) values (?);', [result], function(err, result){
			if (err){
				console.log(err)
				res.status(200).json({ status: 0, error:err});
			}
			else{
				//console.log(result)					
				res.status(200).json({ status: 1, block:result});
			}	
		})
	}
})    
    
  }
  catch (error) {
    console.log(error)
  }
});



module.exports = router;
