'use strict';

var path = require('path')
var env = process.env.NODE_ENV

module.exports = {
	"enable_mini": env== 'dev' ? false : true,
	"tmp_dir": path.join(__dirname, '.tmp')
}