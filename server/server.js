var express = require('express'),
    app = new express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    url = require('url'),
    http = require('http');

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    var index = fs.readFileSync('../index.html', 'utf-8');
    res.send(index);
});

app.get('/iframe', function (req, res) {
    var iframe = fs.readFileSync('./iframe.html', 'utf-8');
    res.send(iframe);
});

app.get('/src', function (req, res) {
    var srcUrl = req.query.url.replace(/"/g, '');
    if (!srcUrl) {
        res.send(404, 'uncorrect source url, example: /src?url=xxx');
        return;
    }
    http.get(srcUrl, function(resp) {
        resp.on('data', function (data) {
            res.write(data); 
        });
        resp.on('end', function () {
            res.end();
        });
    }).on('error', function(e) {
        res.send(500, e.message);
    });
});

app.get('/inspector', function (req, res) {
    var scriptId = url.parse(req.url).search.replace(/^\?/, '');
    var script = fs.readFileSync('./script.js');
    res.setHeader('Content-type', 'application/javascript');
    res.send(script);
});

app.get('/devtools', function (req, res) {
    var html = fs.readFileSync('./devtools.html', 'utf-8');
    res.send(html);
});

app.get('/inspector_frame', function (req, res) {
    var html = fs.readFileSync('./inspector_frame.html', 'utf-8');
    res.send(html);
});




app.use(bodyParser());
app.post('/stylesheets', function (req, res) {
    io.sockets.emit('inspect:stylesheet:update', {
        data: JSON.parse(req.body.rules)
    });
    res.send(200);
});

function rawBody(req, res, next) {
  req.setEncoding('utf8');
  req.rawBody = '';
  req.on('data', function(chunk) {
    req.rawBody += chunk;
  });
  req.on('end', function(){
    next();
  });
}

app.post('/html', rawBody, function (req, res) {
    io.sockets.emit('inspect:html:update', {
        data: req.rawBody
    });
    res.send(200);
});

server.listen(3001);

/* =================================================================== */
/* Socket.io */
io.set('log level', 1);
io.sockets.on('connection', function (socket) {
    // socket.on('stylesheet:update:xxx', function (data) {});
});