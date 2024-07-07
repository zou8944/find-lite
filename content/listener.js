FindLite.listener = (function () {
    const self = {};

    let ranges = [];
    let currentIndex = 0;
    let selectRange = null;
    let highlightScrollEventElements = []

    self.registerAllListeners = function () {
        FindLite.panel.element.searchField.oninput = self.findInputChangeListener;
        FindLite.panel.element.caseSensitiveButton.onclick = self.caseSensitiveClickListener;
        FindLite.panel.element.wholeWordButton.onclick = self.wholeWordClickListener;
        FindLite.panel.element.regexButton.onclick = self.regexClickListener;
        FindLite.panel.element.previousButton.onclick = self.previousClickListener;
        FindLite.panel.element.nextButton.onclick = self.nextClickListener;
        FindLite.panel.element.exitButton.onclick = self.exitClickListener;
        // 添加而不是覆盖 keydown 处理器
        document.addEventListener("keydown", self.keydownListener);
    };

    self.keydownListener = async function (event) {
        // Ctrl+Shift+F 或 Command+Shift+F 呼出搜索框
        if (event.ctrlKey || event.metaKey) {
            if (event.shiftKey && event.key.toLowerCase() === 'f') {
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
                await self.findInputChangeListener(event);
            }
        }
        // ESC 清空并隐藏搜索框
        else if (event.keyCode === 27) {
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

    self.findInputChangeListener = async function (event) {
        const inputText = FindLite.panel.element.searchField.value;
        if (inputText === "") {
            clearAllState();
            return;
        }

        const isCaseSensitive = FindLite.panel.isCaseSensitive();
        const isWholeWord = FindLite.panel.isWholeWord();
        const isRegex = FindLite.panel.isRegex();
        // 找出body下所有可见元素符合条件的文本
        ranges = FindLite.finder.findInBody(inputText, isCaseSensitive, isWholeWord, isRegex);
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
    };

    self.caseSensitiveClickListener = async function (event) {
        FindLite.panel.toggleSensitive();
        await FindLite.storage.setSensitive(FindLite.panel.isCaseSensitive());
        await self.findInputChangeListener(event);
    };

    self.wholeWordClickListener = async function (event) {
        FindLite.panel.toggleWholeWord();
        await FindLite.storage.setWholeWord(FindLite.panel.isWholeWord());
        await self.findInputChangeListener(event);
    };

    self.regexClickListener = async function (event) {
        FindLite.panel.toggleRegex();
        await FindLite.storage.setRegex(FindLite.panel.isRegex());
        await FindLite.storage.setWholeWord(FindLite.panel.isWholeWord());
        await self.findInputChangeListener(event);
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

    return self;
})();