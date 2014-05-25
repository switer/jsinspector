var express = require('express'),
    app = new express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    // io = require('socket.io').listen(app),
    fs = require('fs'),
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
    var srcUrl = req.query.url;
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

server.listen(3001);
// app.listen(3001);

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});