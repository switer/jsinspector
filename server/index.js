var express = require('express')
var fs = require('fs')
var ejs = require('ejs')
var url = require('url')
var http = require('http')
var path = require('path')
var compress = require('compression')
var bodyParser = require('body-parser')
var rawBody = require('./middleware/rawbody')
var clientIdParser = require('./middleware/clientid-parser')
var clientDir = '../public/client/'
var app = new express()
var server = http.createServer(app)
var io = require('socket.io').listen(server)
var jsondiffpatch = require('jsondiffpatch').create({
    textDiff: {
        minLength: 60
    }
})
/**
 * Memory Session
 */
var session = {}
/**
 *  uitl functions
 **/
function readFile(path) {
    if (fs.existsSync(path)) {
        return fs.readFileSync(path, 'utf-8');
    } else {
        return '';
    }
}

/**
 *  initialize
 **/
if (!fs.existsSync('./tmp')) {
    fs.mkdirSync('./tmp');
}
app.use(compress());
/**
 *  Global CORS
 **/
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT,POST,HEAD,GET,OPTIONS,PATCH');
    next();
})
app.use(express.static(__dirname + '/../public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

/**
 *  Get inpsector form url
 **/

/* =================================================================== */
/**
 *  Client routes
 **/
app.get('/inspector', clientIdParser, function(req, res) {
    var script = readFile(path.join(clientDir, 'script.js'), 'utf-8'),
        jsonify = readFile(path.join(clientDir, 'jsonify.js'), 'utf-8'),
        consoleJS = readFile(path.join(clientDir, 'console.js'), 'utf-8'),
        inject = readFile(path.join(clientDir, 'inject.js'), 'utf-8')

    res.setHeader('Content-Type', 'application/javascript');

    var host = 'http://' + req.headers.host
    res.send(ejs.render(script, {
        host: host,
        inspectorId: req.inspectorId,
        jsonify: jsonify,
        console: consoleJS,
        inject: ejs.render(inject, {
            host: host,
            inspectorId: req.inspectorId
        })
    }));
});
/**
 *  Use for client CORS prox
 **/
app.get('/src', function(req, res) {
    var srcUrl = req.query.url.replace(/"/g, '');
    if (!srcUrl) {
        // Bad Request
        res.status(400).send('Uncorrect source url, example: /src?url=xxx');
        return;
    }
    http.get(srcUrl, function(resp) {
        resp.on('data', function(data) {
            res.write(data);
        });
        resp.on('end', function() {
            res.end();
        });
    }).on('error', function(e) {
        res.status(500).send(e.message);
    });
});
/**
 *  Client document upload API
 **/
app.post('/html/init', clientIdParser, rawBody, function(req, res) {
    var content = req.rawBody,
        updatedData = JSON.parse(content);

    // record in session
    session[req.inspectorId] = updatedData.ssid;
    /**
     *  save
     **/
    fs.writeFileSync('tmp/inspector_html_' + req.inspectorId + '.json', content, 'utf-8');
    io.sockets.emit('inspected:html:update:' + req.inspectorId, content);
    res.status(200).send('ok');
});

app.post('/html/delta', clientIdParser, rawBody, function(req, res) {
    var content = req.rawBody,
        updatedData = JSON.parse(content), // currently upload data
        lastTmpData, // last time update data
        syncData; // sync the data for devtool

    /**
     *  one inspectorId match one session
     **/
    if (updatedData.ssid != session[req.inspectorId]) {
        res.status(400).send('Session is out of date, please reload!')
        return;
    }
    /**
     *  @html {String}
     *  @delta {TextDelta}
     *  @meta {Object}
     **/
    lastTmpData = fs.readFileSync('tmp/inspector_html_' + req.inspectorId + '.json', 'utf-8');
    lastTmpData = JSON.parse(lastTmpData);
    syncData = JSON.parse(content);

    // patching html text
    if (updatedData.delta && !updatedData.html && lastTmpData.html) {

        // full amount release, currently I can't support delta release
        updatedData.html = jsondiffpatch.patch(lastTmpData.html, updatedData.delta);
        syncData.html = updatedData.html;
        delete syncData.delta;

    } else if (!updatedData.html && lastTmpData.html) {
        // match when receive the data packet only the meta
        updatedData.html = lastTmpData.html;
    }

    syncData = JSON.stringify(syncData);
    updatedData = JSON.stringify(updatedData);

    /**
     *  save
     **/
    fs.writeFileSync('tmp/inspector_html_' + req.inspectorId + '.json', updatedData, 'utf-8');
    /**
     *  devtools sync
     **/
    inspectorSocket.emit('inspected:html:update:' + req.inspectorId, syncData);

    res.send('ok');
});

/**
 *  Inspctor routes
 **/
app.get('/devtools', clientIdParser, function(req, res, next) {
    if (!req.inspectorId) {
        res.redirect('/');
        return;
    }
    var html = fs.readFileSync('./public/devtools/devtools.html', 'utf-8'),
        script = fs.readFileSync('./public/devtools/devtools.js', 'utf-8'),
        host = req.headers.host;

    script = ejs.render(script, {
        host: host.match(/^http\:/) ? host : 'http://' + host,
        inspectorId: req.inspectorId
    });
    res.send(ejs.render(html, {
        devtools: script
    }));
});
app.get('/devtools/init', clientIdParser, function(req, res) {
    var file = readFile('tmp/inspector_html_' + req.inspectorId + '.json');
    if (file) {
        res.send(file);
    } else {
        res.status(404).send('Please inject the script to your code !')
    }
});

module.exports = server

/* Socket.io */
io.set('log level', 1);
var inspectorSocket = io.of('/inpsector')
var clientSocket = io.of('/client')
inspectorSocket.on('connection', function(socket) {
    socket.on('inspector:inject', function(data) {
        clientSocket.emit('client:inject:' + data.id, data.payload)
    })
});
clientSocket.on('connection', function() {})
