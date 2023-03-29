FindLite.storage = (function () {
    const self = {};
    const STORAGE_KEY = "FindLite-State";

    self.getSensitive = async function () {
        const obj = await self.load();
        return obj.isCaseSensitive;
    };

    self.getRegex = async function () {
        const obj = await self.load();
        return obj.isRegex;
    };

    self.getWholeWord = async function () {
        const obj = await self.load();
        return obj.isWholeWord;
    };

    self.setSensitive = async function (isCaseSensitive) {
        const obj = await self.load();
        obj.isCaseSensitive = isCaseSensitive;
        await self.store(obj);
    };

    self.setRegex = async function (isRegex) {
        const obj = await self.load();
        obj.isRegex = isRegex;
        await self.store(obj);
    };

    self.setWholeWord = async function (isWholeWord) {
        const obj = await self.load();
        obj.isWholeWord = isWholeWord;
        await self.store(obj);
    };

    self.store = async function (obj) {
        await chrome.storage.local.set({[STORAGE_KEY]: obj});
    };

    self.load = async function () {
        let obj = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
        if (obj === undefined) {
            obj = {
                isCaseSensitive: false,
                isRegex: false,
                isWholeWord: false
            };
        }
        return obj;
    };

    return self;
})();