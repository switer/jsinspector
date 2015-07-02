var express = require('express')
var router = express.Router()
var fs = require('fs')
var path = require('path')
var config = require('../../config.json')

/**
 * Client inject script
 */
router.get('/inspector/:id', function(req, res) {
    var file = fs.readFileSync(path.join(config.tmp_dir, 'client_' + req.params.id + '.json'), 'utf-8');
    if (file) {
        res.send(file);
    } else {
        res.status(404).send('Please inject the script to your code !')
    }
})

module.exports = router
