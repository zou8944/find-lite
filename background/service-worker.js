chrome.runtime.onInstalled.addListener(function(details) {
    // 插件安装、更新或启用时刷新所有页面，以使得插件的content生效
    if (details.reason === "install" || details.reason === "update") {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
                // 跳过特殊页面（chrome://, edge://, about: 等）和扩展页面
                if (tab.url && 
                    !tab.url.startsWith('chrome://') && 
                    !tab.url.startsWith('edge://') && 
                    !tab.url.startsWith('about:') &&
                    !tab.url.startsWith('moz-extension://') &&
                    !tab.url.startsWith('chrome-extension://') &&
                    (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                    chrome.tabs.reload(tab.id).catch(error => {
                        console.log(`Failed to reload tab ${tab.id} (${tab.url}):`, error);
                    });
                }
            });
        });
    }
    // 移除了对 uninstall 的处理，因为扩展卸载时不会触发此事件
});