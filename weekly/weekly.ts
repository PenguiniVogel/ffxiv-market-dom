module Weekly {

    const worldIn = <HTMLInputElement>document.getElementById('worldIn');
    const output = document.getElementById('weekly-output');

    let checkmap: {
        [id: number]: boolean
    } = {};

    let world = 'Moogle';

    let buckets: number[][] = [];
    let bucketAt = 0;

    let all_items: WorldResponseItem[] = [];

    export function generate(): void {
        all_items = [];
        
        for (let itemId of ffxiv_market_map) {
            checkmap[itemId] = false;
        }

        for (let i = 0, l = ffxiv_market_map.length; i < l; i += 100) {
            buckets.push(ffxiv_market_map.slice(i, i + 100));
        }

        world = worldIn.value ?? 'Moogle';

        output.innerHTML = `Generating... (${world})`;

        fetchBucket(bucketAt);
    }

    function fetchBucket(bucketId: number) {
        if (bucketAt >= buckets.length) {
            output.innerHTML = 'Done!';

            // extract top 1000 bestsellers to reduce data-set size
            let sorted = all_items.sort((a, b) => a.regularSaleVelocity > b.regularSaleVelocity ? -1 : 1)
                .slice(0, 1000)
                .sort((a, b) => a.averagePrice > b.averagePrice ? -1 : 1);

            console.debug(`ffxiv_weekly_dump['${world}'] = ${JSON.stringify(sorted)};`);
            console.debug(all_items, sorted);

            // missing (empty collection)
            let missingMap = Object.keys(checkmap).filter(x => checkmap[x] == false).map(x => `${ffxiv_item_map[x].en} (${x})`);

            if (missingMap.length > 0) {
                console.debug(missingMap);

                fetch(`https://universalis.app/api/v2/${world}/${Object.keys(checkmap).filter(x => checkmap[x] == false).join('%2C')}?listings=0&entries=0`).then(res => {
                    res.json().then(json => {
                        console.debug(json);
                    });
                });
            } else {
                console.debug('No missing items reported.');
            }

            return;
        }

        fetch(`https://universalis.app/api/v2/${world}/${buckets[bucketId].join('%2C')}?listings=0&entries=0`).then(res => {
            res.json().then(json => {
                let resp: WorldResponse = typeof json == 'object' ? json : JSON.parse(json);

                for (let itemID of resp.itemIDs) {
                    let item = resp.items[itemID];
                    checkmap[itemID] = true;

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
