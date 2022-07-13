module TemplateRender {

    export interface TemplateDFExpanded {
        itemID: string,
        itemName: string,
        nqDisplay: 'display: table-row;' | 'display: none;',
        hqDisplay: 'display: table-row;' | 'display: none;',
        homeWorldName: string,
        homeNQPrice: string,
        homeNQSaleVelocity: string,
        homeHQPrice: string,
        homeHQSaleVelocity: string,
        cheapestNQWorldName: string,
        cheapestHQWorldName: string,
        cheapestNQPrice: string,
        cheapestNQSaleVelocity: string,
        cheapestNQDiff: string,
        cheapestHQPrice: string,
        cheapestHQSaleVelocity: string,
        cheapestHQDiff: string,
        expensiveNQWorldName: string,
        expensiveHQWorldName: string,
        expensiveNQPrice: string,
        expensiveNQSaleVelocity: string,
        expensiveNQDiff: string,
        expensiveHQPrice: string,
        expensiveHQSaleVelocity: string,
        expensiveHQDiff: string
    }

    export type TemplateParams = { [key: string]: string } | TemplateDFExpanded;

    export function renderTemplate(id: string, params: TemplateParams): string {
        let template = document.querySelector(`template#${id}`).innerHTML;
        let templateVars = template.match(/\$\{[a-z_A-Z]+\}/gi);

        console.debug(`[TemplateRender] Loaded '${id}'`);

        for (let templateVar of templateVars) {
            let stripped = templateVar.replace(/[${}]/g, '');
            if (!params[stripped]) {
                console.error(`[TemplateRender] Missing param: ${stripped}`);
                return '<div>Template Error!</div>';
            }

            template = template.replace(new RegExp(`\\\$\\\{${stripped}\\\}`, 'g'), params[stripped]);
        }

        return template;
    }

}
