var fs = require('fs')
var ejs = require('ejs')
var url = require('url')
var http = require('http')
var path = require('path')
var express = require('express')
var uglify = require('uglify-js')
var compress = require('compression')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var jsondiffpatch = require('jsondiffpatch').create({
    textDiff: {
        minLength: 256
    }
})
var config = require('../config')
/**
 * JSInspector server and socket server
 * @type {express}
 */
var app = new express()
var server = http.createServer(app)
var io = require('socket.io').listen(server, { log: false })

var tmpDir = config.tmp_dir
!fs.existsSync(tmpDir) && fs.mkdirSync(tmpDir)

/**
 * Enalbe gzip
 */
app.use(compress())

app.get('/*.js', function (req, res, next) {
    var fpath = path.join(__dirname, '../public', '.' + req.path)
    if (!fs.existsSync(fpath)) return res.status(404).send(req.path + ' not found !')

    var sourceCode = fs.readFileSync(fpath, 'utf-8')

    if (req.path == '/inspector.js') sourceCode = ejs.render(sourceCode, {
        serverTime: +new Date
    })
    if (config.enable_mini) {
        res.send(uglify.minify(
            sourceCode, 
            {
                fromString: true,
                mangle: true,
                compress: true
            }
        ).code)
    } else {
        res.send(sourceCode)
    }
})

app.use(express.static(path.join(__dirname, '../public')))

/**
 *  Global CORS
 **/
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : '*')
    res.setHeader('Access-Control-Allow-Methods', 'PUT,POST,HEAD,GET,OPTIONS,PATCH')
    next()
})
app.use(cookieParser())
app.enable('etag')
app.use(require('./routes/inspector'))
app.use(require('./routes/client'))

var clients = {}
app.get('/clients', function (req, res, next) {
    res.send(clients)
})

io.set('log level', 5)

var inspectorSocket = io.of('/inpsector')
var clientSocket = io.of('/client')

inspectorSocket.on('connection', function(socket) {
    socket.on('inspector:input', function(data) {
        clientSocket.emit('client:inject:' + data.id, data.payload)
    })
})

clientSocket.on('connection', function(socket) {

	socket.on('client:init', function (payload) {
        var clientId = payload.cid
        var packetId = payload.pid
        var data = payload.data
        var file = path.join(tmpDir, 'client_' + clientId + '.json')

        // connect session
        clients[clientId] = data.browser

        // save as base document data
        fs.writeFileSync(file, JSON.stringify(data), 'utf-8')
        // tell inspector
        inspectorSocket.emit('server:inspector:' + clientId, data)

        socket.emit('server:answer:init:' + clientId, {
            cid: clientId,
            pid: packetId
        })
    })
    
    socket.on('client:update', function (payload) {
        var clientId = payload.cid
        var packetId = payload.pid
        var data = payload.data
        var file = path.join(tmpDir, 'client_' + clientId + '.json')
        // syncData is used to tell inspector what is happening of client
        var tmpData = fs.readFileSync(file, 'utf-8')
        var syncData

        function fail () {
            socket.emit('server:answer:init:' + clientId, {
                cid: clientId,
                pid: packetId,
                error: { code: 4000, message: 'Base HTML not found!' }
            })
        }
        syncData = JSON.parse(JSON.stringify(data))

        if (tmpData) {
            tmpData = JSON.parse(tmpData)
            // patching html text
            if (data.delta && !data.html && tmpData.html) {

                // full amount release, currently I can't support delta release
                syncData.html = data.html = jsondiffpatch.patch(tmpData.html, data.delta);
                delete data.delta;

            } else if (!data.html && tmpData.html) {
                // match when receive the data packet only the meta
                data.html = tmpData.html;
            } else if (!data.html) {
                return fail()
            }

            // save newest inspect data
            fs.writeFileSync(file, JSON.stringify(data), 'utf-8')

            // tell inspector
            inspectorSocket.emit('server:inspector:' + clientId, syncData)
            socket.emit('server:answer:update:' + clientId, {
                cid: clientId,
                pid: packetId
            })

        } else {
            return fail()
        }

    })
})

module.exports = server



