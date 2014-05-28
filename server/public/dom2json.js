/**
 *  Covert DOM tree to JSON structure
 **/
(function (exports) {
    'use strict;'

    /**
    *  Get node's tag HTML such as getNodeHTML(document.body) -> <body></body>
    **/
    function getNodeHTML (node) {
        return node.outerHTML.replace('>' + node.innerHTML + '<', '><');
    }
    /**
     *  Covert DOM tree to JSON structure
     **/
    exports.convertDOM2JSON = function (node) {
        if (node.nodeType == 1) {
            if (!node.childNodes || node.childNodes.length == 0) return node.outerHTML;

            var childNodes = Array.prototype.slice.call(node.childNodes);
            var children = [];
            childNodes.forEach(function (item) {
                children.push(convertDOM2JSON(item));
            });
            return {h: getNodeHTML(node), c: children};
        } else if (node.nodeType == 3){
            return node.textContent;
        } else {
            return ''
        }
    };
})(window);