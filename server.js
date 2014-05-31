var express = require('express'),
    fs = require('fs'),
    ejs = require('ejs'),
    url = require('url'),
    http = require('http'),
    compress = require('compression'),
    app = new express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    bodyParser = require('body-parser'),
    jsondiffpatch = require('jsondiffpatch').create({
        textDiff: {
            minLength: 60
        }
    });

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


app.use(compress());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

/**
 *  GET routes
 **/
/* =================================================================== */
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
/**
 *  inspctor script
 **/
app.get('/inspector', inspectorIdParse, function (req, res) {
    var script = readFile('./public/client/script.js', 'utf-8');
    res.setHeader('Content-type', 'application/javascript');
    res.send(ejs.render(script, {
        host: 'http://' + req.headers.host,
        inspectorId: req.inspectorId
    }));
});
app.get('/devtools', inspectorIdParse, function (req, res) {
    var html = fs.readFileSync('./public/devtools/devtools.html', 'utf-8'),
        host = req.headers.host;

    res.send(ejs.render(html, {
        host: host.match(/^http\:/) ? host : 'http://' + host,
        inspectorId: req.inspectorId
    }));
});
app.get('/inspect_html_init', inspectorIdParse, function (req, res) {
    res.send(readFile('tmp/inspector_html_' + req.inspectorId + '.json'));
});
/* =================================================================== */


/**
 *  POS Routes
 **/
/* =================================================================== */
function inspectorIdParse (req, res, next) {
    var search = url.parse(req.url).search;
    search && (req.inspectorId = search.replace(/^\?/, '').split('&')[0]);
    next();
}

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
app.post('/html', inspectorIdParse, rawBody, function (req, res) {
    var content = req.rawBody,
        updatedData, // currently upload data
        lastTmpData, // last time update data
        syncData; // sync the data for devtool

    /**
     *  @html {String}
     *  @delta {TextDelta}
     *  @meta {Object}
     **/
    try {
        lastTmpData = fs.readFileSync('tmp/inspector_html_' + req.inspectorId + '.json', 'utf-8');
        lastTmpData = JSON.parse(lastTmpData);
        updatedData = JSON.parse(content);
        syncData = JSON.parse(content);
        // patching html text
        if (updatedData.delta && !updatedData.html && lastTmpData.html) {
            updatedData.html = jsondiffpatch.patch(lastTmpData.html, updatedData.delta);
            // full amount release, currently I can't do delta release
            syncData.html = updatedData.html;
            syncData.delta = '';
        } else if (!updatedData.html) {
            updatedData.html = lastTmpData.html;
        }
        syncData = JSON.stringify(syncData);
        lastTmpData = JSON.stringify(updatedData);
    } catch (e) {
        console.log('Error ' + e + e.stack);
    }

    fs.writeFileSync('tmp/inspector_html_' + req.inspectorId + '.json', lastTmpData || content, 'utf-8');
    io.sockets.emit('inspect:html:update:' + req.inspectorId, syncData || content);

    res.send(200);
});
/* =================================================================== */

server.listen(3001);

/* =================================================================== */
/* Socket.io */
io.set('log level', 1);
io.sockets.on('connection', function (socket) {});