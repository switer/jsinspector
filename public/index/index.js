!(function () {
    /* =================================================================== */

    function UUID() {
        var uuid = localStorage.getItem('__jsinspector_uuid__');
        if (uuid) return uuid;
        else {
            uuid = UUID.generate();
            localStorage.setItem('__jsinspector_uuid__', uuid);
            return uuid;
        }
    }

    UUID.generate = function () {
        return 'xxxx-yxxyx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        }).toUpperCase();
    }

    function createScript () {
        var script = '<script src="{{host}}/inspector?{{inspectId}}"></script>',
            $scriptContainer = document.querySelector('#script'),
            code = script.replace('{{host}}', window.location.origin)
                        .replace('{{inspectId}}', UUID())
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/\s+([a-zA-Z\-]+?)\=&quot;/g, ' <span class="attr"> $1</span><span class="equal">=</span>&quot;')
                        .replace(/=&quot;(.+?)&quot;/g, '=<span class="string">&quot;$1&quot;</span>')
                        .replace(/&lt;([a-zA-Z]+?)\s/g, '&lt;<span class="tagname">$1 </span>')
                        .replace(/\/([a-zA-Z]+?)&gt;/g, '<span class="tagclose">/</span><span class="tagname">$1</span>&gt;')
                        .replace(/&lt;/g, '<span class="tag">&lt;</span>')
                        .replace(/&gt;/g, '<span class="tag">&gt;</span>')
                         // inspector highligt
                        .replace(/\?([a-zA-Z0-9]+)\-([a-zA-Z0-9]+)/g, '<span class="inspid">?$1-$2</span>')

        $scriptContainer.innerHTML = code;
    }

    createScript();
    
    var $devtoolsButton = document.querySelector('#devtoolsButton');
    function updateDevtoolsLink () {
        $devtoolsButton.href = window.location.origin + '/devtools?' + UUID();
    }

    document.querySelector('#createButton').onclick = function () {
        localStorage.removeItem('__jsinspector_uuid__')
        createScript();
        updateDevtoolsLink();
    }

})();
