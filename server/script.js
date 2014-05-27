(function () {
    var slice = Array.prototype.slice,
        iframe = document.createElement('iframe'),
        requestHandlers = {},
        lastPostHTML = '',
        requestId = 0,
        inspectorId = '<%= inspectorId %>';

    /**
     *  create iframe for CORS
     **/
    iframe.style.display = 'none';
    iframe.src = '<%= host %>/client_frame.html';
    iframe.id = '__jsinspector_cors_iframe';
    document.body.appendChild(iframe);

    /**
     *  comment
     **/
    function sendStyleRules () {
        // TODO post inpect data
    }

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
     *  get document html
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

    function postDocument (success, error) {
        var html = getDocuemnt();

        if (html == lastPostHTML) {
            success && success();
            return;
        }

        lastPostHTML = html;

        $ajax({
            method: 'POST',
            url: '/html?<%= inspectorId %>',
            type: 'text/plain',
            data: JSON.stringify({
                html: html,
                meta: {
                    scrollTop: document.body.scrollTop
                },
                inspectorId: inspectorId
            }),
            withId: true
        }, function () {
            success && success();
        }, function () {
            error && error();
        });
    }

    function syncMeta () {
        window.addEventListener('scroll', function () {
            $ajax({
                method: 'POST',
                url: '/html?<%= inspectorId %>',
                type: 'text/plain',
                data: JSON.stringify({
                    meta: {
                        scrollTop: document.body.scrollTop
                    },
                    inspectorId: inspectorId
                }),
                withId: true
            }); 
        });
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

        /**
         *  replace cross-domain's stylesheets
         **/
        window.addEventListener('load', function () {
/*            replaceCORSStyleSheet(function () {
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

            function postCallback () {
                postDocument(function () {
                    setTimeout(postCallback, 300);
                });
            }
            postCallback();
            syncMeta();
        });
    }
})();
