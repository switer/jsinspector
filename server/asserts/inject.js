;(function () {
    'use strict';

    var slice = Array.prototype.slice
    var clientId = '<%= clientId %>'
    var _requestHandlers = {}
    var dataPacketQueue = []
    var localBaseDocumentData
    var differ, socket

    /**
     *  Get document html
     **/
    function getDocuemnt () {

        var doc = document.documentElement
        var scripts = slice.call(doc.querySelectorAll('script'))
        var styleSheets = slice.call(doc.querySelectorAll('link'))
        var styles = slice.call(doc.querySelectorAll('style'))
        var images = slice.call(doc.querySelectorAll('img'))
        var inputs = slice.call(doc.querySelectorAll('input,textarea'))
        var selects = slice.call(doc.querySelectorAll('select'))

        scripts.forEach(function (item) {
            item.innerHTML = '';
            item.setAttribute('_src', item.src);
            item.src = '';
        });
        styleSheets.forEach(function (item) {
            if (item.getAttribute('href') !== item.href && !item['_jsi-href']) {
                item['_jsi-href'] = item.href
            }
        });
        styles.forEach(function (item) {
            if (item.innerHTML) {
                item.innerHTML = item.innerHTML.replace(
                    /url\(([\'\"])*[\/]*(?!http:\/\/|data:|https:\/\/)/g, 
                    'url($1' + window.location.protocol + '//' + window.location.host + '/'
                );
            }
        });
        images.forEach(function (item) {
            if (item.getAttribute('src') !== item.src && !item['_jsi-src']) {
                item['_jsi-src'] = item.src
            }
        });
        inputs.forEach(function (item) {
            if (item.getAttribute('value') !== item.value) {
                item.setAttribute('value', item.value);
            }
        });
        selects.forEach(function (item) {
            var options = slice.call(item.querySelectorAll('option'));
            options.forEach(function (option) {
                if (item.value == option.value) {
                    option.setAttribute('selected', 'true');
                    return true;
                }
            });
        });
        // get document doctype
        var node = document.doctype
        var doctype = '<!DOCTYPE '
                        + node.name
                        + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
                        + (!node.publicId && node.systemId ? ' SYSTEM' : '') 
                        + (node.systemId ? ' "' + node.systemId + '"' : '')
                        + '>';

        return doctype + doc.innerHTML
    }

    /* =================================================================== */
    /**
     *  use iframe for ajax CORS
     **/
    var requestId = 1
    function $send (options, success, error) {
        var id = requestId ++
        socket.emit('client:' + options.type, {
            pid: id, // packet id
            cid: clientId,
            data: options.data
        })
        /**
         *  register postMessage callback
         **/
        _requestHandlers[id] = {
            success: success,
            error: error
        };
    }

    /* =================================================================== */
    /**
     *  replace cross-domain's stylesheets
     **/
    document.addEventListener('connectionReady', function (e) {
        socket = e.socket
        differ = jsondiffpatch.create({
            textDiff: {
                // default 60, minimum string length (left and right sides) 
                // to use text diff algorythm: google-diff-match-patch
                minLength: 256
            }
        });
        clientReady()
    });

    function clientReady () {
        /**
         *  receive server-side response 
         **/
        socket.on('server:answer:init:' + clientId, function (data) {
            var handler = _requestHandlers[data.pid]
            if (!handler) return
            delete _requestHandlers[data.pid]
            handler.success && handler.success(data.data)
        });
        socket.on('server:answer:update:' + clientId, function (data) {
            var handler = _requestHandlers[data.pid]
            if (!handler) return

            delete _requestHandlers[data.pid]
            handler.success && handler.success(data.data)
        });
        /* =================================================================== */
        /**
         *  initialize step
         **/
        function documentInitalize (done) {
            var docHTML = getDocuemnt()
            var uploadData = {
                html: docHTML,
                meta: {
                    scrollTop: document.body.scrollTop
                }
            }
            documentUpload(uploadData, done)
        }

        function documentUpload (data, cb) {
            initialSend(data, function () {
                localBaseDocumentData = data;
                cb && cb();
            }, function () {
                // if fail, retry
                documentUpload(data, cb);
            });
        }

        function initialSend (data, success, error) {
            $send({
                type: 'init',
                data: data,
            }, success, error);
        }
        /* =================================================================== */
        /**
         *  delta checking step
         **/
        function deltaCheckingStart () {
            dirtyChecking(function (dataPacket) {
                // call when check for the delta change
                sendToQueue(dataPacket);
            });

            consoleChecking(function (dataPacket) {
                sendToQueue(dataPacket);
            });

            window.addEventListener('hashchange', function () {
                var dataPacket = genDetalData();
                if (dataPacket) {
                    // update base document content
                    localBaseDocumentData.html = dataPacket.html;
                    delete dataPacket.html;
                    // sync the meta
                    localBaseDocumentData.meta.scrollTop = dataPacket.meta.scrollTop
                    // TODO
                    sendToQueue(dataPacket);
                }
            });
            window.addEventListener('scroll', function () {
                var dataPacket = {
                    meta: {
                        scrollTop: document.body.scrollTop
                    }
                };
                sendToQueue(dataPacket);
            });
        }

        function dirtyChecking (hasDirtyCallback) {
            setTimeout(function() {
                var dataPacket = genDetalData();
                if (dataPacket) {
                    // update base document content
                    localBaseDocumentData.html = dataPacket.html;
                    delete dataPacket.html;
                    // sync the meta
                    localBaseDocumentData.meta.scrollTop = dataPacket.meta.scrollTop
                    // dirty checking callback
                    hasDirtyCallback(dataPacket);
                }
                // polling
                dirtyChecking(hasDirtyCallback);
            }, 300);
        }

        function consoleChecking (hasConsoleCallback) {
            setTimeout(function() {
                var dataPacket;
                if (insp_consoles.length > 0) {
                    dataPacket = {
                        meta: {
                            consoles: insp_consoles,
                        }
                    }
                    insp_consoles = [];
                    hasConsoleCallback(dataPacket);
                }
                consoleChecking(hasConsoleCallback);
            }, 100);
        }
        /**
         *  Generate delata data when has dirty data, else if return null
         **/
        function genDetalData () {
            var checkedDoc = getDocuemnt(),
                dirtyDataPacket;

            if (checkedDoc !== localBaseDocumentData.html) {
                dirtyDataPacket = {
                    html: checkedDoc,
                    delta: differ.diff(localBaseDocumentData.html, checkedDoc),
                    meta: {
                        scrollTop: document.body.scrollTop
                    }
                }
                // dirty checking callback
                return dirtyDataPacket;
            }
            return null;
        }

        function deltaPost (data, success, error) {
            $send({
                type: 'update',
                data: data
            }, success, error);
        }

        function sendToQueue (dataPacket) {
            dataPacketQueue.push(dataPacket);
            // trigger a event to notify queue manager
            onDataPacketPush();
        }

        /* =================================================================== */
        var queueProcessing = false;

        /**
         *  queue
         **/
        function onDataPacketPush () {
            // task queue manager is working now, lock
            if (queueProcessing) return
            queueProcess()
        }

        var MAX_RETRY_TIMES = 5
        var retryTimes = 0

        function queueProcess () {
            if (dataPacketQueue.length === 0) {
                // stop when the queue is empty
                queueProcessing = false;
                return;
            }
            queueProcessing = true;

            var taskData = dataPacketQueue[0];

            deltaPost(taskData, function () {
                // reset retry time
                retryTimes = 0;

                dataPacketQueue.shift();
                // aync for the performance
                // var timer = window.Worker ? 0 : 100;
                var inter = 100
                setTimeout( function() {
                    queueProcess();
                }, inter);
                    
            }, function (err, xhr) {

                if (xhr.status == 400) { // session is out of date
                    // alert(err);
                } else if (retryTimes >= MAX_RETRY_TIMES) { // max retry times
                    alert(err || 'network error!');
                } else { // retry
                    retryTimes ++;
                    setTimeout( function() {
                        queueProcess();
                    });
                }
            });
        }
        // document base content initial upload
        documentInitalize(function () {
            // delta upload after base document upload done
            deltaCheckingStart();
        });
    }
    
})();
