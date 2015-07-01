/**
 *  Console.log overide
 **/
!function (exports) {
    'use strict;'

    if (!exports.insp_console_inited) {
        var slice = Array.prototype.slice;
        function NOOP () {}

        // mark as inited
        exports.insp_console_inited = true;
        exports.insp_consoles = [];

        var proxyMethods = ['log', 'clear', 'error', 'info', 'warn', 'time', 'timeEnd']
        /**
         *  Saving native methods
         **/
        proxyMethods.forEach(function (m) {
            console['_' + m] = console[m] || NOOP
        })

        function insp_log (type, args) {
            console['_'+type].apply(console, args)
        }
        function insp_logHandler (type, args, noLocal) {
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
        function logHandler (type) {
            return function () {
                insp_logHandler(type, arguments);
            }
        }
        /**
         *  console methods override  
         **/
        proxyMethods.forEach(function (m) {
            console[m] = logHandler(m)
        })
        
        var insp_times = {};
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
        exports.insp_errorHandler = function (errorEvent) {
            var args = [
                errorEvent.message + '    %c' + errorEvent.filename + ':' + errorEvent.lineno, 
                'color:gray;'
            ];
            if (errorEvent.error && errorEvent.error.stack) {
                args.push(errorEvent.error.stack);
            }
            insp_logHandler('error', args, true);
        };
        window.addEventListener('error', insp_errorHandler);
    }

}(this);
