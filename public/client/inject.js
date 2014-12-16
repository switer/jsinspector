!function () {
    var socketScript = document.createElement('script')
    socketScript.src = '<%= host %>/socket.io/socket.io.js'
    socketScript.onload = function () {
        var socket = io.connect('<%= host %>/client')
        socket.on('client:inject:<%= inspectorId %>', function (payload) {
            switch (payload.type) {
                case 'eval': _execute(payload.value);break;
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
    }
    document.head.appendChild(socketScript)
}();