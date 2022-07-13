module Script {

    const PAGE_MAP = {
        'main': 1,
        'bestseller': 2,
        'settings': 3
    };

    const WORLDS: string[] = [
        // Chaos
        'Cerberus',
        'Louisoix',
        'Moogle',
        'Omega',
        'Phantom',
        'Ragnarok',
        'Sagittarius',
        'Spriggan',
        // Light
        'Alpha',
        'Lich',
        'Odin',
        'Phoenix',
        'Raiden',
        'Shiva',
        'Twintania',
        'Zodiark'
    ];

    let ITEM_LIST : number[] = [
        21800,
        ...Cookie.storedList
    ];

    let currentTimer = -1;
    let updateTimer = -1;

    let responses: {
        [world: string]: WorldResponse
    } = {};

    let trackMinMax: {
        [itemID: number]: {
            home: WorldResponseItem,
            cheapestNQ: WorldResponseItem,
            cheapestHQ: WorldResponseItem,
            expensiveNQ: WorldResponseItem,
            expensiveHQ: WorldResponseItem,
        }
    } = {};

    let container = document.getElementById('item-container');
    let suggestions = document.getElementById('suggestions');
    let searchInput = <HTMLInputElement>document.getElementById('search-input');
    let topBody = <HTMLElement>document.querySelector('#topSales tbody');
    let worldSelect = <HTMLSelectElement>document.querySelector('#worldSelect');

    function init(): void {
        // for (let item of ITEM_LIST) {
        //     container.innerHTML += createHTMLRow(item);
        // }

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
        if (window?.location?.href?.indexOf('#settings') > -1) {
            page(PAGE_MAP['settings']);
        }

        for (let i = 0, l = worldSelect.options.length; i < l; i ++) {
            if (worldSelect.options.item(i).innerText == Cookie.homeWorld) {
                worldSelect.selectedIndex = i;
                break;
            }
        }

        worldSelect.addEventListener('input', () => {
            let option = worldSelect.selectedOptions[0].innerText;

            Cookie.homeWorld = WORLDS.indexOf(option) > -1 ? option : 'Moogle';
            Cookie.save();

            window.location.reload();
        });

        loadData();
        loadWeekly();
    }

    function loadData(): void {
        responses = {};

        if (ITEM_LIST.length < 1) {
            return;
        }

        let shift = 1;
        for (let k of WORLDS) {
            setTimeout(() => fetch(`https://universalis.app/api/v2/${k}/${ITEM_LIST.join('%2C')}?listings=0&entries=0`).then(res => {
                res.json().then(json => {
                    // console.debug(json);
                    // let resp: WorldResponse = typeof json == 'object' ? json : JSON.parse(json);
                    // resp.indexMap = {};
                    // for (let i = 0, l = resp.items.length; i < l; i ++) {
                    //     let item = resp.items[i];
                    //     resp.indexMap[item.itemID] = i;
                    // }
                    // responses[k] = resp;

                    responses[k] = typeof json == 'object' ? json : JSON.parse(json);

                    checkAllAvailable();
                });
            }), 200 * shift);

            shift ++;
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

    function displayNumOrEmpty(input: number, outStr?: string): string {
        return input < 0.0001 || isNaN(input) || !isFinite(input) ? '<span class="text-danger">---</span>' : outStr ?? `${input}`;
    }

    function checkAllAvailable(): void {
        for (let k of WORLDS) {
            if (!responses[k]?.items) {
                return;
            }
        }

        console.debug('All loaded!', responses);

        for (let i = 0, l = WORLDS.length; i < l; i ++) {
            let world = WORLDS[i];
            let data = responses[world];

            for (let itemID of data.itemIDs) {
                let itemData = data.items[itemID];

                if (!!!itemData) {
                    console.warn(`World ${world} has no data for '${ffxiv_item_map[itemID].en}' (${itemID})`);
                    continue;
                }

                if (!trackMinMax[itemID]) {
                    trackMinMax[itemID] = {
                        home: itemData,
                        cheapestNQ: itemData,
                        cheapestHQ: itemData,
                        expensiveNQ: itemData,
                        expensiveHQ: itemData
                    };
                }

                if (world == Cookie.homeWorld) {
                    trackMinMax[itemID].home = itemData;
                }

                if (itemData.minPriceNQ > 0 && itemData.minPriceNQ < trackMinMax[itemID].cheapestNQ.minPriceNQ) {
                    trackMinMax[itemID].cheapestNQ = itemData;
                }
                if (itemData.minPriceHQ > 0 && itemData.minPriceHQ < trackMinMax[itemID].cheapestHQ.minPriceHQ) {
                    trackMinMax[itemID].cheapestHQ = itemData;
                }
                if (itemData.minPriceNQ > 0 && itemData.minPriceNQ > trackMinMax[itemID].expensiveNQ.minPriceNQ) {
                    trackMinMax[itemID].expensiveNQ = itemData;
                }
                if (itemData.minPriceHQ > 0 && itemData.minPriceHQ > trackMinMax[itemID].expensiveHQ.minPriceHQ) {
                    trackMinMax[itemID].expensiveHQ = itemData;
                }
            }
        }

        console.debug('MinMax Loaded', trackMinMax);

        // for (let item_id of Object.keys(cheapest)) {
        //     let itemNQ: WorldResponseItem = cheapest[item_id].nq;
        //     let itemHQ: WorldResponseItem = cheapest[item_id].hq;
        //     let main = document.querySelector(`[data-id="${itemNQ.itemID}"]`);
        //
        //     main.querySelector('[data-cheapestworld-nq]').innerHTML = itemNQ.worldName;
        //     main.querySelector('[data-cheapestprice-nq]').innerHTML = `${itemNQ.minPriceNQ} Gil (NQ)`;
        //
        //     main.querySelector('[data-cheapestworld-hq]').innerHTML = itemHQ.worldName;
        //     main.querySelector('[data-cheapestprice-hq]').innerHTML = `${itemHQ.minPriceHQ} Gil (HQ)`;
        //
        //     let homeWorld = responses[Cookie.homeWorld];
        //     let homeItem = homeWorld.items[homeWorld.indexMap[itemNQ.itemID]];
        //
        //     let maxNQ = Math.max(homeItem.minPriceNQ, itemNQ.minPriceNQ * 1.05);
        //     let minNQ = Math.min(homeItem.minPriceNQ, itemNQ.minPriceNQ * 1.05);
        //     let profitNQ = homeItem.minPriceNQ > itemNQ.minPriceNQ * 1.05;
        //
        //     let maxHQ = Math.max(homeItem.minPriceHQ, itemHQ.minPriceHQ * 1.05);
        //     let minHQ = Math.min(homeItem.minPriceHQ, itemHQ.minPriceHQ * 1.05);
        //     let profitHQ = homeItem.minPriceHQ > itemHQ.minPriceHQ * 1.05;
        //
        //     main.querySelector('[data-currentprice-nq]').innerHTML = `${homeItem.minPriceNQ} Gil (NQ)`;
        //     main.querySelector('[data-cheapestdiff-nq]').innerHTML = `<span class="${profitNQ ? 'text-success' : 'text-danger'}">${profitNQ ? '+' : '-'}${(((maxNQ - minNQ)/maxNQ) * 100).toFixed(2)}%</span>`;
        //
        //     main.querySelector('[data-currentprice-hq]').innerHTML = `${homeItem.minPriceHQ} Gil (HQ)`;
        //     main.querySelector('[data-cheapestdiff-hq]').innerHTML = `<span class="${profitHQ ? 'text-success' : 'text-danger'}">${profitHQ ? '+' : '-'}${(((maxHQ - minHQ)/maxHQ) * 100).toFixed(2)}%</span>`;
        // }

        for (let key of ITEM_LIST) {
            addTrackingRow(key);
        }
    }

    function addTrackingRow(id: number): void {
        let homeItem = trackMinMax[id].home;
        let cheapestItemNQ = trackMinMax[id].cheapestNQ;
        let cheapestItemHQ = trackMinMax[id].cheapestHQ;
        let expensiveItemNQ = trackMinMax[id].expensiveNQ;
        let expensiveItemHQ = trackMinMax[id].expensiveHQ;

        let hasNQ = homeItem.minPriceNQ > 0 && cheapestItemNQ.minPriceNQ > 0 && expensiveItemNQ.minPriceNQ > 0;
        let hasHQ = homeItem.minPriceHQ > 0 && cheapestItemHQ.minPriceHQ > 0 && expensiveItemHQ.minPriceHQ > 0;

        let minCheapestNQ = Math.min(homeItem.minPriceNQ, cheapestItemNQ.minPriceNQ * 1.05);
        let maxCheapestNQ = Math.max(homeItem.minPriceNQ, cheapestItemNQ.minPriceNQ * 1.05);
        let profitCheapestNQ = homeItem.minPriceNQ > cheapestItemNQ.minPriceNQ * 1.05;
        let cheapestNQDiff = ((maxCheapestNQ - minCheapestNQ)/maxCheapestNQ) * 100;

        let minCheapestHQ = Math.min(homeItem.minPriceHQ, cheapestItemHQ.minPriceHQ * 1.05);
        let maxCheapestHQ = Math.max(homeItem.minPriceHQ, cheapestItemHQ.minPriceHQ * 1.05);
        let profitCheapestHQ = homeItem.minPriceHQ > cheapestItemHQ.minPriceHQ * 1.05;
        let cheapestHQDiff = ((maxCheapestHQ - minCheapestHQ)/maxCheapestHQ) * 100;

        let minExpensiveNQ = Math.min(cheapestItemNQ.minPriceNQ, expensiveItemNQ.minPriceNQ * 1.05);
        let maxExpensiveNQ = Math.max(cheapestItemNQ.minPriceNQ, expensiveItemNQ.minPriceNQ * 1.05);
        let profitExpensiveNQ = cheapestItemNQ.minPriceNQ < expensiveItemNQ.minPriceNQ * 1.05;
        let expensiveNQDiff = (maxExpensiveNQ / minExpensiveNQ) * 100;

        let minExpensiveHQ = Math.min(cheapestItemHQ.minPriceHQ, expensiveItemHQ.minPriceHQ * 1.05);
        let maxExpensiveHQ = Math.max(cheapestItemHQ.minPriceHQ, expensiveItemHQ.minPriceHQ * 1.05);
        let profitExpensiveHQ = cheapestItemHQ.minPriceHQ < expensiveItemHQ.minPriceHQ * 1.05;
        let expensiveHQDiff = (maxExpensiveHQ / minExpensiveHQ) * 100;

        function formatPrice(price: number): string {
            return displayNumOrEmpty(price, `${price.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Gil`);
        }

        function formatSaleVelocity(vel: number): string {
            return displayNumOrEmpty(vel, `${vel.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`);
        }

        function formatDiff(profit: boolean, diff: number): string {
            return displayNumOrEmpty(diff, `<span class="${profit ? 'text-success' : 'text-danger'}">${profit ? '+' : '-'} ${diff.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>`);
        }

        let generatedRow = TemplateRender.renderTemplate(Cookie.storedSettings.displayFormat, <TemplateRender.TemplateDFExpanded>{
            itemID: `${homeItem.itemID}`,
            itemName: ffxiv_item_map[homeItem.itemID].en,
            nqDisplay: hasNQ ? 'display: table-row;' : 'display: none;',
            hqDisplay: hasHQ ? 'display: table-row;' : 'display: none;',
            homeWorldName: homeItem.worldName,
            homeNQPrice: formatPrice(homeItem.minPriceNQ),
            homeNQSaleVelocity: formatSaleVelocity(homeItem.nqSaleVelocity),
            homeHQPrice: formatPrice(homeItem.minPriceHQ),
            homeHQSaleVelocity: formatSaleVelocity(homeItem.hqSaleVelocity),
            // cheapestNQWorldName: hasCheapestNQ ? cheapestItemNQ.worldName : '<span class="text-danger">---</span>',
            // cheapestHQWorldName: hasCheapestHQ ? cheapestItemHQ.worldName : '<span class="text-danger">---</span>',
            cheapestNQWorldName: cheapestItemNQ.worldName,
            cheapestHQWorldName: cheapestItemHQ.worldName,
            cheapestNQPrice: formatPrice(cheapestItemNQ.minPriceNQ),
            cheapestNQSaleVelocity: formatSaleVelocity(cheapestItemNQ.nqSaleVelocity),
            cheapestNQDiff: formatDiff(profitCheapestNQ, cheapestNQDiff),
            cheapestHQPrice: formatPrice(cheapestItemHQ.minPriceHQ),
            cheapestHQSaleVelocity: formatSaleVelocity(cheapestItemHQ.hqSaleVelocity),
            cheapestHQDiff: formatDiff(profitCheapestHQ, cheapestHQDiff),
            // expensiveNQWorldName: hasExpensiveNQ ? expensiveItemNQ.worldName : '<span class="text-danger">---</span>',
            // expensiveHQWorldName: hasExpensiveHQ ? expensiveItemHQ.worldName : '<span class="text-danger">---</span>',
            expensiveNQWorldName: expensiveItemNQ.worldName,
            expensiveHQWorldName: expensiveItemHQ.worldName,
            expensiveNQPrice: formatPrice(expensiveItemNQ.minPriceNQ),
            expensiveNQSaleVelocity: formatSaleVelocity(expensiveItemNQ.nqSaleVelocity),
            expensiveNQDiff: formatDiff(profitExpensiveNQ, expensiveNQDiff),
            expensiveHQPrice: formatPrice(expensiveItemHQ.minPriceHQ),
            expensiveHQSaleVelocity: formatSaleVelocity(expensiveItemHQ.hqSaleVelocity),
            expensiveHQDiff: formatDiff(profitExpensiveHQ, expensiveHQDiff),
        });

        container.innerHTML += generatedRow;
    }

    export function addTracking(id: number): void {
        hideSearch();

        if (Cookie.storedList.indexOf(id) > -1) {
            return;
        }

        Cookie.storedList.push(id);
        Cookie.save();

        ITEM_LIST.push(id);

        // addTrackingRow(id);

        if (updateTimer == -1) {
            updateTimer = setTimeout(() => {
                window.location.reload();
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
        let top = ffxiv_weekly_dump[Cookie.homeWorld].slice(0, 100);

        document.querySelector('#worldBestseller').innerHTML = Cookie.homeWorld;

        // console.debug(top);

        function createTR(i: number, item: WorldResponseItem): string {
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
                <td class="text-center">&nbsp;${displayNumOrEmpty(item.averagePrice, (item.averagePrice).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNumOrEmpty(item.averagePriceNQ, (item.averagePriceNQ).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNumOrEmpty(item.averagePriceHQ, (item.averagePriceHQ).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNumOrEmpty(item.regularSaleVelocity, (item.regularSaleVelocity).toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 }))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNumOrEmpty(item.nqSaleVelocity, (item.nqSaleVelocity).toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 }))}&nbsp;</td>
                <td class="text-center">&nbsp;${displayNumOrEmpty(item.hqSaleVelocity, (item.hqSaleVelocity).toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 }))}&nbsp;</td>
            </tr>`;
        }

        for (let i = 0, l = top.length; i < l; i ++) {
            topBody.innerHTML += createTR(i + 1, top[i]);
        }
    }

    // start
    init();

}
