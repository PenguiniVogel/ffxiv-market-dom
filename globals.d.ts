declare var ffxiv_item_map: {
    [id: string]: {
        'en': string
    }
};

declare var ffxiv_market_map: number[];

declare var weekly_dump: WorldResponseItem[];

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
    items: WorldResponseItem[]
    indexMap: {
        [id: number]: number
    }
}
