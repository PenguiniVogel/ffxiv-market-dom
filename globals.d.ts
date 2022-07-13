declare var ffxiv_item_map: {
    [id: string]: {
        'en': string
    }
};

declare var ffxiv_market_map: number[];

declare var ffxiv_weekly_dump: {
    [world: string]: WorldResponseItem[]
};

interface WorldResponseItem {
    itemID: number,
    nqSaleVelocity: number,
    hqSaleVelocity: number,
    regularSaleVelocity: number,
    averagePrice: number,
    averagePriceNQ: number,
    averagePriceHQ: number,
    minPrice: number,
    minPriceNQ: number,
    minPriceHQ: number,
    worldName: string
}

interface WorldResponse {
    itemIDs: number[],
    items: {
       [id: number]: WorldResponseItem
    },
    unresolvedItems: any[]
    worldID: number,
    worldName: string,
}
