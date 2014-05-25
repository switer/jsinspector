(function () {
    var iframe = document.createElement('iframe'),
        requestHandlers = {},
        requestId = 0;

    /**
     *  create iframe for CORS
     **/
    iframe.style.display = 'none';
    iframe.src = '/iframe';
    document.body.appendChild(iframe);

    /**
     *  comment
     **/
    function sendStyleRules () {
        // TODO post inpect data
    }

    function getMatchesRules ($el) {
        var slice = Array.prototype.slice,
            styleSheets = slice.call(document.styleSheets),
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
        var slice = Array.prototype.slice,
            styleSheets = slice.call(document.styleSheets),
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


    /* =================================================================== */
    /**
     *  get resource content with url
     **/
    function getResource (url, success, error) {
        var id = requestId ++; 

        iframe.contentWindow.postMessage({
            id: id,
            url: url
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
            replaceCORSStyleSheet(function () {
                var matchesRules = getMatchesRules(document.body);
                console.log(matchesRules);
            });
        });
    }
})();
