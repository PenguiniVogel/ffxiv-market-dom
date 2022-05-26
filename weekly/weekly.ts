module Weekly {

    let output = document.getElementById('weekly-output');

    let checkmap: {
        [id: number]: boolean
    } = {};

    let buckets: number[][] = [];
    let bucketAt = 0;

    let all_items: WorldResponseItem[] = [];

    export function generate(): void {
        for (let itemId of ffxiv_market_map) {
            checkmap[itemId] = false;
        }

        for (let i = 0, l = ffxiv_market_map.length; i < l; i += 100) {
            buckets.push(ffxiv_market_map.slice(i, i + 100));
        }

        output.innerHTML = 'Generating...';

        fetchBucket(bucketAt);
    }

    function fetchBucket(bucketId: number) {
        if (bucketAt >= buckets.length) {
            output.innerHTML = 'Done!';

            // log missing
            console.debug(JSON.stringify(all_items));
            console.debug(all_items);
            console.debug(Object.keys(checkmap).filter(x => checkmap[x] == false).map(x => `${ffxiv_item_map[x].en} (${x})`));

            // fetch missing
            fetch(`https://universalis.app/api/Moogle/${Object.keys(checkmap).filter(x => checkmap[x] == false).join('%2C')}?listings=0&entries=0`).then(res => {
                res.json().then(json => {
                    console.debug(json);
                });
            });

            return;
        }

        fetch(`https://universalis.app/api/Moogle/${buckets[bucketId].join('%2C')}?listings=0&entries=0`).then(res => {
            res.json().then(json => {
                let resp: WorldResponse = typeof json == 'object' ? json : JSON.parse(json);

                for (let item of resp.items) {
                    checkmap[item.itemID] = true;

                    delete item['stackSizeHistogram'];
                    delete item['stackSizeHistogramNQ'];
                    delete item['stackSizeHistogramHQ'];
                    delete item['listings'];
                    delete item['recentHistory'];

                    all_items.push(item);
                }

                bucketAt ++;

                setTimeout(() => fetchBucket(bucketAt), 500);
            });
        });
    }

}
