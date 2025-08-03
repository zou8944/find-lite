FindLite.listener = (function () {
    const self = {};

    let ranges = [];
    let currentIndex = 0;
    let selectRange = null;
    let highlightScrollEventElements = [];
    
    // 创建防抖的搜索函数
    let debouncedSearch = null;

    self.registerAllListeners = function () {
        // 为不同类型的搜索创建不同的防抖函数
        const createDebouncedSearch = () => {
            const isRegex = FindLite.panel.isRegex();
            const delay = FindLite.searchOptimizer.getDebounceDelay(isRegex);
            return FindLite.searchOptimizer.debounce(self.performSearch, delay);
        };
        
        FindLite.panel.element.searchField.oninput = function(event) {
            // 取消之前的搜索
            FindLite.searchOptimizer.cancelSearch();
            
            // 重新创建防抖函数（考虑正则模式变化）
            debouncedSearch = createDebouncedSearch();
            debouncedSearch(event);
        };
        
        FindLite.panel.element.caseSensitiveButton.onclick = self.caseSensitiveClickListener;
        FindLite.panel.element.wholeWordButton.onclick = self.wholeWordClickListener;
        FindLite.panel.element.regexButton.onclick = self.regexClickListener;
        FindLite.panel.element.previousButton.onclick = self.previousClickListener;
        FindLite.panel.element.nextButton.onclick = self.nextClickListener;
        FindLite.panel.element.exitButton.onclick = self.exitClickListener;
        
        // 添加消息监听器用于popup通信
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'ping') {
                sendResponse({status: 'ok'});
            }
        });
        
        // 添加而不是覆盖 keydown 处理器
        document.addEventListener("keydown", self.keydownListener);
    };

    self.keydownListener = async function (event) {
        // 动态检测快捷键
        if (await self.isActivationShortcut(event)) {
            event.preventDefault();
            await self.activateSearch();
            return;
        }
        
        // ESC 清空并隐藏搜索框
        if (event.keyCode === 27) {
            await self.exitClickListener(event);
        }
        // Shift+Enter 上一个
        else if (event.shiftKey && event.keyCode === 13) {
            await self.previousClickListener(event);
        }
        // Enter 下一个
        else if (event.keyCode === 13) {
            await self.nextClickListener(event);
        }
    };

    // 检查是否为激活快捷键
    self.isActivationShortcut = async function(event) {
        try {
            const settings = await chrome.storage.local.get(['shortcutKey', 'customShortcut']);
            const shortcutKey = settings.shortcutKey || 'ctrl-shift-f';
            const customShortcut = settings.customShortcut;
            
            // 如果设置了自定义快捷键，优先使用自定义快捷键
            if (shortcutKey === 'custom' && customShortcut) {
                return self.matchesShortcut(event, customShortcut.keys);
            }
            
            // 使用预设快捷键
            const shortcuts = {
                'ctrl-shift-f': { ctrl: true, shift: true, key: 'f' },
                'ctrl-alt-f': { ctrl: true, alt: true, key: 'f' },
                'alt-shift-f': { alt: true, shift: true, key: 'f' },
                'ctrl-shift-g': { ctrl: true, shift: true, key: 'g' },
                'ctrl-k': { ctrl: true, key: 'k' }
            };
            
            const targetShortcut = shortcuts[shortcutKey];
            return targetShortcut && self.matchesShortcut(event, targetShortcut);
            
        } catch (error) {
            console.warn('Find Lite: 检查快捷键失败，使用默认', error);
            // 出错时使用默认快捷键
            return (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f';
        }
    };

    // 匹配快捷键组合
    self.matchesShortcut = function(event, shortcut) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : (!event.ctrlKey && !event.metaKey);
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        
        return ctrlMatch && altMatch && shiftMatch && keyMatch;
    };

    // 激活搜索功能
    self.activateSearch = async function() {
        // 如果selection有值，则获取
        if (window.getSelection().rangeCount > 0) {
            selectRange = window.getSelection().getRangeAt(0);
            if (selectRange) {
                FindLite.panel.focusAndSelect(selectRange.toString());
            }
        }
        FindLite.panel.setSwitcher(
            await FindLite.storage.getSensitive(),
            await FindLite.storage.getWholeWord(),
            await FindLite.storage.getRegex()
        );
        FindLite.panel.show();
        // 使用防抖搜索
        if (!debouncedSearch) {
            const isRegex = FindLite.panel.isRegex();
            const delay = FindLite.searchOptimizer.getDebounceDelay(isRegex);
            debouncedSearch = FindLite.searchOptimizer.debounce(self.performSearch, delay);
        }
        debouncedSearch({});
    };

    // 新的执行搜索函数，替代原来的 findInputChangeListener
    self.performSearch = async function (event) {
        const inputText = FindLite.panel.element.searchField.value;
        if (inputText === "") {
            clearAllState();
            return;
        }

        const isCaseSensitive = FindLite.panel.isCaseSensitive();
        const isWholeWord = FindLite.panel.isWholeWord();
        const isRegex = FindLite.panel.isRegex();
        
        try {
            // 显示搜索进行中状态
            showSearchingState();
            
            // 使用限时搜索
            ranges = await FindLite.searchOptimizer.executeTimeLimitedSearch(() => {
                return FindLite.finder.findInBody(inputText, isCaseSensitive, isWholeWord, isRegex);
            });
            
            // 根据视窗获取第一个需要focus的搜索结果
            currentIndex = FindLite.page.determineInitialRangeIndex(ranges, selectRange);
            // 根据搜索结果渲染显示内容
            renderHighlight();
            // 渲染进度条
            const topPercents = FindLite.page.calVerticalLineTopPercents(ranges);
            FindLite.panel.clearSidebar();
            FindLite.panel.showSidebar(topPercents);

            if (ranges.length > 0) {
                FindLite.panel.enableNaviButton();
            } else {
                FindLite.panel.disableNaviButton();
            }
            
            // 隐藏搜索状态
            hideSearchingState();
            
        } catch (error) {
            hideSearchingState();
            
            if (error.message.includes('搜索超时')) {
                // 显示超时提示
                showSearchTimeout();
            } else {
                FindLite.errorHandler.handle(
                    FindLite.errorHandler.ErrorTypes.API_ERROR, 
                    error, 
                    { inputText, isRegex }
                );
            }
            
            // 清空结果
            clearAllState();
        }
    };

    // 保留原始函数作为兼容性备用
    self.findInputChangeListener = self.performSearch;

    self.caseSensitiveClickListener = async function (event) {
        FindLite.panel.toggleSensitive();
        await FindLite.storage.setSensitive(FindLite.panel.isCaseSensitive());
        // 立即搜索，无需防抖
        await self.performSearch(event);
    };

    self.wholeWordClickListener = async function (event) {
        FindLite.panel.toggleWholeWord();
        await FindLite.storage.setWholeWord(FindLite.panel.isWholeWord());
        await self.performSearch(event);
    };

    self.regexClickListener = async function (event) {
        FindLite.panel.toggleRegex();
        await FindLite.storage.setRegex(FindLite.panel.isRegex());
        await FindLite.storage.setWholeWord(FindLite.panel.isWholeWord());
        
        // 正则模式切换时，重新创建防抖函数
        const isRegex = FindLite.panel.isRegex();
        const delay = FindLite.searchOptimizer.getDebounceDelay(isRegex);
        debouncedSearch = FindLite.searchOptimizer.debounce(self.performSearch, delay);
        
        await self.performSearch(event);
    };

    self.previousClickListener = async function (event) {
        if (ranges.length > 0) {
            currentIndex = (currentIndex - 1 + ranges.length) % ranges.length;
            renderHighlight();
        }
    };

    self.nextClickListener = async function (event) {
        if (ranges.length > 0) {
            currentIndex = (currentIndex + 1) % ranges.length;
            renderHighlight();
        }
    };

    self.exitClickListener = async function (event) {
        FindLite.panel.hide();
        clearAllState();
    };

    function renderHighlight() {
        FindLite.panel.updateIndexText(currentIndex, ranges.length);
        FindLite.page.expandRange(ranges[currentIndex])
        FindLite.page.scrollToRange(ranges[currentIndex]);
        FindLite.page.clearAllHighlights();
        if (ranges.length > 0) {
            FindLite.page.highlight(ranges);
            FindLite.page.highlightFocused(ranges[currentIndex]);
            bindHighlightLineScrollEvent();
        }
    }

    function clearAllState() {
        ranges = [];
        currentIndex = 0;
        selectRange = null;
        FindLite.page.clearAllHighlights();
        FindLite.panel.clearSearchField();
        FindLite.panel.disableNaviButton();
        FindLite.panel.hideSidebar();
        unbindHighlightLineScrollEvent();
    }

    function bindHighlightLineScrollEvent() {
        window.addEventListener("scroll", updateHighlightLinePosition);
        let ele = ranges[currentIndex].commonAncestorContainer;
        while (ele) {
            if (ele.nodeType === Node.ELEMENT_NODE) {
                if (ele.scrollHeight > ele.clientHeight || ele.scrollWidth > ele.clientWidth) {
                    ele.addEventListener("scroll", updateHighlightLinePosition)
                    highlightScrollEventElements.push(ele);
                }
            }
            ele = ele.parentElement;
        }
    }

    function unbindHighlightLineScrollEvent() {
        window.removeEventListener("scroll", updateHighlightLinePosition)
        highlightScrollEventElements.forEach(function (element) {
            element.removeEventListener("scroll", updateHighlightLinePosition)
        })
        highlightScrollEventElements = [];
    }

    function updateHighlightLinePosition() {
        FindLite.page.updateHighlightLine(ranges[currentIndex]);
    }
    
    // 显示搜索进行中状态
    function showSearchingState() {
        const searchField = FindLite.panel.element.searchField;
        searchField.style.opacity = '0.7';
        searchField.style.cursor = 'wait';
        FindLite.panel.element.searchIndexText.innerText = '搜索中...';
    }
    
    // 隐藏搜索状态
    function hideSearchingState() {
        const searchField = FindLite.panel.element.searchField;
        searchField.style.opacity = '';
        searchField.style.cursor = '';
    }
    
    // 显示搜索超时提示
    function showSearchTimeout() {
        FindLite.panel.element.searchIndexText.innerText = '搜索超时';
        const searchField = FindLite.panel.element.searchField;
        searchField.style.borderColor = '#ff9800';
        searchField.title = '搜索超时，请简化搜索条件';
        
        // 3秒后恢复
        setTimeout(() => {
            searchField.style.borderColor = '';
            searchField.title = 'Search Field';
            if (ranges.length === 0) {
                FindLite.panel.element.searchIndexText.innerText = '';
            }
        }, 3000);
    }

    return self;
})();