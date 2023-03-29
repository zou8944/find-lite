(async function () {
    // 添加基本元素
    await FindLite.panel.appendCSS();
    await FindLite.panel.appendHTML();
    // 加载element
    await FindLite.panel.loadAllElements();
    // 注册监听器
    await FindLite.listener.registerAllListeners();

    console.log("Hello from Find Lite!");
})();


