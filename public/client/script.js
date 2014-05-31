;(function () {
    var slice = Array.prototype.slice,
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
                getResource(item.href, function (styleText) {
                    var style = document.createElement('style'),
                        link = item.ownerNode;

                    style.setAttribute('href', item.href);
                    style.innerHTML = styleText;
                    link.parentNode.replaceChild(style, link);

                    count--;
                    if (count <= 0) {
                        callback && callback();
                    }
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
            inputs = slice.call(doc.querySelectorAll('input'));

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
     *  get resource content with url
     **/
    function getResource (url, success, error) {
        var id = requestId ++; 

        iframe.contentWindow.postMessage({
            id: id,
            url: url,
            static: true
        }, '*');

        /**
         *  register postMessage callback
         **/
        requestHandlers[id] = {
            success: function (data) {
                success(data.data);
            },
            error: error
        };
    }
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
        differ = jsondiffpatch.create({
            textDiff: {
                // default 60, minimum string length (left and right sides) 
                // to use text diff algorythm: google-diff-match-patch
                minLength: 60
            }
        })
        /**
         *  receive postMessage response 
         **/
        window.addEventListener('message', function (event) {
            var handler;
            if (handler = requestHandlers[event.data.id]) {
                if (event.data.status == 200) {
                    handler.success &&　handler.success(event.data);
                } else {
                    handler.error && handler.error();                
                }
                delete handler[event.data.id];
            }
        });
        /* =================================================================== */
        /**
         *  initialize step
         **/
        function documentInitalize (done) {
            var docHTML = getDocuemnt(),
                uploadData = {
                    uuid: UUID(),
                    html: docHTML,
                    meta: {
                        scrollTop: document.body.scrollTop
                    },
                    inspectorId: inspectorId
                };
            documentUpload(uploadData, done);
        }

        function documentUpload (data, done) {
            documentPost(data, function () {
                baseDocumentData = data;
                done && done();
            }, function () {
                documentUpload(data, done);
            });
        }

        function documentPost (data, success, error) {
            $ajax({
                method: 'POST',
                url: '/html?<%= inspectorId %>',
                type: 'text/plain',
                data: JSON.stringify(data),
                withId: true
            }, function () {
                success && success();
            }, function () {
                error && error();
            });
        }
        /* =================================================================== */
        /**
         *  delta checking step
         **/
        function deltaCheckingStat () {
            dirtyChecking(function (dataPacket) {
                // call when check for the delta change
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
        /**
         *  Generate delata data when has dirty data, else if return null
         **/
        function genDetalData () {
            var checkedDoc = getDocuemnt(),
                scrollTop = document.body.scrollTop,
                dirtyDataPacket;

            if (checkedDoc != baseDocumentData.html) {
                dirtyDataPacket = {
                    uuid: baseDocumentData.uuid,
                    html: checkedDoc,
                    delta: differ.diff(baseDocumentData.html, checkedDoc),
                    meta: {
                        scrollTop: scrollTop
                    },
                    inspectorId: inspectorId
                }
                // dirty checking callback
                return dirtyDataPacket;
            }
            return null;
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
            if (queueProcessing) {
                // task queue manager is working now
                return;
            } else {
                queueProcess();
            }
        }

        function queueProcess () {
            if (dataPacketQueue.length == 0) {
                // stop when the queue is empty
                queueProcessing = false;
                return;
            }
            queueProcessing = true;

            var taskData = dataPacketQueue[0];

            documentPost(taskData, function () {
                dataPacketQueue.shift();
                queueProcess();
            }, function () {
                queueProcess();
            });
        }


        /* =================================================================== */
        /**
         *  replace cross-domain's stylesheets
         **/
        window.addEventListener('load', function () {
            // document base content initial upload
            documentInitalize(function () {
                // delta upload after base document upload done
                deltaCheckingStat();
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
                    // console.log('success');
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
