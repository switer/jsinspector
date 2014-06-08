!(function (exports) {
    /**
     *  Line intent formater
     **/
    function lineIntent (codeStr) {
        var lines = codeStr.split(/\n/), 
            fmLines = [],
            intentMinLength;

        // get min intent
        lines.forEach(function (line, index) {
            if (!index && !line.trim()) return;
            var intents = line.match(/^\s*/)[0];
            if (intentMinLength == undefined || (intents.length < intentMinLength && line.trim()) ) {
                intentMinLength = intents.length;
            }
            fmLines.push(line);
        });
        // default to 0
        intentMinLength = intentMinLength || 0;
        // replace intent and replace space of &nbsp;
        var regexp = new RegExp('^\\s{0,@}'.replace('@', intentMinLength), 'g');
        // use white space intent
        fmLines.forEach(function (line, index) {
            line = line.replace(regexp, '');
            var intents = line.match(/^\s*/)[0];
            intents = intents.replace(/\s/g, '&nbsp;');
            fmLines[index] = line.replace(/^\s*/, intents)

        });

        return fmLines.join('<br />');
    }
    /**
     *  HTML syntax render
     **/
    function renderHTML (codeStr) {
        var code = codeStr.replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;')
                        .replace(/(\s)([a-zA-Z\-]+?)\=/g, '$1<span class="attr">$2</span><span class="equal">=</span>')
                        .replace(/&lt;!--([\s\S]*?)--&gt;/g, '<span class="comment">&lt;!--$1--&gt;</span>')
                        .replace(/\=&quot;(.+?)&quot;/g, '=<span class="string">&quot;$1&quot;</span>')
                        .replace(/&lt;([a-zA-Z\-]+?)(\s)/g, '&lt;<span class="tagname">$1</span>$2')
                        .replace(/\/([a-zA-Z\-]+?)&gt;/g, '<span class="tagclose">/</span><span class="tagname">$1</span>&gt;')
                        .replace(/&lt;/g, '<span class="tag">&lt;</span>')
                        .replace(/&gt;/g, '<span class="tag">&gt;</span>')


        return lineIntent(code);
    }
    /**
     *  command syntax render
     **/
    function renderCommand (codeStr) {
        var code = codeStr.replace(/\n(\s*)([a-zA-Z\-]+)(?=\s|$)/g, '\n$1<span class="sh">$2</span>')
                        .replace(/##([^\r\n]*)/g, '<span class="cmdComment">##$1</span>')
        return lineIntent(code);
    }
    /**
     *  HTML syntax render
     **/
    function renderCss (codeStr) {
        var code = codeStr.replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;')
                        .replace(/(&quot;|&apos;)(.*?)(&quot;|&apos;)/g, '<span class="cssString">$1$2$3</span>')
                        .replace(/\/\*([\s\S]*?)\*\//g, '<span class="cssComment">/*$1*/</span>')
                        .replace(/(\n|\})(\s*)([^{}\/\*]+)(?=\{)/g, '$1$2<span class="selector">$3</span>')
                        .replace(/(\{|\;)(\s*)([a-zA-Z0-9\-]+)(?=\s*\:)/g, '$1$2<span class="property">$3</span>')
                        .replace(/\b(\d+?)(px|em|\%)/g, '<span class="number">$1</span><span class="unit">$2</span>')

        return lineIntent(code);
    }
    /**
     *  HTML syntax render
     **/
    function renderJs (codeStr) {
        var code = codeStr.replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;')    
                        .replace(/\/\*([\s\S]*?)\*\//g, '<span class="jsComment">/*$1*/</span>')
                        .replace(/([\+\-\^\~\!\%\|])/g, '<span class="operation">$1</span>')
                        .replace(/&quot;(.*?)&quot;/g, '<span class="jsString">&quot;$1&quot;</span>')
                        .replace(/&apos;(.*?)&apos;/g, '<span class="jsString">&apos;$1&apos;</span>')
                        .replace(
                            /(\b|\W|\s)(var|function|prototype|Array|String|Number|Boolean|Object|undefined|window|document|null|NaN)(\W|\b|\s)/gm, 
                            '$1<span class="keyword">$2</span>$3'
                        )
                        .replace(
                            /\.(log|call|apply|childNodes|appendChild|removeChild|body)(?=\b|\.)/g, 
                            '.<span class="keyword">$1</span>'
                        )
                        .replace(/([\[\]\{\}\(\)])/g, '<span class="bracket">$1</span>')
                        .replace(/\/\/([^\r\n]*)/g, '<span class="jsComment">//$1</span>')
 
        return lineIntent(code);
    }
    function renderDefault (codeStr) {
        var code = codeStr.replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;')

        return lineIntent(code);
    }
    /**
     *  syntax detection method, currently only support html and css detecting
     **/
    function syntaxDetect (codeStr) {
        if (codeStr.match(/^\s*\</) || codeStr.match(/\>\s*$/)) return 'html';
        else if (codeStr.replace(/^\s*?\/\*.*?\*\/\s*?/mg, '')
            .match(/^\s*?([a-zA-Z0-9\-\_\,\#\.\s]+?)(?=(\:[a-zA-Z\-]+|\s*)\{(.*?)\})/)) return 'css';
        else return 'js';
    }

    var Colo = {
        render: function (type, codeStr) {
            var args = Array.prototype.slice.call(arguments);

            if (args.length == 1) {
                // use syntaxt detection for auto type
                codeStr = type;
                type = syntaxDetect(codeStr);
            }

            switch (type) {
                case 'js': return renderJs(codeStr);break;
                case 'css': return renderCss(codeStr);break;
                case 'html': return renderHTML(codeStr);break;
                case 'command': return renderCommand(codeStr);break;
                default: return renderDefault(codeStr);
            }
        }
    }
    /**
     *  Rendering Colo template-elements
     **/
    document.addEventListener('DOMContentLoaded', function () {
        var codeElements = Array.prototype.slice.call(document.querySelectorAll('[type|="text/colo"]') || []);
        codeElements.forEach(function (element) {
            var type = element.getAttribute('type'),
                $parent = element.parentNode,
                $code = document.createElement('code'),
                args = [],
                attributes = Array.prototype.slice.call(element.attributes || []);

            type = type.replace(/text\/colo[\-]*/, '');
            if (type) {
                args.push(type);
            }
            attributes.forEach(function (attr) {
                $code.setAttribute(attr.nodeName, attr.nodeValue);
            });
            args.push(element.innerHTML);
            $code.innerHTML = Colo.render.apply(Colo, args);
            $parent.replaceChild($code, element);
        });

    });

    exports.Colo = Colo;
})(this);


