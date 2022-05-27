var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var Cookie;
(function (Cookie) {
    Cookie.storedSettings = {
        topn: 10,
        displayFormat: 'template-df-expanded'
    };
    Cookie.homeWorld = 'Moogle';
    Cookie.storedList = [];
    function save() {
        _write('ffxiv-market-dom-settings', JSON.stringify(Cookie.storedSettings));
        _write('ffxiv-market-dom-homeWorld', Cookie.homeWorld);
        _write('ffxiv-market-dom-mylist', Cookie.storedList.join('|'));
    }
    Cookie.save = save;
    function load() {
        var _a, _b;
        // settings
        Cookie.storedSettings = __assign(__assign({}, Cookie.storedSettings), (_a = JSON.parse(_read('ffxiv-market-dom-settings'))) !== null && _a !== void 0 ? _a : Cookie.storedSettings);
        // homeWorld
        Cookie.homeWorld = (_b = _read('ffxiv-market-dom-homeWorld')) !== null && _b !== void 0 ? _b : 'Moogle';
        // list
        var mylist = _read('ffxiv-market-dom-mylist');
        if (mylist.length == 0 || !/([\d+]\|?)+/.test(mylist)) {
            return;
        }
        var split = mylist.split('|');
        for (var _i = 0, split_1 = split; _i < split_1.length; _i++) {
            var v = split_1[_i];
            var parsed = +v;
            if (ffxiv_market_map.indexOf(parsed) > -1) {
                Cookie.storedList.push(parsed);
            }
        }
    }
    function _read(name) {
        var result = new RegExp("(?:^|; )".concat(encodeURIComponent(name), "=([^;]*)")).exec(document.cookie);
        return result ? result[1] : null;
    }
    function _write(name, value, days) {
        if (days === void 0) { days = 365 * 20; }
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = "".concat(name, "=").concat(value, "; expires=").concat(date.toUTCString(), "; path=/");
    }
    // Read stored
    load();
})(Cookie || (Cookie = {}));
