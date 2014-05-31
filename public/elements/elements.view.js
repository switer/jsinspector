var app = new Vue({
    el: '#wrapper'
});

function getCssTules (cssText) {
    if (!cssText) return '';
    return cssText.replace(/^[^{]*\s*\{/, '').replace(/\}\s*$/, '');
}
var stylesList = new Vue({
    parent: app,
    template: $('#tpl-style-list').html(),
    data: {
        styleSheets: [],
        sheets: []
    },
    filters: {
        cssRules: getCssTules,
        source: function (href) {
            return href.match(/[^\/]*$/)[0];
        }
    },
    ready: function () {
        this.styleSheetsChange = function () {
            this.sheets = this.format(this.styleSheets);
        }.bind(this);

        this.$watch('styleSheets', this.styleSheetsChange);
    },
    beforeDestroy: function () {
        this.$unwatch('styleSheets', this.styleSheetsChange);
    },
    methods: {
        format: function (styleSheets) {
            styleSheets = JSON.parse(JSON.stringify(styleSheets));
            
            styleSheets.forEach(function (item, index) {
                var cssRuleStr = getCssTules(item.cssText),
                    cssRules = cssRuleStr.split(';'),
                    styleRules = [];

                cssRules.forEach(function (styleRule, sindex) {
                    styleRule = styleRule.trim();
                    if (styleRule) {
                        var spliter = styleRule.split(':');
                        if (spliter.length < 2) return;

                        styleRules.push({
                            selector: spliter[0].trim(),
                            value: spliter[1].trim()
                        });

                    }
                });
                item.styleRules = styleRules;
            });

            styleSheets.unshift({
                styleRules: [],
                href: '',
                cssText: '',
                selectorText: 'element.style'
            });
            return styleSheets;
        }
    }
});

stylesList.$appendTo(app.$el);