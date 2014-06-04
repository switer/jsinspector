<%- jsonify %>
<%- console %>
;(function () {

    var slice = Array.prototype.slice,
        toString = Object.prototype.toString,
        iframe = document.createElement('iframe'),
        script = document.createElement('script'),
        inspectorId = '<%= inspectorId %>',
        requestHandlers = {},
        requestId = 0,
        baseDocumentData,
        dataPacketQueue = [],
        differ;

    /**
     *  load jsondiffpatch module
     **/
    script.src="<%= host %>/jsondiffpatch.js";
    document.body.appendChild(script);

    /**
     *  create iframe for CORS
     **/
    iframe.style.display = 'none';
    iframe.src = '<%= host %>/client/frame.html';
    iframe.id = '__jsinspector_cors_iframe';
    document.body.appendChild(iframe);

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
     *  replace those cross-domain stylesheet
     **/
    function replaceCORSStyleSheet (callback) {
        var styleSheets = slice.call(document.styleSheets),
            count = styleSheets.length;

        styleSheets.forEach(function (item) {
            // think of those stylesheets without cssRules as CORS 
            if (!item.cssRules) {
                $ajax({
                    method: 'GET',
                    url: '/src',
                    data: {
                        url: item.href
                    }
                }, function (styleText) {
                    var style = document.createElement('style'),
                        link = item.ownerNode;

                    style.setAttribute('href', item.href);
                    style.innerHTML = styleText;
                    link.parentNode.replaceChild(style, link);

                    count--;
                    if (count <= 0) {
                        callback && callback();
                    }
                }, function (err) {
                    // TODO
                });
            } else {
                count--;
            }
        });
        // count to zero callback
        if (count <= 0) {
            callback && callback();
        }
    };

    /**
     *  Get document html
     **/
    function getDocuemnt () {

        var doc = document.documentElement,
            scripts = slice.call(doc.querySelectorAll('script')),
            styleSheets = slice.call(doc.querySelectorAll('link')),
            images = slice.call(doc.querySelectorAll('img')),
            inputs = slice.call(doc.querySelectorAll('input,textarea'));
            selects = slice.call(doc.querySelectorAll('select'));

        scripts.forEach(function (item) {
            item.innerHTML = '';
            item.src = "";
        });
        styleSheets.forEach(function (item) {
            if (item.getAttribute('href') !== item.href) {
                item.setAttribute('href', item.href);
            }
        });
        images.forEach(function (item) {
            if (item.getAttribute('src') !== item.src) {
                item.setAttribute('src', item.src);
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
    function $ajax (options, success, error) {
        var id = requestId ++; 
        options.id = id;
        iframe.contentWindow.postMessage(options, '*');

        /**
         *  register postMessage callback
         **/
        requestHandlers[id] = {
            success: success,
            error: error
        };
    }
    iframe.onload = function () {
        /**
         *  receive postMessage response 
         **/
        window.addEventListener('message', function (event) {
            var handler,
                data = event.data;

            if (handler = requestHandlers[data.id]) {
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
                    inspectorId: inspectorId
                };

            documentUpload(uploadData, done);
        }

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
            $ajax({
                method: 'POST',
                url: '/html/init?<%= inspectorId %>',
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
                    inspectorId: inspectorId
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
                        inspectorId: inspectorId
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
                    inspectorId: inspectorId
                }
                // dirty checking callback
                return dirtyDataPacket;
            }
            return null;
        }

        function deltaPost (data, success, error) {
            $ajax({
                method: 'POST',
                url: '/html/delta?<%= inspectorId %>',
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
                    alert(err);
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


        /* =================================================================== */
        /**
         *  replace cross-domain's stylesheets
         **/
        window.addEventListener('load', function () {
            differ = jsondiffpatch.create({
                textDiff: {
                    // default 60, minimum string length (left and right sides) 
                    // to use text diff algorythm: google-diff-match-patch
                    minLength: 60
                }
            });
            // document base content initial upload
            documentInitalize(function () {
                // delta upload after base document upload done
                deltaCheckingStart();
            });
            // sync the data such as "scrollTop", unless document content

            /*replaceCORSStyleSheet(function () {
                var matchesRules = getMatchesRules(document.body);

                $ajax({
                    method: 'POST',
                    url: '/stylesheets',
                    data: {
                        rules: matchesRules
                    }
                }, function () {
                });
            });*/
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
})();
