module Cookie {

    export interface Settings {
        topn: number,
        displayFormat: string
    }

    export let storedSettings: Settings = {
        topn: 10,
        displayFormat: 'template-df-expanded'
    };

    export let homeWorld = 'Moogle';
    export let storedList: number[] = [];

    export function save(): void {
        _write('ffxiv-market-dom-settings', JSON.stringify(storedSettings));
        _write('ffxiv-market-dom-homeWorld', homeWorld);
        _write('ffxiv-market-dom-mylist', storedList.join('|'));
    }

    function load(): void {
        // settings
        storedSettings = { ...storedSettings, ...JSON.parse(_read('ffxiv-market-dom-settings')) ?? storedSettings };

        // homeWorld
        homeWorld = _read('ffxiv-market-dom-homeWorld') ?? 'Moogle';

        // list
        let mylist = _read('ffxiv-market-dom-mylist');

        if (mylist.length == 0 || !/([\d+]\|?)+/.test(mylist)) {
            return;
        }

        let split = mylist.split('|');
        for (let v of split) {
            let parsed = +v;

            if (ffxiv_market_map.indexOf(parsed) > -1) {
                storedList.push(parsed);
            }
        }
    }

    function _read(name: string): string {
        let result = new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`).exec(document.cookie);

        return result ? result[1] : null;
    }

    function _write(name: string, value: string, days: number = 365 * 20): void {
        let date = new Date();

        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));

        document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
    }

    // Read stored
    load();

}
