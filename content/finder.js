FindLite.finder = (function () {

    const self = {};

    self.findInBody = function (inputText, isCaseSensitive, isWholeWord, isRegex) {
        return findAllVisibleTextNode()
            .map(node => findAllTextInNode(node, inputText, isCaseSensitive, isWholeWord, isRegex))
            .flat();
    };

    function findAllVisibleTextNode() {
        const textNodes = [];
        findVisibleTextNode(document.body, textNodes);
        return textNodes;
    }

    // 深度优先遍历：保证得到的文本节点和显示的顺序一致
    function findVisibleTextNode(node, textNodes) {
        if (isNodeDisplayed(node)) {
            for (let i = 0; i < node.childNodes.length; i++) {
                // 如果是元素节点, 递归
                if (node.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                    findVisibleTextNode(node.childNodes[i], textNodes);
                }
                // 如果是文本节点, 加入结果
                if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
                    // 排除空白文本节点
                    if (node.childNodes[i].textContent.trim() !== "") {
                        textNodes.push(node.childNodes[i]);
                    }
                }
            }
        }
    }

    // 节点显示检查器，从根节点扫描有效，不可判断一个节点的多级父节点是否可见
    function isNodeDisplayed(node) {
        // 非element节点直接判定为可见
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return true;
        }
        // 特殊元素本身就不可见
        if (node.tagName === "SCRIPT" || node.tagName === "STYLE") {
            return false;
        }
        // 本插件的元素不可见
        if (node.classList.contains("find-lite-container")) {
            return false;
        }
        // 根据元素可见性判断
        const style = window.getComputedStyle(node);
        return !(style.display === "none" || style.visibility === "hidden");
    }

    // 查找一个node中符合要求的文本，以range的形式返回
    function findAllTextInNode(node, inputText, isCaseSensitive, isWholeWord, isRegex) {
        const ranges = [];
        // 正则匹配模式
        if (isRegex) {
            regexFind(node, ranges, inputText, isCaseSensitive);
        }
        // 全词匹配模式
        else if (isWholeWord) {
            regexFind(node, ranges, `\\b${inputText}\\b`, isCaseSensitive);
        }
        // 普通模式
        else {
            standardFind(node, ranges, inputText, isCaseSensitive);
        }
        return ranges;
    }

    function standardFind(node, ranges, inputText, isCaseSensitive) {
        const nodeText = isCaseSensitive ? node.textContent : node.textContent.toLowerCase();
        const searchText = isCaseSensitive ? inputText : inputText.toLowerCase();
        let startPos = 0;
        while (startPos < nodeText.length) {
            const index = nodeText.indexOf(searchText, startPos);
            if (index === -1) break;
            const range = new Range();
            range.setStart(node, index);
            range.setEnd(node, index + searchText.length);
            ranges.push(range);
            startPos = index + searchText.length;
        }
    }

    function regexFind(node, ranges, regexPatten, isCaseSensitive) {
        let match;
        let regex;
        try {
            regex = new RegExp(regexPatten, isCaseSensitive ? 'g' : 'gi');
        } catch (e) {
            // 正则表达式错误，不进行匹配
        }
        while ((match = regex.exec(node.textContent)) !== null) {
            const range = new Range();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            ranges.push(range);
        }
    }

    return self;
})();
