'use strict';

module.exports = function(req, res, next) {
    var search = url.parse(req.url).search;
    search && (req.inspectorId = search.replace(/^\?/, '').split('&')[0]);
    next();
}
