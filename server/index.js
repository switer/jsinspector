var fs = require('fs')
var ejs = require('ejs')
var url = require('url')
var http = require('http')
var path = require('path')
var express = require('express')
var compress = require('compression')
var bodyParser = require('body-parser')
var jsondiffpatch = require('jsondiffpatch').create({
    textDiff: {
        minLength: 256
    }
})
/**
 * JSInspector server and socket server
 * @type {express}
 */
var app = new express()
var server = http.createServer(app)
var io = require('socket.io').listen(server)

var tmpDir = './.tmp'
!fs.existsSync(tmpDir) && fs.mkdirSync(tmpDir)

/**
 * Enalbe gzip
 */
app.use(compress())
app.use(express.static(path.join(__dirname, '../public')))

/**
 *  Global CORS
 **/
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : '*')
    res.setHeader('Access-Control-Allow-Methods', 'PUT,POST,HEAD,GET,OPTIONS,PATCH')
    next()
})

app.use()