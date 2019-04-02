const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const getTax = require('./app-tax.js')
router.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });
const conn = mysql.createPool(
	{
		connectionLimit: 1000,
		connectTimeout: 60 * 60 * 1000,
		aquireTimeout: 60 * 60 * 1000,
		timeout: 60 * 60 * 1000,

		host: process.env.DB_SERVER,
		user: process.env.DB_USER,
		password: process.env.DB_USER_PASSWORD,
		database: process.env.DB_NAME,
		multipleStatements: true
	}
)

var getConnection = function (callback) {
	conn.getConnection(function (err, connection) {
		callback(err, connection);
	});
};
function dbQuery(sql, values){
	return new Promise((resolve, reject)=>{
		getConnection(function(err, connection){
			if (err){
				reject(err)
			}
			else{
				connection.query(sql, values, function(error, result){
					if (error){
						reject(error)
					}
					else{
						resolve(result)
					}
				})
			}
		})
	})
}
function IDGenerator() {

	this.length = 8;
	this.timestamp = +new Date;

	var _getRandomInt = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	this.generate = function () {
		var ts = this.timestamp.toString();
		var parts = ts.split("").reverse();
		var id = "";

		for (var i = 0; i < this.length; ++i) {
			var index = _getRandomInt(0, parts.length - 1);
			id += parts[index];
		}

		return id;
	}

}
router.get('/test', async (req, res) => {
	const result = await getTax(req.query.cmnd)
	res.status(200).json({status:1})
})
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

var taxJob = []
router.get('/saveTaxInfo', async (req, res) => {
	try {
		//console.log(req)
		var cmnd = req.query.cmnd
		if (!cmnd || (cmnd.length != 9 && cmnd.length != 12)){
			res.status(200).json({ status: 0, error: "cmnd is incorrect!" });
			return;
		}
		const currentIndex = taxJob.push({cmnd:cmnd, status: 0})		
		console.log(currentIndex)
		var result = false
		res.status(200).json({})
		/*while(!result){
			if (taxJob[currentIndex].status == 1){
				res.status(200).json(taxJob[currentIndex].response)
				result = true
			}
			await sleep(1000)
		}*/
	}
	catch (error) {
		console.log(error)
	}
});
var currentJob = null
async function doJob(){
	try{
		if (taxJob.length){
			currentJob = null
			for (var i = 0; i < taxJob.length; i++){
				if (taxJob[i].status == 0){
					currentJob = taxJob[i]
					break;
				}
			}
			if (currentJob){
				var cmnd = currentJob.cmnd
				const dbDetails = await dbQuery('SELECT mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes FROM user_tax WHERE cmnd=? and DATEDIFF(updated_at, DATE(NOW())) <= 30 LIMIT 1;', cmnd)
				console.log(dbDetails)
				if (dbDetails.length == 1){
					//res.status(200).json({ status: 1, data:dbDetails});
					taxJob.forEach(function(item){
						if (item.cmnd == currentJob.cmnd){
							item.response = {status:1, data:dbDetails}
							item.status = 1
							return
						}
					})
				}
				else{
					const details = await getTax(cmnd)
					const {status, data = null } = details
					console.log(details)
					if (status == 1){
						
						const saveResult = await dbQuery('INSERT INTO user_tax(mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes) values (?) ON DUPLICATE KEY UPDATE mst=VALUES(mst),name=VALUES(name),cccd=VALUES(cccd),place_registed=VALUES(place_registed),address=VALUES(address),city=VALUES(city),province=VALUES(province),phone=VALUES(phone),created_date=VALUES(created_date),closed_date=VALUES(closed_date),notes=VALUES(notes);', [data])
						console.log(saveResult)
						const logResult = await dbQuery('INSERT INTO log_tax(mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes) values (?);', [data])
						console.log(logResult)
						/*res.status(200).json({ status: 1, data:[{
							"mst":data[0],
							"name":data[1],
							"cmnd":data[2],
							"cccd":data[3],
							"place_registed":data[4],
							"address":data[5],
							"city":data[6],
							"province":data[7],
							"phone":data[8],
							"created_date":data[9],
							"closed_date":data[10],
							"notes":data[11]
						}]});			*/
						taxJob.forEach(function(item){
							if (item.cmnd == currentJob.cmnd){
								item.response = { status: 1, data:[{
									"mst":data[0],
									"name":data[1],
									"cmnd":data[2],
									"cccd":data[3],
									"place_registed":data[4],
									"address":data[5],
									"city":data[6],
									"province":data[7],
									"phone":data[8],
									"created_date":data[9],
									"closed_date":data[10],
									"notes":data[11]
								}]}
								item.status = 1
								return
							}
						})
					}
					else{
						const dbCmnd = cmnd.length == 9 ? cmnd:''
						const dbCccd = cmnd.length == 12 ? cmnd:''				
						const saveResult = await dbQuery('INSERT INTO user_tax(cmnd, cccd) values (?) ON DUPLICATE KEY UPDATE cmnd=VALUES(cmnd), cccd=VALUES(cccd);', [[dbCmnd,dbCccd]])
						const logResult = await dbQuery('INSERT INTO log_tax(cmnd, cccd) values (?);', [[dbCmnd,dbCccd]])
						taxJob.forEach(function(item){
							if (item.cmnd == currentJob.cmnd){
								item.response = { status: 1,data:[{
									"cmnd":dbCmnd,
									"cccd":dbCccd,
									"mst":null,
									"name":null,
									"cmnd":null,
									"cccd":null,
									"place_registed":null,
									"address":null,
									"city":null,
									"province":null,
									"phone":null,
									"created_date":null,
									"closed_date":null,
									"notes":null
								}]}
								item.status = 1
								return
							}
						})
						/*res.status(200).json({ status: 1,data:[{
							"cmnd":dbCmnd,
							"cccd":dbCccd,
							"mst":null,
							"name":null,
							"cmnd":null,
							"cccd":null,
							"place_registed":null,
							"address":null,
							"city":null,
							"province":null,
							"phone":null,
							"created_date":null,
							"closed_date":null,
							"notes":null
						}]});*/
					}
				}
			}
			
		}
	}
	catch(error){
		console.log(error)
	}
	
	setTimeout(() => {
		doJob()		
	}, 500);
}

doJob()

module.exports = router;
