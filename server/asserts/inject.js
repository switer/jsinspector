;function _execute () {
    console.log(eval.apply(this, arguments))
}
;(function () {
    var slice = Array.prototype.slice
    var toString = Object.prototype.toString
    var clientId = '<%= clientId %>'
    var _requestHandlers = {}
    var baseDocumentData
    var dataPacketQueue = []
    var differ, socket

    /* =================================================================== */
    /**
     *  Get all mathes rules form an element
     **/
    function getMatchesRules ($el) {
        var styleSheets = slice.call(document.styleSheets),
            matches = [];

        if (styleSheets) {
            styleSheets.forEach(function (item, index) {
               if (item.cssRules) {
                    var rules = slice.call(item.cssRules);
                    rules.forEach(function (rule, rindex) {
                        if ($el.matches(rule.selectorText)) {
                            matches.push({
                                styleSheet: index,
                                rule: rindex,
                                cssText: rule.cssText,
                                selectorText: rule.selectorText,
                                href: item.href || item.ownerNode.getAttribute('href')
                            });
                        } 
                    });
               }
            });
        }
        return matches;
    }

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
            if (item.getAttribute('href') !== item.href && !item.['_jsi-href']) {
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
            if (item.getAttribute('src') !== item.src && !item.['_jsi-src']) {
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
        var node = document.doctype,
            doctype = "<!DOCTYPE "
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
    var requestId = 0
    function $send (options, success, error) {
        var id = requestId ++; 
        options.id = id;
        socket.emit('client:sync', options)
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
        clientReady()
    });

    function clientReady () {
        /**
         *  receive postMessage response 
         **/
        socket.on('server:push', function (event) {
            var handler,
                data = event.data;

            if (handler = _requestHandlers[data.id]) {
                if (data.xhr.status == 200) {
                    handler.success &&　handler.success(data.data, data.xhr);
                } else {
                    handler.error && handler.error(data.error, data.xhr);                
                }
                delete handler[data.id];
            }
        });
        /* =================================================================== */
        /**
         *  initialize step
         **/
        function documentInitalize (done) {
            var docHTML = getDocuemnt(),
                uploadData = {
                    ssid: SSID(),
                    html: docHTML,
                    meta: {
                        scrollTop: document.body.scrollTop
                    },
                    clientId: clientId
                };

            documentUpload(uploadData, done);
        }

        function documentUpload (data, callback) {
            initPost(data, function () {
                baseDocumentData = data;
                callback && callback();
            }, function () {
                documentUpload(data, callback);
            });
        }

        function initPost (data, success, error) {
            $send({
                method: 'POST',
                url: '/html/init?<%= clientId %>',
                type: 'text/plain',
                data: JSON.stringify(data),
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
                    baseDocumentData.html = dataPacket.html;
                    delete dataPacket.html;
                    // sync the meta
                    baseDocumentData.meta.scrollTop = dataPacket.meta.scrollTop
                    // TODO
                    sendToQueue(dataPacket);
                }
            });
            window.addEventListener('scroll', function () {
                var dataPacket = {
                    meta: {
                        scrollTop: document.body.scrollTop
                    },
                    clientId: clientId
                };
                sendToQueue(dataPacket);
            });
        }

        function dirtyChecking (hasDirtyCallback) {
            setTimeout(function() {
                var dataPacket = genDetalData();
                if (dataPacket) {
                    // update base document content
                    baseDocumentData.html = dataPacket.html;
                    delete dataPacket.html;
                    // sync the meta
                    baseDocumentData.meta.scrollTop = dataPacket.meta.scrollTop
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
                        },
                        clientId: clientId
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

            if (checkedDoc != baseDocumentData.html) {
                dirtyDataPacket = {
                    html: checkedDoc,
                    delta: differ.diff(baseDocumentData.html, checkedDoc),
                    meta: {
                        scrollTop: document.body.scrollTop
                    },
                    clientId: clientId
                }
                // dirty checking callback
                return dirtyDataPacket;
            }
            return null;
        }

        function deltaPost (data, success, error) {
            $send({
                method: 'POST',
                url: '/html/delta?<%= clientId %>',
                type: 'text/plain',
                data: JSON.stringify(data),
            }, success, error);
        }

        function sendToQueue (dataPacket) {
            var ssid = SSID.get();
            if (ssid) {
                dataPacket.ssid = ssid;
                dataPacketQueue.push(dataPacket);
                // trigger a event to notify queue manager
                onDataPacketPush();
            } else {
                dataPacketQueue = [];
                documentInitalize(function () {
                    // TODO
                });
            }
        }

        /* =================================================================== */
        var queueProcessing = false;

        /**
         *  queue
         **/
        function onDataPacketPush () {
            if (queueProcessing) {
                // task queue manager is working now, lock
                return;
            } else {
                queueProcess();
            }
        }

        var MAX_RETRY_TIMES = 5,
            retryTimes = 0;

        function queueProcess () {
            if (dataPacketQueue.length == 0) {
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

                var timer = window.Worker ? 0 : 100; 
                setTimeout( function() {
                    queueProcess();
                }, timer);
                    
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


    /* =================================================================== */
    /**
     *  @https://github.com/LiosK/UUID.js/blob/master/src/uuid.core.js
     **/
    function UUID() {
        var cacheUUID = localStorage.getItem('__js_inspector_uuid__');
        if (cacheUUID) {
            return cacheUUID;
        } else {
            cacheUUID = UUID.generate();
            localStorage.setItem('__js_inspector_uuid__', cacheUUID);
            return cacheUUID;
        }
    }

    /**
     * The simplest function to get an UUID string.
     * @returns {string} A version 4 UUID string.
     */
    UUID.generate = function() {
      var rand = UUID._gri, hex = UUID._ha;
      return  hex(rand(32), 8)          // time_low
            + "-"
            + hex(rand(16), 4)          // time_mid
            + "-"
            + hex(0x4000 | rand(12), 4) // time_hi_and_version
            + "-"
            + hex(0x8000 | rand(14), 4) // clock_seq_hi_and_reserved clock_seq_low
            + "-"
            + hex(rand(48), 12);        // node
    };

    /**
     * Returns an unsigned x-bit random integer.
     * @param {int} x A positive integer ranging from 0 to 53, inclusive.
     * @returns {int} An unsigned x-bit random integer (0 <= f(x) < 2^x).
     */
    UUID._gri = function(x) { // _getRandomInt
      if (x <   0) return NaN;
      if (x <= 30) return (0 | Math.random() * (1 <<      x));
      if (x <= 53) return (0 | Math.random() * (1 <<     30))
                        + (0 | Math.random() * (1 << x - 30)) * (1 << 30);
      return NaN;
    };

    /**
     * Converts an integer to a zero-filled hexadecimal string.
     * @param {int} num
     * @param {int} length
     * @returns {string}
     */
    UUID._ha = function(num, length) {  // _hexAligner
      var str = num.toString(16), i = length - str.length, z = "0";
      for (; i > 0; i >>>= 1, z += z) { if (i & 1) { str = z + str; } }
      return str;
    };

    /* =================================================================== */
    /**
     *  session id generator
     **/
    function SSID () {
        var ssid = sessionStorage.getItem('__js_inspector_ssid__');
        if (ssid) {
            return ssid;
        } else {
            ssid = UUID.generate();
            sessionStorage.setItem('__js_inspector_ssid__', ssid);
            return ssid;
        }
    }
    SSID.get = function () {
        return sessionStorage.getItem('__js_inspector_ssid__');
    };
    
})();
