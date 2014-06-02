function type (obj) {
    return Object.prototype.toString.call(obj).match(/\[object (\w+)\]/)[1].toLowerCase();
}
function xhrCopy (xhr) {
    return {
            statusText: xhr.statusText, 
            status: xhr.status,
            response: xhr.response,
            responseText: xhr.responseText, 
            statusText: xhr.statusText
        };
}
this.addEventListener('message', function (event) {
    if (type(event.data) !== 'object') return;

    var options = event.data;
    
    request({
        method: options.method,
        url: options.url,
        data: options.data,
        type: options.type,
        success: function (data, xhr) {
            postMessage({
                formWorker: true,
                id: options.id,
                data: data,
                xhr: xhrCopy(xhr)
            });
        },
        error: function (err, xhr) {
            postMessage({
                formWorker: true,
                id: options.id,
                error: err || xhr.response,
                xhr: xhrCopy(xhr)
            });
        }
    });
});

/**
 *  ajax request
 **/
function request (options) {
    var xhr = new XMLHttpRequest(),
        method = options.method ? options.method.toUpperCase() : "GET";

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var data = xhr.responseText;
            options.success && options.success(data, xhr);
        } else if (xhr.readyState == 4 && xhr.status != 200) {
            options.error && options.error('', xhr);
        } 
    }

    var params = [];
    if (options.data && Object.prototype.toString.call(options.data) !== '[object String]') {
        // to query string
        var keys = Object.keys(options.data);
        keys.forEach(function (item, index) {
            var value = options.data[item];
            if (Object.prototype.toString.call(value) == '[object String]') {
                params.push(item + '=' + value);
            } else {
                params.push(item + '=' + JSON.stringify(value));
            }
        });
        params = params.join('&');
    } else {
        params = options.data;
    }

    if (method == 'POST' || method == 'PUT' || !options.data) {
        xhr.open(method, options.url, false);
        xhr.setRequestHeader("Content-Type", options.type || "application/x-www-form-urlencoded");
        xhr.send(params);
        
    } else {
        xhr.open(method, options.url + '?' + params, false);
        xhr.send(null);
    }
}