var Cookie;
(function (Cookie) {
    Cookie.storedList = [];
    function save() {
        _write('ffxiv-market-dom-mylist', Cookie.storedList.join('|'));
    }
    Cookie.save = save;
    function read() {
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
        // console.debug(mylist, split, storedList);
    }
    Cookie.read = read;
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
    read();
})(Cookie || (Cookie = {}));
