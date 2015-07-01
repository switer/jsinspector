var express = require('express')
var router = express.Router()
var fs = require('fs')
var path = require('path')
var uglify = require('uglify-js')
var ejs = require('ejs')
var scripts = {}

;['inject', 'console', 'jsonify', 'socket'].forEach(function(s) {
    scripts[s] = fs.readFileSync(path.join(__dirname, '../asserts/', s + '.js'), 'utf-8')
})

/**
 * Client inject script
 */
router.get('/s', function(req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    var clientParams = {
        clientId: req.cookie._jsinspector_client_id_,
        host: 'http://' + req.headers.host
    }
    var inject = ejs.render(scripts.inject, clientParams)
    var socket = ejs.render(scripts.socket, clientParams)
    
    res.send(UglifyJS.minify(
    	[scripts.jsonify, scripts.console, socket, inject].join('\n'), 
    	{
	        fromString: true,
	        mangle: true,
	        compress: true
	    }).code
   	)
})

module.exports = router
