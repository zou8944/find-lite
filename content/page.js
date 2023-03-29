FindLite.page = (function () {
    const self = {};

    self.determineInitialRangeIndex = function (ranges, selectedRange) {
        // 如果有选中的range则直接高亮
        if (selectedRange) {
            for (let i = 0; i < ranges.length; i++) {
                const isStartSame = ranges[i].compareBoundaryPoints(Range.START_TO_START, selectedRange) === 0;
                const isEndSame = ranges[i].compareBoundaryPoints(Range.END_TO_END, selectedRange) === 0;
                const isParentSame = ranges[i].commonAncestorContainer === selectedRange.commonAncestorContainer;
                if (isStartSame && isEndSame && isParentSame) {
                    return i;
                }
            }
        }

        let initialIndex = -1;
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const rect = range.getBoundingClientRect();
            // 只对视窗内的 range 进行处理：优先上半窗，否则下半窗第一个
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                if (initialIndex === -1) {
                    initialIndex = i;
                    continue;
                }
                if (rect.top > window.innerHeight / 2) {
                    break;
                }
                if (rect.top > ranges[initialIndex].getBoundingClientRect().top) {
                    initialIndex = i;
                }
            }
            if (rect.top > window.innerHeight) {
                break;
            }
        }
        // 如果没有在视窗内的，则默认选中第一个
        if (initialIndex === -1) {
            initialIndex = 0;
        }
        return initialIndex;
    };

    self.scrollToRange = function (range) {
        if (!range) {
            return;
        }
        // 如果range已经在视窗内，则不需要滚动
        const rect = range.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
            return;
        }
        // 如果range的下半部分在视窗内，则整个range滚动到视窗
        if (rect.top < 0 && rect.bottom > 0) {
            const yOffset = rect.top;
            window.scrollBy(0, yOffset - 2);
            return;
        }
        // 如果range的上半部分在视窗内，则整个range滚动到视窗
        if (rect.top < window.innerHeight && rect.bottom > window.innerHeight) {
            const yOffset = rect.bottom - window.innerHeight;
            window.scrollBy(0, yOffset + 2);
            return;
        }
        // 否则，滚动到视窗的中心
        const yOffset = -window.innerHeight / 2 + rect.top + rect.height / 2;
        window.scrollBy(0, yOffset);
    };

    self.highlight = function (ranges) {
        CSS.highlights.set("search-results", new Highlight(...ranges));
    };

    self.highlightFocused = function (range) {
        CSS.highlights.set(FindLite.panel.element.currentFocusHighlightName, new Highlight(range));
    };

    self.clearAllHighlights = function () {
        CSS.highlights.clear();
    };

    return self;
})();