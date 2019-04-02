const apikey = "01ca1cb3acd6dcf48403d35589b04b35"
const captchaLength = 5

var zlib = require('zlib');
DeathByCaptcha = require("deathbycaptcha");
var dbc = new DeathByCaptcha("creditscore", "credit4vn6789!");
const htmlParser = require('node-html-parser').parse

/*var DomParser = require('dom-parser');
var parser = new DomParser();*/

//request.post({url : requesturl, jar: cookieJar, form: lform}, ...

async function getInfo(cmnd) {
    var request = require('request')//.defaults({ encoding: null });
    var cookieJar = request.jar()
    console.log('begin get info')    
    function sleep(ms){
        return new Promise((resolve, reject)=>{
            setTimeout(() => {
                resolve()
            }, ms);
        })
    }
    function httpRequest(method, options) {
        sleep(2000)
        return new Promise((resolve, reject) => {
            options.jar = cookieJar
            options.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36';
            //options.gzip = true
            options.forever = true
            options.followAllRedirects = true;
            var callback = function (error, response, body) {
                if (error) {
                    reject(error)
                }
                else {
                    resolve(body)
                }
            }
            switch (method) {
                case 'POST':
                    request.post(options, callback)
                    break
                case 'GET':
                    request.get(options, callback)
                    break
            }
        })

    }

    function decompress(data) {
        return new Promise((resolve, reject) => {
            zlib.gunzip(data, function (error, dezippedData) {
                if (error) {
                    reject(error)
                }
                else {
                    resolve(dezippedData.toString('utf-8'))
                }
            })
        })
    }

    const CAPTCHA_LENGTH = 5

    function solveCaptcha(base64Image) {
        return new Promise((resolve, reject) => {
            dbc.solve(base64Image, function (error, id, solution) {
                if (error) {
                    reject(error)
                }
                /*else if (solution.length != CAPTCHA_LENGTH || solution == 'black') {                
                    dbc.report(id, function (err) {
                        if (err) {
                            reject(err)
                        }
                    });
                }*/
                else {
                    resolve({ id: id, solution: solution })
                }
            })
        })
    }
    function reportCaptcha(id) {
        return new Promise((resolve, reject) => {
            dbc.report(id, function (error) {
                if (error) {
                    reject(error)
                }
                else {
                    resolve({ status: 1 })
                }
            })
        })
    }
    var result = null
    var root = null
    var imageLink = null
    function captchaProcess(cmnd) {        
        return new Promise(async (resolve, reject) => {
            try {
                var opts = {
                    uri: 'http://tracuunnt.gdt.gov.vn/tcnnt/mstcn.jsp',
                    headers: {
                        'Accept-Encoding': 'gzip, deflate',
                    },
                    //jar: cookieJar
                    gzip:true
                }

                console.log('first access to page')                
                result = await httpRequest("GET", opts)
                //console.log(result)
                root = htmlParser(result)
                

                //console.log())                
                try{
                    
                    imageLink = "http://tracuunnt.gdt.gov.vn" + root.querySelector('img').attributes.src
                    result = await httpRequest("GET", { 
                        uri: imageLink,
                        headers:{
                            'Accept-Encoding': 'gzip, deflate',
                        },
                        gzip:true,
                        encoding: null
                    })
                    var base64Image = 'base64:' + (new Buffer.from(result)).toString('base64');
                    //console.log(base64Image)
                    const { id, solution } = await solveCaptcha(base64Image)
                    if (id && solution){
                        var strForm = ''
                        root.querySelectorAll('input').forEach(function(item){
                            strForm += item.attributes.name + '=' 
                            if ( item.attributes.name && item.attributes.name.indexOf('captcha') >=0){
                                strForm += solution
                            }
                            else if (item.attributes.name && item.attributes.name.indexOf('cmt') >=0){
                                strForm += cmnd
                            }
                            else strForm += (item.attributes.value ? item.attributes.value:'')
                            strForm += '&'                            
                            
                        })
                        console.log(solution)
                        var form = {
                            id:'',
                            page:'1',
                            action:'action',
                            mst:'',
                            fullname1:'',
                            address:'',
                            cmt:cmnd,
                            captcha:solution
                        }                        

                        result = await httpRequest("POST", {
                            //"method": "POST",
                            uri: "http://tracuunnt.gdt.gov.vn/tcnnt/mstcn.jsp",
                            headers:
                            {
                                'Host': 'tracuunnt.gdt.gov.vn',
                                'Connection': 'keep-alive',
                                'Cache-Control': 'max-age=0',
                                'Origin': 'http://tracuunnt.gdt.gov.vn',
                                'Upgrade-Insecure-Requests': 1,
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                'Referer': 'http://tracuunnt.gdt.gov.vn/tcnnt/mstcn.jsp',
                                'Accept-Encoding': 'gzip, deflate',
                                'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5'

                            },
                            //formData:form,
                            body: strForm,//`id=&page=1&action=action&mst=&fullname1=&address=&cmt=${cmnd}&captcha=${solution}`,
                            gzip:true,
                            
                        })
                        /*var s = result.indexOf('<table class="ta_border">')
                        result = result.substring(s, result.length)
                        var e = result.indexOf('</table>') + '</table>'.length
                        result = result.substring(0,e)*/
                        //console.log(result)
                        root = htmlParser(result)
                        var error = root.querySelector('.css-panes p');
                        if (error && error.text){
                            //it's mean captcha wrong
                            console.log('wrong captcha')
                            await reportCaptcha(id)
                            resolve(captchaProcess(cmnd))
                            //resolve({mst:'', id:id})
                        }
                        else{
                            var noResultAlert = root.querySelectorAll('.ta_border td')
                            //console.log(noResultAlert)
                            console.log(cmnd)                            
                            console.log(noResultAlert.length)
                            /*if (noResultAlert.length == 8){
                                try{
                                    resolve({mst: noResultAlert[1].querySelector('a').text, retry:false})
                                }
                                catch(error){
                                    console.log('structure of the website is changed')
                                    console.log(error)
                                    reject(error)
                                }                                
                            }                            
                            else */if (noResultAlert.length == 1){
                                //console.log(result)
                                resolve({ mst: '', retry: false })
                            }
                            else if (noResultAlert.length == 0){
                                //something worng
                                resolve({retry:true})
                            }
                            else{
                                console.log("extract mst")
                                /*console.log(result)
                                reject(new Error('some thing wrong, noResultAlert.leng = ' + noResultAlert.length))*/
                                var isHaveResult = false;
                                noResultAlert.forEach(element => {
                                    //console.log(element.querySelector('a').text)
                                    if (element.querySelector('a')){                                        
                                        if (element.querySelector('a').text.trim() == cmnd){
                                            isHaveResult = true
                                        }
                                    }
                                });
                                if (isHaveResult){
                                    
                                    
                                    try{
                                        var mstText = noResultAlert[1].querySelector('a').text
                                        console.log("result: ma so thue", mstText)
                                        var formBody = ''
                                        var inputArray  = root.querySelectorAll('input')
                                        inputArray.forEach(item=>{
                                            console.log(item.attributes.name)
                                            if (item.attributes.name){
                                                if (item.attributes.name.indexOf('id') == 0){
                                                    formBody += "&" + item.attributes.name + "=" + mstText
                                                }
                                                else if (item.attributes.name.indexOf('cmt') == 0){
                                                    formBody += "&" + item.attributes.name + "=" + cmnd
                                                }
                                                else if (item.attributes.name.indexOf('action') == 0){
                                                    formBody += "&action=action"
                                                }
                                                else if (item.attributes.name.indexOf('page') == 0){
                                                    formBody += "&page=1"
                                                }
                                                else formBody += "&" + item.attributes.name + "="
                                            }                                            
                                        })
                                        console.log(formBody)
                                        resolve({mst: mstText,formBody:formBody, retry:false})
                                    }
                                    catch(error){
                                        console.log('structure of the website is changed')
                                        console.log(error)
                                        reject(error)
                                    }
                                }
                                else{
                                    console.log(result)
                                    reject(new Error('some thing wrong, noResultAlert.leng = ' + noResultAlert.length))
                                }
                            }
                            //console.log(noResultAlert.text)
                            
                        }
                    }
                    else{
                        console.log('unknown errors from deathbycaptcha server')
                        reject(new Error('unknown errors from deathbycaptcha server'))
                    }
                }
                catch(error){
                    console.log("captcha image not found")
                    console.log(error)
                    reject(error)
                }                
            }
            catch (error) {
                reject(error)
            }


        })
    }
    var mstResult = await captchaProcess(cmnd)
    var mst = mstResult.mst
    if (mstResult.retry){
        while (true){
            //await reportCaptcha(mstResult.id)
            mstResult = await captchaProcess(cmnd)
            mst = mstResult.mst
            if (!mstResult.retry) break
        }
    }
    console.log("ma so thue", mst)
    if (mst) {
        console.log('get details')
        var formBody = mstResult.formBody
        result = await httpRequest("POST", {
            uri: "http://tracuunnt.gdt.gov.vn/tcnnt/mstcn.jsp",
            "headers": {
                "content-type": "application/x-www-form-urlencoded",
                "upgrade-insecure-requests": "1",
                'Accept-Encoding': 'gzip, deflate',
            },
            "body": formBody,
            "method": "POST",
            gzip:true
        })
        root = htmlParser(result) //cai result nay dang rong do anh, anh check cai result tra ve o dau
        var rows = root.querySelectorAll('.ta_border td')
        console.log("rows: details", rows)
        var resultArr = Array(11)
        for (var i = 0; i < 11; i++){
            resultArr[i] = rows[i].text
        }
        console.log(resultArr)
        /*//const detailContent = await decompress(detailResult)
        var sStart = `<table class="ta_border">`
        var iStart = detailContent.indexOf(sStart) + sStart.length
        var iLength = 5000

        var sFirst = detailContent.substr(iStart, iLength)
        //console.log("sfirst", sFirst)

        var iEnd = sFirst.indexOf(`</table>`)
        var sTableHtml = sFirst.substr(0, iEnd).split('<td>')
        
        for (var i = 1; i < sTableHtml.length; i++) {
            resultArr[i - 1] = sTableHtml[i].substr(0, sTableHtml[i].indexOf('</td>'))
        }
        if (resultArr[8]) {
            var tempArr = resultArr[8].split('-').reverse();
            resultArr[8] = tempArr.join('-')
        }*/
        return ({
            status: 1, data: [
                resultArr[0],
                resultArr[1],
                cmnd.length == 9 ? cmnd : '',
                cmnd.length == 12 ? cmnd : '',
                resultArr[3],
                resultArr[4],
                resultArr[5],
                resultArr[6],
                resultArr[7],
                resultArr[8],
                resultArr[9],
                resultArr[10]
            ]
        })
    }
    else {
        return { status: 0 }
    }
}
module.exports = getInfo;