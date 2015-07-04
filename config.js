'use strict';

var path = require('path')
var env = process.env.NODE_ENV
var envs = process.env
module.exports = {
	"enable_mini": env== 'dev' ? false : true,
	"tmp_dir": path.join(envs.APPDATA || envs.HOME || __dirname, '.tmp')
}