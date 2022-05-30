var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Script;
(function (Script) {
    var PAGE_MAP = {
        'main': 1,
        'bestseller': 2,
        'settings': 3
    };
    var WORLDS = [
        'Cerberus',
        'Louisoix',
        'Moogle',
        'Omega',
        'Ragnarok',
        'Spriggan'
    ];
    var ITEM_LIST = __spreadArray([
        21800
    ], Cookie.storedList, true);
    var currentTimer = -1;
    var updateTimer = -1;
    var responses = {};
    var trackMinMax = {};
    var container = document.getElementById('item-container');
    var suggestions = document.getElementById('suggestions');
    var searchInput = document.getElementById('search-input');
    var topBody = document.querySelector('#topSales tbody');
    var worldSelect = document.querySelector('#worldSelect');
    function init() {
        // for (let item of ITEM_LIST) {
        //     container.innerHTML += createHTMLRow(item);
        // }
        var _a, _b, _c, _d;
        function hideEvent(e) {
            if (e.code == 'Escape') {
                hideSearch();
            }
        }
        document.addEventListener('keyup', hideEvent);
        document.addEventListener('click', function () { return hideSearch(); });
        searchInput.addEventListener('keyup', function () {
            if (currentTimer > -1) {
                clearTimeout(currentTimer);
                currentTimer = -1;
            }
            currentTimer = setTimeout(function () {
                currentTimer = -1;
                var val = searchInput.value;
                if (val.length < 2) {
                    hideSearch(false);
                    return;
                }
                search(val);
            }, 250);
        });
        document.querySelectorAll('nav button[data-page]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                page(+e.target.getAttribute('data-page'));
            });
        });
        if (((_b = (_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.href) === null || _b === void 0 ? void 0 : _b.indexOf('#bestseller')) > -1) {
            page(PAGE_MAP['bestseller']);
        }
        if (((_d = (_c = window === null || window === void 0 ? void 0 : window.location) === null || _c === void 0 ? void 0 : _c.href) === null || _d === void 0 ? void 0 : _d.indexOf('#settings')) > -1) {
            page(PAGE_MAP['settings']);
        }
        for (var i = 0, l = worldSelect.options.length; i < l; i++) {
            if (worldSelect.options.item(i).innerText == Cookie.homeWorld) {
                worldSelect.selectedIndex = i;
                break;
            }
        }
        worldSelect.addEventListener('input', function () {
            var option = worldSelect.selectedOptions[0].innerText;
            Cookie.homeWorld = WORLDS.indexOf(option) > -1 ? option : 'Moogle';
            Cookie.save();
            window.location.reload();
        });
        loadData();
        loadWeekly();
    }
    function loadData() {
        responses = {};
        if (ITEM_LIST.length < 1) {
            return;
        }
        var _loop_1 = function (k) {
            fetch("https://universalis.app/api/".concat(k, "/").concat(ITEM_LIST.join('%2C'), "?listings=0&entries=0")).then(function (res) {
                res.json().then(function (json) {
                    var resp = typeof json == 'object' ? json : JSON.parse(json);
                    resp.indexMap = {};
                    for (var i = 0, l = resp.items.length; i < l; i++) {
                        var item = resp.items[i];
                        resp.indexMap[item.itemID] = i;
                    }
                    responses[k] = resp;
                    checkAllAvailable();
                });
            });
        };
        for (var _i = 0, WORLDS_1 = WORLDS; _i < WORLDS_1.length; _i++) {
            var k = WORLDS_1[_i];
            _loop_1(k);
        }
    }
    function search(search) {
        var results = [];
        var count = 0;
        for (var _i = 0, _a = Object.keys(ffxiv_item_map); _i < _a.length; _i++) {
            var key = _a[_i];
            if (count >= 50)
                break;
            if (ffxiv_item_map[key].en.toLowerCase().indexOf(search.toLowerCase()) > -1 && ffxiv_market_map.indexOf(+key) > -1 && ITEM_LIST.indexOf(+key) == -1) {
                count++;
                results.push("\n<div class=\"col bg-light text-dark\" data-itemid=\"".concat(key, "\" onclick=\"Script.addTracking(").concat(key, ");\">\n        <div class=\"row\">\n            <div class=\"col-1\">\n                <img width=\"28\" src=\"https://universalis-ffxiv.github.io/universalis-assets/icon2x/").concat(key, ".png\" alt=\"2x\" />\n            </div>\n            <div class=\"col-10\">").concat(ffxiv_item_map[key].en, "</div>\n        </div>\n    </div>\n</div>"));
            }
        }
        suggestions.innerHTML = results.join('\n');
    }
    function hideSearch(setInput) {
        if (setInput === void 0) { setInput = true; }
        suggestions.innerHTML = '';
        if (setInput) {
            document.getElementById('search-input').value = '';
        }
    }
    function displayNumOrEmpty(input, outStr) {
        return input < 0.0001 || isNaN(input) || !isFinite(input) ? '<span class="text-danger">---</span>' : outStr !== null && outStr !== void 0 ? outStr : "".concat(input);
    }
    function checkAllAvailable() {
        var _a;
        for (var _i = 0, WORLDS_2 = WORLDS; _i < WORLDS_2.length; _i++) {
            var k = WORLDS_2[_i];
            if (!((_a = responses[k]) === null || _a === void 0 ? void 0 : _a.items)) {
                return;
            }
        }
        console.debug('All loaded!', responses);
        for (var i = 0, l = WORLDS.length; i < l; i++) {
            var world = WORLDS[i];
            var data = responses[world];
            for (var _b = 0, _c = data.items; _b < _c.length; _b++) {
                var item = _c[_b];
                if (!trackMinMax[item.itemID]) {
                    trackMinMax[item.itemID] = {
                        home: item,
                        cheapestNQ: item,
                        cheapestHQ: item,
                        expensiveNQ: item,
                        expensiveHQ: item
                    };
                }
                if (world == Cookie.homeWorld) {
                    trackMinMax[item.itemID].home = item;
                }
                if (item.minPriceNQ < trackMinMax[item.itemID].cheapestNQ.minPriceNQ) {
                    trackMinMax[item.itemID].cheapestNQ = item;
                }
                if (item.minPriceHQ < trackMinMax[item.itemID].cheapestHQ.minPriceHQ) {
                    trackMinMax[item.itemID].cheapestHQ = item;
                }
                if (item.minPriceNQ > trackMinMax[item.itemID].expensiveNQ.minPriceNQ) {
                    trackMinMax[item.itemID].expensiveNQ = item;
                }
                if (item.minPriceHQ > trackMinMax[item.itemID].expensiveHQ.minPriceHQ) {
                    trackMinMax[item.itemID].expensiveHQ = item;
                }
            }
        }
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
        for (var _d = 0, ITEM_LIST_1 = ITEM_LIST; _d < ITEM_LIST_1.length; _d++) {
            var key = ITEM_LIST_1[_d];
            addTrackingRow(key);
        }
    }
    function addTrackingRow(id) {
        var homeItem = trackMinMax[id].home;
        var cheapestItemNQ = trackMinMax[id].cheapestNQ;
        var cheapestItemHQ = trackMinMax[id].cheapestHQ;
        var expensiveItemNQ = trackMinMax[id].expensiveNQ;
        var expensiveItemHQ = trackMinMax[id].expensiveHQ;
        var hasCheapestNQ = cheapestItemNQ.nqSaleVelocity > 0.0001 && cheapestItemNQ.minPriceNQ > 0;
        var hasCheapestHQ = cheapestItemHQ.hqSaleVelocity > 0.0001 && cheapestItemHQ.minPriceHQ > 0;
        var hasExpensiveNQ = expensiveItemNQ.nqSaleVelocity > 0.0001 && expensiveItemNQ.minPriceNQ > 0;
        var hasExpensiveHQ = expensiveItemHQ.hqSaleVelocity > 0.0001 && expensiveItemHQ.minPriceHQ > 0;
        var minCheapestNQ = Math.min(homeItem.minPriceNQ, cheapestItemNQ.minPriceNQ * 1.05);
        var maxCheapestNQ = Math.max(homeItem.minPriceNQ, cheapestItemNQ.minPriceNQ * 1.05);
        var profitCheapestNQ = homeItem.minPriceNQ > cheapestItemNQ.minPriceNQ * 1.05;
        var cheapestNQDiff = ((maxCheapestNQ - minCheapestNQ) / maxCheapestNQ) * 100;
        var minCheapestHQ = Math.min(homeItem.minPriceHQ, cheapestItemHQ.minPriceHQ * 1.05);
        var maxCheapestHQ = Math.max(homeItem.minPriceHQ, cheapestItemHQ.minPriceHQ * 1.05);
        var profitCheapestHQ = homeItem.minPriceHQ > cheapestItemHQ.minPriceHQ * 1.05;
        var cheapestHQDiff = ((maxCheapestHQ - minCheapestHQ) / maxCheapestHQ) * 100;
        var minExpensiveNQ = Math.min(cheapestItemNQ.minPriceNQ, expensiveItemNQ.minPriceNQ * 1.05);
        var maxExpensiveNQ = Math.max(cheapestItemNQ.minPriceNQ, expensiveItemNQ.minPriceNQ * 1.05);
        var profitExpensiveNQ = cheapestItemNQ.minPriceNQ < expensiveItemNQ.minPriceNQ * 1.05;
        var expensiveNQDiff = (maxExpensiveNQ / minExpensiveNQ) * 100;
        var minExpensiveHQ = Math.min(cheapestItemHQ.minPriceHQ, expensiveItemHQ.minPriceHQ * 1.05);
        var maxExpensiveHQ = Math.max(cheapestItemHQ.minPriceHQ, expensiveItemHQ.minPriceHQ * 1.05);
        var profitExpensiveHQ = cheapestItemHQ.minPriceHQ < expensiveItemHQ.minPriceHQ * 1.05;
        var expensiveHQDiff = (maxExpensiveHQ / minExpensiveHQ) * 100;
        function formatPrice(price) {
            return displayNumOrEmpty(price, "".concat(price.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }), " Gil"));
        }
        function formatSaleVelocity(vel) {
            return displayNumOrEmpty(vel, "".concat(vel.toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })));
        }
        function formatDiff(profit, diff) {
            return displayNumOrEmpty(diff, "<span class=\"".concat(profit ? 'text-success' : 'text-danger', "\">").concat(profit ? '+' : '-', " ").concat(diff.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }), "%</span>"));
        }
        var generatedRow = TemplateRender.renderTemplate(Cookie.storedSettings.displayFormat, {
            itemID: "".concat(homeItem.itemID),
            itemName: ffxiv_item_map[homeItem.itemID].en,
            homeWorldName: homeItem.worldName,
            homeNQPrice: formatPrice(homeItem.minPriceNQ),
            homeNQSaleVelocity: formatSaleVelocity(homeItem.nqSaleVelocity),
            homeHQPrice: formatPrice(homeItem.minPriceHQ),
            homeHQSaleVelocity: formatSaleVelocity(homeItem.hqSaleVelocity),
            cheapestNQWorldName: hasCheapestNQ ? cheapestItemNQ.worldName : '<span class="text-danger">---</span>',
            cheapestHQWorldName: hasCheapestHQ ? cheapestItemHQ.worldName : '<span class="text-danger">---</span>',
            cheapestNQPrice: formatPrice(cheapestItemNQ.minPriceNQ),
            cheapestNQSaleVelocity: formatSaleVelocity(cheapestItemNQ.nqSaleVelocity),
            cheapestNQDiff: formatDiff(profitCheapestNQ, cheapestNQDiff),
            cheapestHQPrice: formatPrice(cheapestItemHQ.minPriceHQ),
            cheapestHQSaleVelocity: formatSaleVelocity(cheapestItemHQ.hqSaleVelocity),
            cheapestHQDiff: formatDiff(profitCheapestHQ, cheapestHQDiff),
            expensiveNQWorldName: hasExpensiveNQ ? expensiveItemNQ.worldName : '<span class="text-danger">---</span>',
            expensiveHQWorldName: hasExpensiveHQ ? expensiveItemHQ.worldName : '<span class="text-danger">---</span>',
            expensiveNQPrice: formatPrice(expensiveItemNQ.minPriceNQ),
            expensiveNQSaleVelocity: formatSaleVelocity(expensiveItemNQ.nqSaleVelocity),
            expensiveNQDiff: formatDiff(profitExpensiveNQ, expensiveNQDiff),
            expensiveHQPrice: formatPrice(expensiveItemHQ.minPriceHQ),
            expensiveHQSaleVelocity: formatSaleVelocity(expensiveItemHQ.hqSaleVelocity),
            expensiveHQDiff: formatDiff(profitExpensiveHQ, expensiveHQDiff),
        });
        container.innerHTML += generatedRow;
    }
    function addTracking(id) {
        hideSearch();
        if (Cookie.storedList.indexOf(id) > -1) {
            return;
        }
        Cookie.storedList.push(id);
        Cookie.save();
        ITEM_LIST.push(id);
        // addTrackingRow(id);
        if (updateTimer == -1) {
            updateTimer = setTimeout(function () {
                window.location.reload();
                updateTimer = -1;
            }, 5000);
        }
    }
    Script.addTracking = addTracking;
    function addBestseller(id) {
        var btn = document.querySelector("button[data-addref=\"".concat(id, "\"]"));
        if (!btn) {
            return;
        }
        btn.removeAttribute('onclick');
        btn.setAttribute('class', 'bg-success');
        btn.setAttribute('data-addref', '-1');
        addTracking(id);
    }
    Script.addBestseller = addBestseller;
    function removeTracking(id) {
        if (confirm("Remove ".concat(ffxiv_item_map[id].en, " (").concat(id, ") from being tracked?"))) {
            hideSearch();
            Cookie.storedList = Cookie.storedList.filter(function (x) { return x != id; });
            Cookie.save();
            window.location.reload();
        }
    }
    Script.removeTracking = removeTracking;
    function page(nr) {
        document.querySelectorAll('e[id^="page"]').forEach(function (e) { return e.setAttribute('style', 'display: none;'); });
        document.querySelectorAll('nav button[data-page]').forEach(function (e) { return e.setAttribute('class', 'nav-item"'); });
        document.querySelector("button[data-page=\"".concat(nr, "\"]")).setAttribute('class', 'nav-item text-light bg-success');
        document.querySelector("e#page".concat(nr)).setAttribute('style', '');
    }
    Script.page = page;
    function loadWeekly() {
        var top = ffxiv_weekly_dump[Cookie.homeWorld].slice(0, 100);
        document.querySelector('#worldBestseller').innerHTML = Cookie.homeWorld;
        // console.debug(top);
        function createTR(i, item) {
            return "\n            <tr>\n                <td class=\"text-center\">\n                    <button data-addref=\"".concat(item.itemID, "\" ").concat(ITEM_LIST.indexOf(item.itemID) > -1 ? 'class="text-light bg-success"' : "class=\"text-dark bg-light\" onclick=\"Script.addBestseller(".concat(item.itemID, ");\""), " >&check;</button>\n                </td>\n                <td class=\"text-center\">&nbsp;#").concat(i, "&nbsp;</td>\n                <td>\n                    <img width=\"24\" alt=\"2x\" src=\"https://universalis-ffxiv.github.io/universalis-assets/icon2x/").concat(item.itemID, ".png\" />\n                </td>\n                <td>&nbsp;").concat(ffxiv_item_map[item.itemID].en, "&nbsp;</td>\n                <td class=\"text-secondary text-center\">&nbsp;(").concat(item.itemID, ")&nbsp;</td>\n                <td class=\"text-center\">&nbsp;").concat(displayNumOrEmpty(item.averagePrice, (item.averagePrice).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })), "&nbsp;</td>\n                <td class=\"text-center\">&nbsp;").concat(displayNumOrEmpty(item.averagePriceNQ, (item.averagePriceNQ).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })), "&nbsp;</td>\n                <td class=\"text-center\">&nbsp;").concat(displayNumOrEmpty(item.averagePriceHQ, (item.averagePriceHQ).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })), "&nbsp;</td>\n                <td class=\"text-center\">&nbsp;").concat(displayNumOrEmpty(item.regularSaleVelocity, (item.regularSaleVelocity).toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })), "&nbsp;</td>\n                <td class=\"text-center\">&nbsp;").concat(displayNumOrEmpty(item.nqSaleVelocity, (item.nqSaleVelocity).toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })), "&nbsp;</td>\n                <td class=\"text-center\">&nbsp;").concat(displayNumOrEmpty(item.hqSaleVelocity, (item.hqSaleVelocity).toLocaleString('de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 })), "&nbsp;</td>\n            </tr>");
        }
        for (var i = 0, l = top.length; i < l; i++) {
            topBody.innerHTML += createTR(i + 1, top[i]);
        }
    }
    // start
    init();
})(Script || (Script = {}));
