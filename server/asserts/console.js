/**
 *  Console.log overide
 **/
!function (exports) {
    'use strict';

    var slice = Array.prototype.slice;

    function NOOP () {}
    function _log (type, args) {
        console['_'+type].apply(console, args)
    }

    function _logProxy (type, args, noLocal) {
        !noLocal && _log(type, args);

        args = slice.call(args);
        args.forEach(function (item, index) {
            try {
                args[index] = JSON.parse(JSON.stringify(item));
            } catch (e) {
                args[index] = jsonify(item);
            }
        });

        _jsinspector_consoles.push({
            type: type,
            args: JSON.stringify(args)
        });
    }
    function _logHook (type) {
        return function () {
            _logProxy(type, arguments);
        }
    }
    
    if (!exports._jsinspector_console_inited) {

        // mark as inited
        exports._jsinspector_console_inited = true;
        exports._jsinspector_consoles = [];

        var proxyMethods = ['log', 'clear', 'error', 'info', 'warn', 'time', 'timeEnd']

        /**
         *  Saving native methods
         **/
        proxyMethods.forEach(function (m) {
            console['_' + m] = console[m] || NOOP
        })

        /**
         *  console methods override  
         **/
        proxyMethods.forEach(function (m) {
            console[m] = _logHook(m)
        })
        
        var _times = {};
        console.time = function (name) {
            _times[name] = Date.now();
        }
        console.timeEnd = function (name) {
            if (_times[name] === undefined) return;
            var end = Date.now() - _times[name];
            _logProxy('log', ['%c' + name + ': ' + end + 'ms', 'color: blue'])
        }

        /**
         * Catch global error
         */
        function _errorProxy(errorEvent) {
            var args = [
                errorEvent.message + '    %c' + errorEvent.filename + ':' + errorEvent.lineno, 
                'color:gray;'
            ];
            if (errorEvent.error && errorEvent.error.stack) {
                args.push(errorEvent.error.stack);
            }
            _logProxy('error', args, true);
        }
        window.addEventListener('error', _errorProxy)

        // init clear console
        console.clear();
    }

}(this);
