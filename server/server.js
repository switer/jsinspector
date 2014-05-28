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
            // default 60, minimum string length (left and right sides) 
            // to use text diff algorythm: google-diff-match-patch
            minLength: 60
        }
    });

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
app.get('/', function (req, res) {
    var html = fs.readFileSync('../index.html', 'utf-8');
    res.send(html);
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
/**
 *  inspctor script
 **/
app.get('/inspector', inspectorIdParse, function (req, res) {
    var script = fs.readFileSync('./script.js', 'utf-8');
    res.setHeader('Content-type', 'application/javascript');
    res.send(ejs.render(script, {
        host: 'http://' + req.headers.host,
        inspectorId: req.inspectorId,
        dom2json: fs.readFileSync('./public/dom2json.js', 'utf-8')
    }));
});
app.get('/devtools', inspectorIdParse, function (req, res) {
    var html = fs.readFileSync('./devtools.html', 'utf-8');
    res.send(ejs.render(html, {
        host: 'http://' + req.headers.host,
        inspectorId: req.inspectorId
    }));
});
app.get('/inspect_html_init', inspectorIdParse, function (req, res) {
        var tmp; 
        try {
            tmp = fs.readFileSync('tmp/inspector_html_' + req.inspectorId + '.json', 'utf-8');
        } catch (e) {
            console.log('Error ' + e + e.stack);
        }
        if (tmp) res.send(tmp);
        else {
            res.send(200, '');
        }
    });
/* =================================================================== */


/**
 *  POS Routes
 **/
/* =================================================================== */
function inspectorIdParse (req, res, next) {
    req.inspectorId = url.parse(req.url).search.replace(/^\?/, '').split('&')[0];
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
app.post('/stylesheets', function (req, res) {
    io.sockets.emit('inspect:stylesheet:update', {
        data: JSON.parse(req.body.rules)
    });
    res.send(200);
});
app.post('/html', inspectorIdParse, rawBody, function (req, res) {
    var content = req.rawBody,
        updatedData,
        lastTmpData;


    try {
        lastTmpData = fs.readFileSync('tmp/inspector_html_' + req.inspectorId + '.json', 'utf-8');
        lastTmpData = JSON.parse(lastTmpData);
        updatedData = JSON.parse(content);

        // patching html text
        if (updatedData.delta && !updatedData.html) {
            updatedData.html = jsondiffpatch.patch(lastTmpData.html, updatedData.delta);
            content = JSON.stringify(updatedData);
        }

        if (!updatedData.html && lastTmpData.html) {
            updatedData.html = lastTmpData.html;
            content = JSON.stringify(updatedData);
        }

        lastTmpData = JSON.stringify(updatedData);
    } catch (e) {
        lastTmpData = null;
        console.log('Error ' + e + e.stack);
    }

    fs.writeFileSync('tmp/inspector_html_' + req.inspectorId + '.json', lastTmpData || content, 'utf-8');
    io.sockets.emit('inspect:html:update:' + req.inspectorId, lastTmpData || content);

    res.send(200);
});
/* =================================================================== */

server.listen(3001);

/* =================================================================== */
/* Socket.io */
io.set('log level', 1);
io.sockets.on('connection', function (socket) {});