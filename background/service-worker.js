chrome.runtime.onInstalled.addListener(function(details) {
    // 安装成功后需刷新所有页面，以使得插件的content生效
    if (details.reason == "install" || details.reason == "update") {
        chrome.tabs.query({}, function(tabs) {
            for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.reload(tabs[i].id);
            }
        });
    } else if (details.reason == "uninstall") {
        // 忽略卸载事件
    }
});