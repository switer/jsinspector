!function () {
    var script = document.createElement('script')

    script.src = '<%= host %>/socket.io/socket.io.js'
    script.onload = function () {
        var socket = io.connect('<%= host %>/client')
        var readyEvent = new Event('connectionReady', {socket: socket})
        
        socket.on('client:inject:<%= clientId %>', function (payload) {
            switch (payload.type) {
                case 'eval': _execute(payload.value);
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
            document.dispatchEvent(readyEvent)
        })
    }
    document.head.appendChild(script)
}();