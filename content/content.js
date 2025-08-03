(async function () {
    // 检查浏览器兼容性
    if (!FindLite.compatibility.init()) {
        console.error('Find Lite: Browser compatibility check failed');
        return;
    }
    
    try {
        // 添加基本元素
        await FindLite.panel.appendCSS();
        await FindLite.panel.appendHTML();
        // 加载element
        await FindLite.panel.loadAllElements();
        // 注册监听器
        await FindLite.listener.registerAllListeners();

        // 开发环境下的调试信息
        if (FindLite.errorHandler.isDevelopment()) {
            console.log("Find Lite dev mode loaded!");
        }
    } catch (error) {
        FindLite.errorHandler.handle(FindLite.errorHandler.ErrorTypes.API_ERROR, error, {
            context: 'initialization'
        });
    }
})();


