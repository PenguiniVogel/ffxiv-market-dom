module Script {

    interface WorldResponseItem {
        itemID: number,
        regularSaleVelocity: number,
        averagePrice: number,
        minPrice: number,
        worldName: string
    }

    interface WorldResponse {
        items: WorldResponseItem[]
        indexMap: {
            [id: number]: number
        }
    }

    declare var ffxiv_item_map: {
        [id: string]: {
            'en': string
        }
    };

    declare var ffxiv_market_map: number[];

    const WORLDS: string[] = [
        'Cerberus',
        'Louisoix',
        'Moogle',
        'Omega',
        'Ragnarok',
        'Spriggan'
    ];

    const ITEM_LIST : number[] = [
        5371,
        21800
    ];

    let currentTimer = -1;

    let responses: {
        [world: string]: WorldResponse
    } = {};

    let container = document.getElementById('item-container');
    let suggestions = document.getElementById('suggestions');

    function init(): void {
        for (let item of ITEM_LIST) {
            container.innerHTML += createHTMLRow(item);
        }

        document.getElementById('search-input').addEventListener('keyup', (e) => {
            if (currentTimer > -1) {
                clearTimeout(currentTimer);
                currentTimer = -1;
            }

            currentTimer = setTimeout(() => {
                currentTimer = -1;
                search((<HTMLInputElement>e.target).value);
            }, 250);
        });

        for (let k of WORLDS) {
            fetch(`https://universalis.app/api/${k}/${ITEM_LIST.join('%2C')}?listings=0&entries=0`).then(res => {
                res.json().then(json => {
                    let resp: WorldResponse = typeof json == 'object' ? json : JSON.parse(json);
                    resp.indexMap = {};

                    for (let i = 0, l = resp.items.length; i < l; i ++) {
                        let item = resp.items[i];
                        resp.indexMap[item.itemID] = i;
                    }

                    responses[k] = resp;

                    checkAllAvailable();
                });
            });
        }
    }

    function search(search: string): void {
        let results: string[] = [];

        for (let key of Object.keys(ffxiv_item_map)) {
            if (ffxiv_item_map[key].en.toLowerCase().indexOf(search) > -1 && ffxiv_market_map.indexOf(+key) > -1) {
                results.push(`
<div class="col bg-light text-dark">
        <div class="row">
            <div class="col-1">
                <img width="28" src="https://universalis-ffxiv.github.io/universalis-assets/icon2x/${key}.png" alt="2x" />
            </div>
            <div class="col-10">${ffxiv_item_map[key].en}</div>
        </div>
    </div>
</div>`);
            }
        }

        console.debug(results);

        suggestions.innerHTML = results.join('');
    }

    function checkAllAvailable(): void {
        for (let k of WORLDS) {
            if (!responses[k]?.items) {
                return;
            }
        }

        console.debug('All loaded!', responses);

        let cheapest: {
            [id: number]: WorldResponseItem
        } = {};

        for (let i = 0, l = WORLDS.length; i < l; i ++) {
            let world = WORLDS[i];
            let data = responses[world];

            for (let item of data.items) {
                if (!cheapest[item.itemID]) {
                    cheapest[item.itemID] = item;
                }

                if (world == 'Moogle') {
                    document.querySelector(`[data-id="${item.itemID}"] [data-recentsales]`).innerHTML = `Recently sold: ${item.regularSaleVelocity.toFixed(0)} (stack) ~${item.averagePrice.toFixed(0)} Gil`;
                }

                if (item.minPrice < cheapest[item.itemID].minPrice) {
                    cheapest[item.itemID] = item;
                }
            }
        }

        for (let item_id of Object.keys(cheapest)) {
            let item: WorldResponseItem = cheapest[item_id];
            let main = document.querySelector(`[data-id="${item.itemID}"]`);

            main.querySelector('[data-cheapestworld]').innerHTML = item.worldName;
            main.querySelector('[data-cheapestprice]').innerHTML = `${item.minPrice} Gil`;

            let moogle = responses['Moogle'];
            let homeItem = moogle.items[moogle.indexMap[item.itemID]];
            let max = Math.max(homeItem.minPrice, item.minPrice * 1.05);
            let min = Math.min(homeItem.minPrice, item.minPrice * 1.05);
            let profit = homeItem.minPrice > item.minPrice * 1.05;

            main.querySelector('[data-currentprice]').innerHTML = `${homeItem.minPrice} Gil`;
            main.querySelector('[data-cheapestdiff]').innerHTML = `<span class="${profit ? 'text-success' : 'text-danger'}">${profit ? '+' : '-'}${(((max - min)/max) * 100).toFixed(2)}%</span>`;
        }
    }

    function createHTMLRow(id: number): string {
        return `
        <div data-id="${id}" class="row" style="margin-bottom: 5px;">
            <div class="col">
                <div class="row">
                    <div class="col-1">
                        <img width="28" src="https://universalis-ffxiv.github.io/universalis-assets/icon2x/${id}.png" />
                    </div>
                    <div class="col">
                        <div>${ffxiv_item_map[`${id}`].en} <span class="small text-secondary" data-currentprice></span></div>
                        <div class="col small text-secondary" data-recentsales>Recently sold: ???</div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="row">
                    <div class="col" data-cheapestworld>???</div>
                </div>
                <div class="row">
                    <div class="col-3 small" data-cheapestprice>???</div>
                    <div class="col-3" data-cheapestdiff>???</div>
                </div>
            </div>
        </div>
        `;
    }

    init();

}
