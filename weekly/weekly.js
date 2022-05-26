var Weekly;
(function (Weekly) {
    var output = document.getElementById('weekly-output');
    var checkmap = {};
    var buckets = [];
    var bucketAt = 0;
    var all_items = [];
    function generate() {
        for (var _i = 0, ffxiv_market_map_1 = ffxiv_market_map; _i < ffxiv_market_map_1.length; _i++) {
            var itemId = ffxiv_market_map_1[_i];
            checkmap[itemId] = false;
        }
        for (var i = 0, l = ffxiv_market_map.length; i < l; i += 100) {
            buckets.push(ffxiv_market_map.slice(i, i + 100));
        }
        output.innerHTML = 'Generating...';
        fetchBucket(bucketAt);
    }
    Weekly.generate = generate;
    function fetchBucket(bucketId) {
        if (bucketAt >= buckets.length) {
            output.innerHTML = 'Done!';
            // log missing
            console.debug(JSON.stringify(all_items));
            console.debug(all_items);
            console.debug(Object.keys(checkmap).filter(function (x) { return checkmap[x] == false; }).map(function (x) { return "".concat(ffxiv_item_map[x].en, " (").concat(x, ")"); }));
            // fetch missing
            fetch("https://universalis.app/api/Moogle/".concat(Object.keys(checkmap).filter(function (x) { return checkmap[x] == false; }).join('%2C'), "?listings=0&entries=0")).then(function (res) {
                res.json().then(function (json) {
                    console.debug(json);
                });
            });
            return;
        }
        fetch("https://universalis.app/api/Moogle/".concat(buckets[bucketId].join('%2C'), "?listings=0&entries=0")).then(function (res) {
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
