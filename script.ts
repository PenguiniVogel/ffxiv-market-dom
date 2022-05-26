module Script {

    const PAGE_MAP = {
        'main': 1,
        'bestseller': 2
    };

    const WORLDS: string[] = [
        'Cerberus',
        'Louisoix',
        'Moogle',
        'Omega',
        'Ragnarok',
        'Spriggan'
    ];

    let ITEM_LIST : number[] = [
        5371,
        21800,
        ...Cookie.storedList
    ];

    let currentTimer = -1;
    let updateTimer = -1;

    let responses: {
        [world: string]: WorldResponse
    } = {};

    let container = document.getElementById('item-container');
    let suggestions = document.getElementById('suggestions');
    let searchInput = <HTMLInputElement>document.getElementById('search-input');
    let topBody = <HTMLElement>document.querySelector('#topSales tbody');

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

        document.querySelectorAll('nav button[data-page]').forEach((btn: HTMLElement) => {
            btn.addEventListener('click', (e) => {
                page(+(<HTMLElement>e.target).getAttribute('data-page'));
            });
        });

        if (window?.location?.href?.indexOf('#bestseller') > -1) {
            page(PAGE_MAP['bestseller']);
        }

        loadData();
        loadWeekly();
    }

    function loadData(): void {
        responses = {};

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

        if (Cookie.storedList.indexOf(id) > -1) {
            return;
        }

        Cookie.storedList.push(id);
        Cookie.save();

        ITEM_LIST.push(id);

        container.innerHTML += createHTMLRow(id);

        if (updateTimer == -1) {
            updateTimer = setTimeout(() => {
                loadData();
                updateTimer = -1;
            }, 5000);
        }
    }

    export function addBestseller(id: number): void {
        let btn = document.querySelector(`button[data-addref="${id}"]`);

        if (!btn) {
            return;
        }

        btn.removeAttribute('onclick');

        btn.setAttribute('class', 'bg-success');
        btn.setAttribute('data-addref', '-1');

        addTracking(id);
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

    export function page(nr: number): void {
        document.querySelectorAll('e[id^="page"]').forEach((e: HTMLElement) => e.setAttribute('style', 'display: none;'));
        document.querySelectorAll('nav button[data-page]').forEach((e: HTMLElement) => e.setAttribute('class', 'nav-item"'));

        document.querySelector(`button[data-page="${nr}"]`).setAttribute('class', 'nav-item text-light bg-success');
        document.querySelector(`e#page${nr}`).setAttribute('style', '');
    }

    function loadWeekly(): void {
        let sorted = weekly_dump.sort((a, b) => {
            return a.regularSaleVelocity > b.regularSaleVelocity ? -1 : 1;
        });

        let top = sorted.slice(0, 100).sort((a, b) => a.averagePrice > b.averagePrice ? -1 : 1);

        console.debug(top);

        function createTR(i: number, item: WorldResponseItem): string {
            function displayNoneOrEmpty(input: number, outStr: string): string {
                return input < 0.0001 ? '<span class="text-danger">---</span>' : outStr;
            }

            return `
            <tr>
                <td class="text-center">
                    <button data-addref="${item.itemID}" ${ITEM_LIST.indexOf(item.itemID) > -1 ? 'class="text-light bg-success"' : `class="text-dark bg-light" onclick="Script.addBestseller(${item.itemID});"`} >&check;</button>
                </td>
                <td class="text-center">&nbsp;#${i}&nbsp;</td>
                <td>
                    <img width="24" alt="2x" src="https://universalis-ffxiv.github.io/universalis-assets/icon2x/${item.itemID}.png" />
                </td>
                <td>&nbsp;${ffxiv_item_map[item.itemID].en}&nbsp;</td>
                <td class="text-secondary text-center">&nbsp;(${item.itemID})&nbsp;</td>
                <td class="text-center">&nbsp;${displayNoneOrEmpty(item.averagePrice, (item.averagePrice).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNoneOrEmpty(item.averagePriceNQ, (item.averagePriceNQ).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNoneOrEmpty(item.averagePriceHQ, (item.averagePriceHQ).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNoneOrEmpty(item.regularSaleVelocity, (item.regularSaleVelocity).toFixed(3))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNoneOrEmpty(item.nqSaleVelocity, (item.nqSaleVelocity).toFixed(3))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNoneOrEmpty(item.hqSaleVelocity, (item.hqSaleVelocity).toFixed(3))}&nbsp;</td>
            </tr>`;
        }

        for (let i = 0, l = top.length; i < l; i ++) {
            topBody.innerHTML += createTR(i + 1, top[i]);
        }
    }

    // start
    init();

}
