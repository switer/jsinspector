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

    function jsonify (obj, _time) {
        var jsonObj,
            type = objType(obj);

        !_time && (_time = 0);
        try {
            if (type == 'Undefined') {
                jsonObj = undefined;
            } else if (obj !== obj) {
                jsonObj = 'NaN';
            } else if (type == 'String') {
                jsonObj = textOmit(obj);
            } else if (type == 'Null' || type == 'Number' || type == 'Boolean') {
                jsonObj = obj;
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
                    if (_time >= 2 ) {
                        array.push(objType(item))
                    } else {
                        array.push(jsonify(item, _time + 1));
                    }
                });
                jsonObj = array;
            } else if (type == 'Object' || type == 'global' || type == 'HTMLDocument') {
                var keys = Object.keys(obj),
                    object = {};
                keys.forEach(function (key) {
                    if (!obj.hasOwnProperty(key)) return
                    if (_time >= 2 ) {
                        object[key] = (objType(obj[key]))
                    } else {
                        object[key] = jsonify(obj[key], _time + 1);
                    }
                });
                jsonObj = object;
            } else if (type == 'Function') {
                jsonObj = textOmit(obj.toString());
            } else {
                jsonObj = toString.call(obj); 
            }
        }
        return jsonObj;
    }

    exports.jsonify = jsonify;
}(this);