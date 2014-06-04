/**
 *  Every object can be serialized to json
 **/
!function (exports) {
    'use strict;'

    var toString = Object.prototype.toString,
        slice = Array.prototype.slice,
        objType = function (obj) {
            return toString.call(obj).match(/\[object ([a-zA-Z]+)\]/)[1];
        };

    function textOmit (text) {
        var len = text.length;
        if (len > 70) {
            text = text.substr(0, 30) + ' ... ' + text.substr(len - 30, len - 1);
        }
        return text;
    }

    function jsonify (obj) {
        var jsonObj,
            type = objType(obj);

        try {
            if (type == 'Undefined') {
                jsonObj = 'undefined';
            } else if (obj !== obj) {
                jsonObj = 'NaN';
            } else {
                jsonObj = JSON.parse(JSON.stringify(obj));
            }

        } catch (e) {
            if (type.match('Element')) {
                jsonObj = obj.outerHTML.replace(obj.innerHTML, '');
            } else if (type == 'Text') {
                jsonObj = textOmit(obj.textContent);
            } else if (type == 'Array' || type == 'NodeList') {
                var array = [];
                obj = slice.call(obj);

                obj.forEach(function (item) {
                    array.push(jsonify(item));
                });
                jsonObj = array;
            } else if (type == 'Object') {
                var keys = Object.keys(obj),
                    object = {};
                keys.forEach(function (key) {
                    object[key] = jsonify(obj[key]);
                });
                jsonObj = object;
            } else if (type == 'Function') {
                jsonObj = textOmit(obj.toString());
            } else if (type == 'global' || type == 'HTMLDocument') {
                var keys = Object.keys(obj),
                    object = {};
                keys.forEach(function (key) {
                    object[key] = objType(obj[key]);
                });
                jsonObj = object;
            } else {
                jsonObj = toString.call(obj); 
            }
        }

        return jsonObj;
    }

    exports.jsonify = jsonify;
}(this);