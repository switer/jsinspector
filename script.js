(function () {
    var iframe = document.createElement('iframe'),
        requestHandlers = {},
        requestId = 0;

    iframe.id = 'iframe_js_inspector';
    iframe.style.display = 'none';
    iframe.src = '/iframe';
    document.body.appendChild(iframe);

    iframe.onload = function () {
        document.querySelector('#button').onclick = function () {
            var id = requestId ++; 
            iframe.contentWindow.postMessage({
                id: id,
                url: 'http://localhost:5000/fifa/1.0.0/global.css'
            }, '*');

            requestHandlers[id] = {
                success: function (data) {
                    console.log(data);
                },
                error: function (error) {
                    
                }
            };
        }
        window.addEventListener('message', function (event) {
            var handler;
            if (handler = requestHandlers[event.data.id]) {
                if (event.data.status == 200) {
                    handler.success &&　handler.success(event.data);
                } else {
                    handler.error && handler.error();                
                }
            }
        });
    }
})();
