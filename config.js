'use strict';

var path = require('path')
var env = process.env.NODE_ENV
var envs = process.env
module.exports = {
    "isDev": env === 'dev',
	"enable_mini": env !== 'dev' ? true : false,
	"tmp_dir": path.join(envs.APPDATA || envs.HOME || __dirname, '.tmp')
}