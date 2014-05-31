!(function () {
    /* =================================================================== */

    function UUID() {
        return 'xxxxxx-yxxxyx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        }).toUpperCase();
    }

    var script = '<script src="{{host}}/inspector?{{inspectId}}"></script>',
        scriptContainer = document.querySelector('#script'),
        code = script.replace('{{host}}', window.location.origin)
                    .replace('{{inspectId}}', UUID())
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"([^"]*?)"/g, '<span class="string">"$1"</span>')
                    .replace(/&lt;/g, '<span class="tag">&lt;</span>')
                    .replace(/&gt;/g, '<span class="tag">&gt;</span>')

    scriptContainer.innerHTML = code;

    window.gotoInspector = function () {
        window.open(window.location.origin + '/devtools?' + UUID());
    }
})();
