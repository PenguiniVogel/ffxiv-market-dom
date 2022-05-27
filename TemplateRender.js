var TemplateRender;
(function (TemplateRender) {
    function renderTemplate(id, params) {
        var template = document.querySelector("template#".concat(id)).innerHTML;
        var templateVars = template.match(/\$\{[a-z_A-Z]+\}/gi);
        console.debug("[TemplateRender] Loaded '".concat(id, "' with:"), templateVars);
        for (var _i = 0, templateVars_1 = templateVars; _i < templateVars_1.length; _i++) {
            var templateVar = templateVars_1[_i];
            var stripped = templateVar.replace(/[${}]/g, '');
            if (!params[stripped]) {
                console.error("[TemplateRender] Missing param: ".concat(stripped));
                return '<div>Template Error!</div>';
            }
            template = template.replace(new RegExp("\\$\\{".concat(stripped, "\\}"), 'g'), params[stripped]);
        }
        return template;
    }
    TemplateRender.renderTemplate = renderTemplate;
})(TemplateRender || (TemplateRender = {}));
