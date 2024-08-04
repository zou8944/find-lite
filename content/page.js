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

    self.calVerticalLineTopPercents = function (ranges) {
        // 计算整个页面的高度
        const bodyHeight = document.body.scrollHeight;
        const topPercents = [];
        // 遍历ranges，获取每个range相对body顶部的距离，去重加入tops
        const bodyRect = document.body.getBoundingClientRect();
        const bodyTop = bodyRect.top;
        for (let range of ranges) {
            const rect = range.getBoundingClientRect();
            const top = rect.top - bodyTop;
            const topPercent = Math.round(top / bodyHeight * 100) + "%";
            if (topPercents.indexOf(topPercent) === -1) {
                topPercents.push(topPercent);
            }
        }
        return topPercents;
    };

    self.expandRange = function (range) {
        if (!range) {
            return
        }
        // 递归遍历 range 的父节点，如果存在 details 节点，则让其展开
        let parentNode = range.commonAncestorContainer
        while (parentNode) {
            if (parentNode.tagName === "DETAILS") {
                parentNode.open = true;
            }
            parentNode = parentNode.parentNode;
        }
    }

    self.scrollToRange = function (range) {
        if (!range) {
            return;
        }

        // 获取当前 range 所属 element 节点
        let rangeNode = range.commonAncestorContainer;
        while (rangeNode.nodeType !== Node.ELEMENT_NODE) {
            rangeNode = rangeNode.parentNode;
        }
        // 获取当前 range 第一个可滚动父节点
        let scrollNode = rangeNode;
        while (scrollNode) {
            if (scrollNode.scrollHeight > scrollNode.clientHeight || scrollNode.scrollWidth > scrollNode.clientWidth) {
                break;
            }
            scrollNode = scrollNode.parentNode;
        }
        // 如果 rect 已经在视窗内，且已经在 scrollNode 的视窗内，则无需滚动
        let rangeRect = range.getBoundingClientRect();
        let scrollNodeRect = scrollNode.getBoundingClientRect();
        const isInView = rangeRect.top >= 0 && rangeRect.bottom <= window.innerHeight;
        const isInScrollNode = rangeRect.top >= scrollNodeRect.top
            && rangeRect.bottom <= scrollNodeRect.top + scrollNode.clientHeight
            && rangeRect.left >= scrollNodeRect.left
            && rangeRect.right <= scrollNodeRect.left + scrollNode.clientWidth;
        if (isInView && isInScrollNode) {
            return;
        }

        // 将 rangeNode 滚动到视窗范围内
        rangeNode.scrollIntoView({
            behavior: 'instant',
            block: 'center',
            alignToTop: true
        });

        // 将 range 滚动到 scrollNode 视窗范围内
        self.scrollRangeToScrollNode(range, scrollNode);

        // 将 range 滚动到视窗内部
        self.scrollRangeToView(range);
    };

    self.scrollRangeToScrollNode = function (range, scrollNode) {
        let rangeRect = range.getBoundingClientRect();
        let scrollNodeRect = scrollNode.getBoundingClientRect();
        let scrollX = 0, scrollY = 0;
        if (rangeRect.top < scrollNodeRect.top) {
            scrollY = rangeRect.top - scrollNodeRect.top - scrollNode.clientHeight / 2;
        }
        if (rangeRect.bottom > scrollNodeRect.top + scrollNode.clientHeight) {
            scrollY = rangeRect.bottom - (scrollNodeRect.top + scrollNode.clientHeight) + scrollNode.clientHeight / 2;
        }
        if (rangeRect.left < scrollNodeRect.left) {
            scrollX = rangeRect.left - scrollNodeRect.left - scrollNode.clientWidth / 2;
        }
        if (rangeRect.right > scrollNodeRect.left + scrollNode.clientWidth) {
            scrollX = rangeRect.right - (scrollNodeRect.left + scrollNode.clientWidth) + scrollNode.clientWidth / 2;
        }
        scrollNode.scrollBy({
            left: scrollX,
            top: scrollY,
            behavior: "instant"
        });
    }

    self.scrollRangeToView = function (range) {
        const rect = range.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
            return;
        }

        let scrollX = 0, scrollY = 0;
        if (rect.top < 0 && rect.bottom > 0) {
            scrollY = rect.top - 2;
        } else if (rect.top < window.innerHeight && rect.bottom > window.innerHeight) {
            scrollY = rect.bottom - window.innerHeight + 2;
        } else {
            scrollY = rect.top + rect.height / 2 - window.innerHeight / 2;
        }

        window.scrollBy({
            left: scrollX,
            top: scrollY,
            behavior: "instant"
        });
    }

    self.highlight = function (ranges) {
        CSS.highlights.set("search-results", new Highlight(...ranges));
    };

    self.highlightFocused = function (range) {
        // 高亮
        CSS.highlights.set(FindLite.panel.element.currentFocusHighlightName, new Highlight(range));
        // 更新定位线位置
        self.updateHighlightLine(range);
        // 显示定位线
        FindLite.panel.element.highlightLineX.style.display = 'block';
        FindLite.panel.element.highlightLineY.style.display = 'block';
    };

    self.updateHighlightLine = function (range) {
        // 不在屏幕内就不需要更新
        let rect = range.getBoundingClientRect();
        FindLite.panel.element.highlightLineX.style.top = rect.top + 'px';
        FindLite.panel.element.highlightLineY.style.left = rect.left + 'px';
    };

    self.clearAllHighlights = function () {
        // 清理高亮
        CSS.highlights.clear();
        // 隐藏定位线
        FindLite.panel.element.highlightLineX.style.display = 'none';
        FindLite.panel.element.highlightLineY.style.display = 'none';
    };

    return self;
})();