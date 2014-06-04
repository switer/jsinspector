/**
 *  Console.log overide
 **/
!function (exports) {
    'use strict;'
    
    if (!window.insp_consoles) {
        var native_log = console.log;

        exports.insp_log = function() {
            native_log.apply(console, arguments);
        }
        exports.insp_consoles = exports.insp_consoles || [];

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
        console.clear();
    }
}(this);
