;function _jsinpector_execute (code) {
    'use strict';

    var script = document.createElement('script')
    script.innerHTML = '!function(){' + code + '}()'
    document.head.appendChild(script)
    document.head.removeChild(script)
};
!function _jsinpector_socket() {
    'use strict';

    var script = document.createElement('script')
    var clientId = '<%= clientId %>'

    script.src = '<%= host %>/socket.io/socket.io.js'
    script.onload = function () {

        var socket = io.connect('<%= host %>/client')
        var readyEvent = new CustomEvent('connectionReady')

        socket.on('client:inject:' + clientId, function (payload) {
            switch (payload.type) {
                case 'eval': _jsinpector_execute(payload.value);
                    break;
                case 'js': 
                    var s = document.createElement('script')
                    s.src = payload.value
                    document.head.appendChild(s)
                    break;
                case 'css': 
                    var l = document.createElement('link')
                    l.rel = 'stylesheet'
                    l.href = payload.value
                    document.head.appendChild(l)
                    break;
            }
        })
        window.addEventListener('load', function () {
            readyEvent.socket = socket
            document.dispatchEvent(readyEvent)
        })
    }
    document.head.appendChild(script)
}();