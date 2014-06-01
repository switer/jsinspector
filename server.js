var express = require('express'),
    fs = require('fs'),
    ejs = require('ejs'),
    url = require('url'),
    http = require('http'),
    compress = require('compression'),
    bodyParser = require('body-parser'),
    logfmt = require("logfmt"),
    app = new express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    jsondiffpatch = require('jsondiffpatch').create({
        textDiff: {
            minLength: 60
        }
    });

var session = {};

/**
 *  uitl functions
 **/
function readFile (path) {
    if (fs.existsSync(path)) {
        return fs.readFileSync(path, 'utf-8');
    } else {
        return '';
    }
}

/**
 *  initialize
 **/
/* =================================================================== */
if (!fs.existsSync('/tmp')) {
    fs.mkdirSync('/tmp');
}
/* =================================================================== */

app.use(logfmt.requestLogger());
app.use(compress());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());


/* =================================================================== */
/**
 *  Middlewares
 **/

/**
 *  Get inpsector form url
 **/
function inspectorIdParse (req, res, next) {
    var search = url.parse(req.url).search;
    search && (req.inspectorId = search.replace(/^\?/, '').split('&')[0]);
    next();
}
/**
 *  Post body parse
 **/
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


/* =================================================================== */
/**
 *  Client routes
 **/
app.get('/inspector', inspectorIdParse, function (req, res) {
    var script = readFile('./public/client/script.js', 'utf-8');
    res.setHeader('Content-type', 'application/javascript');
    res.send(ejs.render(script, {
        host: 'http://' + req.headers.host,
        inspectorId: req.inspectorId
    }));
});
/**
 *  Use for client CORS prox
 **/
app.get('/src', function (req, res) {
    var srcUrl = req.query.url.replace(/"/g, '');
    if (!srcUrl) {
        // Bad Request
        res.send(400, 'Uncorrect source url, example: /src?url=xxx');
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
/**
 *  Client document upload API
 **/
app.post('/html/init', inspectorIdParse, rawBody, function (req, res) {
    var content = req.rawBody,
        updatedData = JSON.parse(content);

    // record in session
    session[req.inspectorId] = updatedData.ssid;
    /**
     *  save
     **/
    fs.writeFileSync('tmp/inspector_html_' + req.inspectorId + '.json', content, 'utf-8');
    io.sockets.emit('inspected:html:update:' + req.inspectorId, content);
    res.send(200, 'ok');
});
app.post('/html/delta', inspectorIdParse, rawBody, function (req, res) {
    var content = req.rawBody,
        updatedData = JSON.parse(content), // currently upload data
        lastTmpData, // last time update data
        syncData; // sync the data for devtool

    /**
     *  one inspectorId match one session
     **/
    if (updatedData.ssid != session[req.inspectorId]) {
        res.send(400, 'Session is out of date, please reload!')
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
    io.sockets.emit('inspected:html:update:' + req.inspectorId, syncData);

    res.send(200, 'ok');
});

/* =================================================================== */
/**
 *  Inspctor routes
 **/
app.get('/', function (req, res, next) {
    var index = fs.readFileSync('./public/index/index.html', 'utf-8');
    res.send(200, ejs.render(index, {}));
});
app.get('/devtools', inspectorIdParse, function (req, res, next) {
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
app.get('/devtools/init', inspectorIdParse, function (req, res) {
    var file = readFile('tmp/inspector_html_' + req.inspectorId + '.json');
    if (file) {
        res.send(file);
    } else {
        res.send(404, 'Please inject the script to your code !')
    }
});

/* =================================================================== */
var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
  console.log("Listening on " + port);
});

/* =================================================================== */
/* Socket.io */
io.set('log level', 1);
io.sockets.on('connection', function (socket) {});