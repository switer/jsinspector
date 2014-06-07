/**
 *  Console.log overide
 **/
!function (exports) {
    'use strict;'

    if (!exports.insp_console_inited) {
        var slice = Array.prototype.slice;

        // mark as inited
        exports.insp_console_inited = true;

        exports.native_console = {
            log: console.log,
            clear: console.log,
            error: console.error,
            info: console.info,
            warn: console.warn,
            time: console.time,
            timeEnd: console.timeEnd,
        }
        exports.insp_consoles = [];
        exports.insp_times = {};
        exports.insp_log = function(type, args) {
            native_console[type].apply(console, args);
        }
        exports.insp_logHandler = function (type, args, noLocal) {
            !noLocal && insp_log(type, args);

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
            insp_logHandler('log', arguments);
        }
        console.clear = function () {
            insp_logHandler('clear', arguments);
        }
        console.error = function () {
            insp_logHandler('error', arguments);
        }
        console.info = function () {
            insp_logHandler('info', arguments);
        }
        console.warn = function () {
            insp_logHandler('warn', arguments);
        }
        console.time = function (name) {
            insp_times[name] = Date.now();
        }
        console.timeEnd = function (name) {
            if (insp_times[name] == undefined) return;
            var end = Date.now() - insp_times[name];
            insp_logHandler('log', ['%c' + name + ': ' + end + 'ms', 'color: blue'])
        }
        // init clear console
        console.clear();



        /* =================================================================== */
        /*global error handle*/
        exports.insp_errorHandler = function (error) {
            insp_logHandler('error', [error.message + '    %c' + error.filename + ':' + error.lineno, 'color:gray;'], true);
        };
        window.addEventListener('error', insp_errorHandler);
    }

}(this);
