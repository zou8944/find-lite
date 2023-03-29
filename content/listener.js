FindLite.listener = (function () {
    const self = {};

    let ranges = [];
    let currentIndex = 0;
    let selectRange = null;

    self.registerAllListeners = function () {
        FindLite.panel.element.searchField.oninput = self.findInputChangeListener;
        FindLite.panel.element.caseSensitiveButton.onclick = self.caseSensitiveClickListener;
        FindLite.panel.element.wholeWordButton.onclick = self.wholeWordClickListener;
        FindLite.panel.element.regexButton.onclick = self.regexClickListener;
        FindLite.panel.element.previousButton.onclick = self.previousClickListener;
        FindLite.panel.element.nextButton.onclick = self.nextClickListener;
        FindLite.panel.element.exitButton.onclick = self.exitClickListener;
        document.onkeydown = self.keydownListener;
    };

    self.keydownListener = function (event) {
        // Ctrl+Shift+F 或 Command+Shift+F 呼出搜索框
        if (event.ctrlKey || event.metaKey) {
            if (event.shiftKey && event.key === 'f') {
                FindLite.panel.show();
                selectRange = window.getSelection().getRangeAt(0);
                if (selectRange) {
                    FindLite.panel.focusAndSelect(selectRange.toString());
                }
                self.findInputChangeListener(event);
            }
        }
        // ESC 清空并隐藏搜索框
        else if (event.keyCode === 27) {
            self.exitClickListener(event);
        }
        // Shift+Enter 上一个
        else if (event.shiftKey && event.keyCode === 13) {
            self.previousClickListener(event);
        }
        // Enter 下一个
        else if (event.keyCode === 13) {
            self.nextClickListener(event);
        }
    };

    self.findInputChangeListener = function (event) {
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
        currentIndex = FindLite.page.determineInitialRangeIndex(ranges);
        // 根据搜索结果渲染显示内容
        renderHighlight();

        if (ranges.length > 0) {
            FindLite.panel.enableNaviButton();
        } else {
            FindLite.panel.disableNaviButton();
        }
    };

    self.caseSensitiveClickListener = function (event) {
        FindLite.panel.toggleSensitive();
        self.findInputChangeListener(event);
    };

    self.wholeWordClickListener = function (event) {
        FindLite.panel.toggleWholeWord();
        self.findInputChangeListener(event);
    };

    self.regexClickListener = function (event) {
        FindLite.panel.toggleRegex();
        // 正则和全词匹配互斥
        if (FindLite.panel.isRegex()) {
            FindLite.panel.disableWholeWord();
        } else {
            FindLite.panel.enableWholeWord();
        }
        self.findInputChangeListener(event);
    };

    self.previousClickListener = function (event) {
        currentIndex = (currentIndex - 1 + ranges.length) % ranges.length;
        renderHighlight();
    };

    self.nextClickListener = function (event) {
        currentIndex = (currentIndex + 1) % ranges.length;
        renderHighlight();
    };

    self.exitClickListener = function (event) {
        FindLite.panel.hide();
        clearAllState();
    };

    function renderHighlight() {
        FindLite.panel.updateIndexText(currentIndex, ranges.length);
        FindLite.page.scrollToRange(ranges[currentIndex]);
        FindLite.page.clearAllHighlights();
        if (ranges.length > 0) {
            FindLite.page.highlight(ranges);
            FindLite.page.highlightFocused(ranges[currentIndex]);
        }
    }

    function clearAllState() {
        ranges = [];
        currentIndex = 0;
        FindLite.page.clearAllHighlights();
        FindLite.panel.clearSearchField();
        FindLite.panel.disableNaviButton();
    }

    return self;
})();