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
function dbQuery(sql, values) {
	return new Promise((resolve, reject) => {
		getConnection(function (err, connection) {
			if (err) {
				reject(err)
			}
			else {
				connection.query(sql, values, function (error, result) {
					if (error) {
						reject(error)
					}
					else {
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
	res.status(200).json({ status: 1 })
})
router.get('/saveTaxInfo', async (req, res) => {
	try {
		//console.log(req)
		var cmnd = req.query.cmnd
		if (!cmnd || (cmnd.length != 9 && cmnd.length != 12)) {
			res.status(200).json({ status: 0, error: "cmnd is incorrect!" });
			return;
		}
		const dbDetails = await dbQuery('SELECT mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes FROM user_tax WHERE cmnd=? and DATEDIFF(updated_at, DATE(NOW())) <= 30 LIMIT 1;', cmnd)
		console.log(dbDetails)
		if (dbDetails.length == 1) {
			if (dbDetails[0].mst) {
				res.status(200).json({ status: 1, data: dbDetails });
				return
			}
		}
		try {
			const details = await getTax(cmnd)
			const { status, data = null } = details
			console.log(details)
			if (status == 1) {

				const saveResult = await dbQuery('INSERT INTO user_tax(mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes) values (?) ON DUPLICATE KEY UPDATE mst=VALUES(mst),name=VALUES(name),cmnd=VALUES(cmnd),cccd=VALUES(cccd),place_registed=VALUES(place_registed),address=VALUES(address),city=VALUES(city),province=VALUES(province),phone=VALUES(phone),created_date=VALUES(created_date),closed_date=VALUES(closed_date),notes=VALUES(notes);', [data])
				console.log(saveResult)
				const logResult = await dbQuery('INSERT INTO log_tax(mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes) values (?);', [data])
				console.log(logResult)
				res.status(200).json({
					status: 1, data: [{
						"mst": data[0],
						"name": data[1],
						"cmnd": data[2],
						"cccd": data[3],
						"place_registed": data[4],
						"address": data[5],
						"city": data[6],
						"province": data[7],
						"phone": data[8],
						"created_date": data[9],
						"closed_date": data[10],
						"notes": data[11]
					}]
				});
			}
			else {
				const dbCmnd = cmnd.length == 9 ? cmnd : ''
				const dbCccd = cmnd.length == 12 ? cmnd : ''
				const saveResult = await dbQuery('INSERT INTO user_tax(cmnd, cccd) values (?) ON DUPLICATE KEY UPDATE cmnd=VALUES(cmnd), cccd=VALUES(cccd);', [[dbCmnd, dbCccd]])
				const logResult = await dbQuery('INSERT INTO log_tax(cmnd, cccd) values (?);', [[dbCmnd, dbCccd]])
				res.status(200).json({
					status: 1, data: [{
						"mst": null,
						"name": null,
						"cmnd": dbCmnd,
						"cccd": dbCccd,
						"place_registed": null,
						"address": null,
						"city": null,
						"province": null,
						"phone": null,
						"created_date": null,
						"closed_date": null,
						"notes": null
					}]
				});
			}
		}
		catch (error) {
			console.log(error)
		}


		return;
		console.log(cmnd)
		getConnection(function (err, connection) {
			connection.query('SELECT mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes FROM user_tax WHERE cmnd=? and DATEDIFF(updated_at, DATE(NOW())) <= 30 LIMIT 1;', cmnd, function (err, result) {
				if (err) {
					res.status(200).json({ status: 0, error: err })
				}
				else {
					console.log(result)
					if (result.length != 1) {
						getTax(cmnd).then(result => {
							console.log(result)
							var data = result
							if (result.error && result.error == 'result not found') {
								res.status(200).json({
									status: 1, data: [{
										"cmnd": cmnd.length == 9 ? cmnd : '',
										"cccd": cmnd.length == 12 ? cmnd : '',
										"mst": null,
										"name": null,
										"place_registed": null,
										"address": null,
										"city": null,
										"province": null,
										"phone": null,
										"created_date": null,
										"closed_date": null,
										"notes": null
									}]
								});
								conn.query('INSERT INTO user_tax(cmnd, cccd) values (?) ON DUPLICATE KEY UPDATE cmnd=VALUES(cmnd), cccd=VALUES(cccd);', [[result.cmnd, result.cccd]], function (err, result) {
									if (err) {
										console.log('save error: ', err)
										res.status(200).json({ status: 0, error: err });
									}
									else {
										console.log('save result: ', result)
									}
								})
								conn.query('INSERT INTO log_tax(cmnd, cccd) values (?);', [[result.cmnd, result.cccd]], function (err, result) {
									if (err) {
										console.log('log error: ', err)
									}
									else {
										console.log('log result: ', result)
									}
								})
							}
							else if (result.error) {
								res.status(200).json({ status: 0, error: result.error });
							}
							else {
								res.status(200).json({
									status: 1, saveStatus: result, data: [{
										"mst": data[0],
										"name": data[1],
										"cmnd": data[2],
										"cccd": data[3],
										"place_registed": data[4],
										"address": data[5],
										"city": data[6],
										"province": data[7],
										"phone": data[8],
										"created_date": data[9],
										"closed_date": data[10],
										"notes": data[11]
									}]
								});
								conn.query('INSERT INTO user_tax(mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes) values (?) ON DUPLICATE KEY UPDATE mst=VALUES(mst),name=VALUES(name),cccd=VALUES(cccd),place_registed=VALUES(place_registed),address=VALUES(address),city=VALUES(city),province=VALUES(province),phone=VALUES(phone),created_date=VALUES(created_date),closed_date=VALUES(closed_date),notes=VALUES(notes);', [result], function (err, result) {
									if (err) {
										console.log(err)
										res.status(200).json({ status: 0, error: err });
									}
									else {
										console.log(result)

									}
								})
								conn.query('INSERT INTO log_tax(mst, name, cmnd, cccd, place_registed, address, city, province, phone, created_date, closed_date, notes) values (?);', [result], function (err, result) {
									if (err) {
										console.log("log error", err)
									}
									else {
										console.log("log result: ", result)
									}
								})
							}
						})
					}
					else {
						res.status(200).json({ status: 1, data: result });
					}
				}
			})

		})
		/**/

	}
	catch (error) {
		console.log(error)
	}
});

router.get('/getCicInfo', async (req, res) => {
	try {

		var cmnd = req.query['cmnd']
		
		 console.log('cmnd la: ',cmnd)
		 if (cmnd) {
		 	var sql = 'SELECT cic, name, cmt, address, content, cic_date, phone, created_at FROM user_cic_old where cmt=? LIMIT 1;'
		 	const [result] = await dbQuery(sql, cmnd);
		 	if (result) {
		 		Object.keys(result).forEach(function (item) {
		 			result[item] = unescape(result[item])
		 		})
		 		res.status(200).json(result);
		 	}
		 	else {
				// var isCicServerError = false
				// var generator = new IDGenerator();
				// var id = generator.generate()
				// var newJob = {}
				// 	var jobs = []
				// 	newJob.id = id
				// 	newJob.cmnd = cmnd
				// 	newJob.status = ''
				// 	newJob.tryCount = 0
				// 	var pos = jobs.push(newJob)
					
				// 	var waitResultInterval = setInterval(function(){
				// 		console.log(jobs[pos-1].status)
				// 		if (jobs[pos-1].status == 'finished' || isCicServerError){
				// 			clearInterval(waitResultInterval)
				// 			if (!jobs[pos-1].code) jobs[pos-1].code = 500
		
				// 			if (jobs[pos-1].code == 500){
				// 				jobs[pos-1].status = 'Hệ thống Đang có lỗi, bạn vui lòng thử lại'
				// 			}
				// 			else if (jobs[pos-1].code == 202){
				// 				jobs[pos-1].status = 'Không có dữ liệu nào thỏa mãn điều kiện tìm kiếm'
				// 			}
		
				// 			res.status(jobs[pos-1].code).json(jobs[pos-1]);
							
				// 		}else{
				// 			console.log('nothing happen')
				// 		}
				// 	}, 500)			
		 		res.status(202).json({ status: 'Không có dữ liệu nào thỏa mãn điều kiện tìm kiếm' });
		 	}
		 }
		 else {
		 	res.status(200).json({ status: 0 });
		 }		

		
	}
		catch (error) {
			console.log(error)
			res.status(200).json({ status: 0 });
		}
	});

	module.exports = router;
