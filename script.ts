declare var ffxiv_item_map: {
    [id: string]: {
        'en': string
    }
};

declare var ffxiv_market_map: number[];

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
        21800,
        ...Cookie.storedList
    ];

    let currentTimer = -1;

    let responses: {
        [world: string]: WorldResponse
    } = {};

    let container = document.getElementById('item-container');
    let suggestions = document.getElementById('suggestions');
    let searchInput = <HTMLInputElement>document.getElementById('search-input');

    function init(): void {
        for (let item of ITEM_LIST) {
            container.innerHTML += createHTMLRow(item);
        }

        function hideEvent(e: KeyboardEvent): void {
            if (e.code == 'Escape') {
                hideSearch();
            }
        }

        document.addEventListener('keyup', hideEvent);
        document.addEventListener('click', () => hideSearch());

        searchInput.addEventListener('keyup', () => {
            if (currentTimer > -1) {
                clearTimeout(currentTimer);
                currentTimer = -1;
            }

            currentTimer = setTimeout(() => {
                currentTimer = -1;
                let val = searchInput.value;

                if (val.length < 2) {
                    hideSearch(false);
                    return;
                }

                search(val);
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

        let count = 0;
        for (let key of Object.keys(ffxiv_item_map)) {
            if (count >= 50) break;

            if (ffxiv_item_map[key].en.toLowerCase().indexOf(search.toLowerCase()) > -1 && ffxiv_market_map.indexOf(+key) > -1 && ITEM_LIST.indexOf(+key) == -1) {
                count ++;
                results.push(`
<div class="col bg-light text-dark" data-itemid="${key}" onclick="Script.addTracking(${key});">
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

        suggestions.innerHTML = results.join('\n');
    }

    function hideSearch(setInput: boolean = true): void {
        suggestions.innerHTML = '';

        if (setInput) {
            (<HTMLInputElement>document.getElementById('search-input')).value = '';
        }
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
                    <div class="col-1"${(id == 5371 || id == 21800) ? '' : ` data-delete onclick="Script.removeTracking(${id});"`}>
                        <img width="28" alt="2x" src="https://universalis-ffxiv.github.io/universalis-assets/icon2x/${id}.png" />
                    </div>
                    <div class="col">
                        <div><a class="nav-link" href="https://universalis.app/market/${id}" target="_blank">${ffxiv_item_map[`${id}`].en}</a> <span class="small text-secondary" data-currentprice></span></div>
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

    export function addTracking(id: number): void {
        hideSearch();

        Cookie.storedList.push(id);
        Cookie.save();

        window.location.reload();
    }

    export function removeTracking(id: number): void {
        if (id == 5371 || id == 21800) {
            return;
        }

        if (confirm(`Remove ${ffxiv_item_map[id].en} (${id}) from being tracked?`)) {
            hideSearch();

            Cookie.storedList = Cookie.storedList.filter(x => x != id);
            Cookie.save();

            window.location.reload();
        }
    }

    // start
    init();

}
