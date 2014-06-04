/**
 *  Console.log overide
 **/
!function (exports) {
    'use strict;'

    if (!window.insp_consoles) {
        exports.native_log = console.log;

        exports.insp_consoles = exports.insp_consoles || [];
        exports.insp_times = exports.insp_times || {};
        exports.insp_log = exports.insp_log || function() {
            native_log.apply(console, arguments);
        }

        function logHandler (type, args) {
            insp_log.apply(this, args);

            args = slice.call(args);
            args.forEach(function (item, index) {
                try {
                    args[index] = JSON.parse(JSON.stringify(item));
                } catch (e) {
                    args[index] = jsonify(item);
                }
            });

            insp_consoles.push({
                type: type,
                args: JSON.stringify(args)
            });
        }

        console.log = function () {
            logHandler('log', arguments);
        }
        console.clear = function () {
            logHandler('clear', arguments);
        }
        console.error = function () {
            logHandler('error', arguments);
        }
        console.info = function () {
            logHandler('info', arguments);
        }
        console.warn = function () {
            logHandler('warn', arguments);
        }
        console.time = function (name) {
            insp_times[name] = Date.now();
        }
        console.timeEnd = function (name) {
            if (insp_times[name] == undefined) return;
            var end = Date.now() - insp_times[name];
            logHandler('log', ['%c' + name + ': ' + end + 'ms', 'color: blue'])
        }
        console.clear();
    }
}(this);
