var express = require('express')
var router = express.Router()
var fs = require('fs')
var path = require('path')
var uglify = require('uglify-js')
var ejs = require('ejs')
var scripts = {}
var uuid = require('node-uuid')
var config = require('../../config')
var ENABLE_MINI = config.enable_mini

/**
 * Client inject script
 */
router.get('/s', function(req, res) {
    ;['inject', 'console', 'jsonify', 'socket', 'jsondiffpatch'].forEach(function(s) {
        scripts[s] = fs.readFileSync(path.join(__dirname, '../asserts/', s + '.js'), 'utf-8')
    })
    res.setHeader('Content-Type', 'application/javascript')

    var clientId = req.cookies['_jsinspector_client_id_']
    if (!clientId) {
    	clientId = uuid.v4()
        res.cookie('_jsinspector_client_id_', clientId, {maxAge: 360 * 24 * 60 * 60 * 1000})
    }

    var clientParams = {
        clientId: clientId,
        host: 'http://' + req.headers.host
    }
    var inject = ejs.render(scripts.inject, clientParams)
    var socket = ejs.render(scripts.socket, clientParams)
    var sourceCode = [scripts.jsonify, scripts.console, scripts.jsondiffpatch, socket,  inject].join('\n')
    if (ENABLE_MINI) {
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

module.exports = router
