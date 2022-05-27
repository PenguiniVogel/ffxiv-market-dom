var Weekly;
(function (Weekly) {
    var worldIn = document.getElementById('worldIn');
    var output = document.getElementById('weekly-output');
    var checkmap = {};
    var world = 'Moogle';
    var buckets = [];
    var bucketAt = 0;
    var all_items = [];
    function generate() {
        var _a;
        all_items = [];
        for (var _i = 0, ffxiv_market_map_1 = ffxiv_market_map; _i < ffxiv_market_map_1.length; _i++) {
            var itemId = ffxiv_market_map_1[_i];
            checkmap[itemId] = false;
        }
        for (var i = 0, l = ffxiv_market_map.length; i < l; i += 100) {
            buckets.push(ffxiv_market_map.slice(i, i + 100));
        }
        world = (_a = worldIn.value) !== null && _a !== void 0 ? _a : 'Moogle';
        output.innerHTML = "Generating... (".concat(world, ")");
        fetchBucket(bucketAt);
    }
    Weekly.generate = generate;
    function fetchBucket(bucketId) {
        if (bucketAt >= buckets.length) {
            output.innerHTML = 'Done!';
            // extract top 1000 bestsellers to reduce data-set size
            var sorted = all_items.sort(function (a, b) { return a.regularSaleVelocity > b.regularSaleVelocity ? -1 : 1; })
                .slice(0, 1000)
                .sort(function (a, b) { return a.averagePrice > b.averagePrice ? -1 : 1; });
            console.debug("ffxiv_weekly_dump['".concat(world, "'] = ").concat(JSON.stringify(sorted), ";"));
            console.debug(all_items, sorted);
            // missing (empty collection)
            console.debug(Object.keys(checkmap).filter(function (x) { return checkmap[x] == false; }).map(function (x) { return "".concat(ffxiv_item_map[x].en, " (").concat(x, ")"); }));
            fetch("https://universalis.app/api/".concat(world, "/").concat(Object.keys(checkmap).filter(function (x) { return checkmap[x] == false; }).join('%2C'), "?listings=0&entries=0")).then(function (res) {
                res.json().then(function (json) {
                    console.debug(json);
                });
            });
            return;
        }
        fetch("https://universalis.app/api/".concat(world, "/").concat(buckets[bucketId].join('%2C'), "?listings=0&entries=0")).then(function (res) {
            res.json().then(function (json) {
                var resp = typeof json == 'object' ? json : JSON.parse(json);
                for (var _i = 0, _a = resp.items; _i < _a.length; _i++) {
                    var item = _a[_i];
                    checkmap[item.itemID] = true;
                    delete item['stackSizeHistogram'];
                    delete item['stackSizeHistogramNQ'];
                    delete item['stackSizeHistogramHQ'];
                    delete item['listings'];
                    delete item['recentHistory'];
                    all_items.push(item);
                }
                bucketAt++;
                setTimeout(function () { return fetchBucket(bucketAt); }, 500);
            });
        });
    }
})(Weekly || (Weekly = {}));
