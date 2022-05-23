var Script;
(function (Script) {
    var WORLDS = [
        'Cerberus',
        'Louisoix',
        'Moogle',
        'Omega',
        'Ragnarok',
        'Spriggan'
    ];
    var ITEM_LIST = [
        5371,
        21800
    ];
    var currentTimer = -1;
    var responses = {};
    var container = document.getElementById('item-container');
    function init() {
        for (var _i = 0, ITEM_LIST_1 = ITEM_LIST; _i < ITEM_LIST_1.length; _i++) {
            var item = ITEM_LIST_1[_i];
            container.innerHTML += createHTMLRow(item);
        }
        document.getElementById('search-input').addEventListener('keyup', function (e) {
            if (currentTimer > -1) {
                clearTimeout(currentTimer);
                currentTimer = -1;
            }
            currentTimer = setTimeout(function () {
                currentTimer = -1;
                search(e.target.value);
            }, 250);
        });
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
        for (var _a = 0, WORLDS_1 = WORLDS; _a < WORLDS_1.length; _a++) {
            var k = WORLDS_1[_a];
            _loop_1(k);
        }
    }
    function search(search) {
        var results = [];
        for (var _i = 0, _a = Object.keys(ffxiv_item_map); _i < _a.length; _i++) {
            var key = _a[_i];
            if (ffxiv_item_map[key].en.toLowerCase().indexOf(search) > -1 && ffxiv_market_map.indexOf(+key) > -1) {
                results.push(ffxiv_item_map[key].en);
            }
        }
        console.debug(results);
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
        var cheapest = {};
        for (var i = 0, l = WORLDS.length; i < l; i++) {
            var world = WORLDS[i];
            var data = responses[world];
            for (var _b = 0, _c = data.items; _b < _c.length; _b++) {
                var item = _c[_b];
                if (!cheapest[item.itemID]) {
                    cheapest[item.itemID] = item;
                }
                if (world == 'Moogle') {
                    document.querySelector("[data-id=\"".concat(item.itemID, "\"] [data-recentsales]")).innerHTML = "Recently sold: ".concat(item.regularSaleVelocity.toFixed(0), " (stack) ~").concat(item.averagePrice.toFixed(0), " Gil");
                }
                if (item.minPrice < cheapest[item.itemID].minPrice) {
                    cheapest[item.itemID] = item;
                }
            }
        }
        for (var _d = 0, _e = Object.keys(cheapest); _d < _e.length; _d++) {
            var item_id = _e[_d];
            var item = cheapest[item_id];
            var main = document.querySelector("[data-id=\"".concat(item.itemID, "\"]"));
            main.querySelector('[data-cheapestworld]').innerHTML = item.worldName;
            main.querySelector('[data-cheapestprice]').innerHTML = "".concat(item.minPrice, " Gil");
            var moogle = responses['Moogle'];
            var homeItem = moogle.items[moogle.indexMap[item.itemID]];
            var max = Math.max(homeItem.minPrice, item.minPrice * 1.05);
            var min = Math.min(homeItem.minPrice, item.minPrice * 1.05);
            var profit = homeItem.minPrice > item.minPrice * 1.05;
            main.querySelector('[data-currentprice]').innerHTML = "".concat(homeItem.minPrice, " Gil");
            main.querySelector('[data-cheapestdiff]').innerHTML = "<span class=\"".concat(profit ? 'text-success' : 'text-danger', "\">").concat(profit ? '+' : '-').concat((((max - min) / max) * 100).toFixed(2), "%</span>");
        }
    }
    function createHTMLRow(id) {
        return "\n        <div data-id=\"".concat(id, "\" class=\"row\" style=\"margin-bottom: 5px;\">\n            <div class=\"col\">\n                <div class=\"row\">\n                    <div class=\"col-1\">\n                        <img width=\"28\" src=\"https://universalis-ffxiv.github.io/universalis-assets/icon2x/").concat(id, ".png\" />\n                    </div>\n                    <div class=\"col\">\n                        <div>").concat(ffxiv_item_map["".concat(id)].en, " <span class=\"small text-secondary\" data-currentprice></span></div>\n                        <div class=\"col small text-secondary\" data-recentsales>Recently sold: ???</div>\n                    </div>\n                </div>\n            </div>\n            <div class=\"col\">\n                <div class=\"row\">\n                    <div class=\"col\" data-cheapestworld>???</div>\n                </div>\n                <div class=\"row\">\n                    <div class=\"col-3 small\" data-cheapestprice>???</div>\n                    <div class=\"col-3\" data-cheapestdiff>???</div>\n                </div>\n            </div>\n        </div>\n        ");
    }
    init();
})(Script || (Script = {}));
