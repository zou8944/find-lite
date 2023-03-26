let ranges = [];
let currentIndex = 0;
let totalCount = 0;

(function () {
    registerAction();
})();

function registerAction() {
    // 按钮事件
    document.onkeydown = onKeydown;
    // 搜索框事件 - 输入变化
    document.getElementById("find-lite-search-field").oninput = onSearchInputChanged;
    // 大小写事件 - 点击
    document.getElementById("find-lite-case-sensitive").onclick = onCaseSensitiveClicked;
    // 单词全匹配按钮事件 - 点击
    document.getElementById("find-lite-whole-word").onclick = onWholeWordClicked;
    // 正则表达式按钮事件 - 点击
    document.getElementById("find-lite-regex").onclick = onRegexClicked;
    // 上一个按钮事件 - 点击
    document.getElementById("find-lite-previous").onclick = onPrevClicked;
    // 下一个按钮事件 - 点击
    document.getElementById("find-lite-next").onclick = onNextClicked;
    // 退出按钮事件 - 点击
    document.getElementById("find-lite-exit").onclick = onExitClicked;
}

async function onKeydown(event) {
    // Ctrl+Shift+F 或 Command+Shift+F 呼出搜索框
    if (event.ctrlKey || event.metaKey) {
        if (event.shiftKey && event.key === 'f') {
            const searchBox = document.getElementById("find-lite-container");
            searchBox.classList.remove("hide");
            searchBox.classList.add("show");
            document.getElementById("find-lite-search-field").focus();
            return;
        }
    }
    // ESC 清空并隐藏搜索框
    if (event.keyCode === 27) {
        await onExitClicked(event);
        return;
    }
    // Enter 下一个
    if (event.keyCode === 13) {
        await onNextClicked(event);
        return;
    }
    // Shift+Enter 上一个
    if (event.shiftKey && event.keyCode === 13) {
        await onPrevClicked(event);
    }
}

async function onSearchInputChanged(event) {
    searchAndHighlight();
}

async function onCaseSensitiveClicked(event) {
    event.target.classList.toggle("active");
    searchAndHighlight();
}

async function onWholeWordClicked(event) {
    event.target.classList.toggle("active");
    searchAndHighlight();
}

async function onRegexClicked(event) {
    const regexButton = event.target;
    regexButton.classList.toggle("active");
    // 正则和全词匹配互斥
    if (regexButton.classList.contains("active")) {
        document.getElementById("find-lite-whole-word").disabled = true;
        document.getElementById("find-lite-whole-word").classList.remove("active");
    } else {
        document.getElementById("find-lite-whole-word").disabled = false;
    }
    searchAndHighlight();
}

async function onPrevClicked(event) {
    currentIndex = (currentIndex - 1 + totalCount) % totalCount;
    CSS.highlights.set("search-results-focus", new Highlight(ranges[currentIndex]));
    refreshIndexText(true);
}

async function onNextClicked(event) {
    currentIndex = (currentIndex + 1) % totalCount;
    CSS.highlights.set("search-results-focus", new Highlight(ranges[currentIndex]));
    refreshIndexText(true);
}

async function onExitClicked(event) {
    clearStatus();
    hideSearchBox();
}

function searchAndHighlight() {
    const inputText = document.getElementById("find-lite-search-field").value;
    if (!inputText || inputText === "") {
        clearStatus();
        return;
    }

    const allTextNodes = findAllVisibleTextNode();

    CSS.highlights.clear();
    ranges = allTextNodes.map(node => findAllTextInNode(node, inputText)).flat();
    CSS.highlights.set("search-results", new Highlight(...ranges));

    totalCount = ranges.length;
    refreshIndexText(false);

    if (totalCount > 0) {
        enableNaviButton();
    } else {
        disableNaviButton();
    }
}

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
function findAllTextInNode(node, inputText) {
    const ranges = [];
    // 正则匹配模式
    if (isRegex()) {
        regexFind(node, ranges, inputText, isCaseSensitive());
    }
    // 全词匹配模式
    else if (isWholeWord()) {
        regexFind(node, ranges, `\\b${inputText}\\b`, isCaseSensitive());
    }
    // 普通模式
    else {
        standardFind(node, ranges, inputText, isCaseSensitive());
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

function clearStatus() {
    CSS.highlights.clear();
    ranges = [];
    currentIndex = 0;
    totalCount = 0;
    document.getElementById("find-lite-index-text").innerText = "";
    document.getElementById("find-lite-search-field").value = "";
    disableNaviButton();
}

function hideSearchBox() {
    const searchBox = document.getElementById("find-lite-container");
    searchBox.classList.remove("show");
    searchBox.classList.add("hide");
}

function showSearchBox() {
    const searchBox = document.getElementById("find-lite-container");
    searchBox.classList.remove("hide");
    searchBox.classList.add("show");
}

function disableNaviButton() {
    document.getElementById("find-lite-previous").disabled = true;
    document.getElementById("find-lite-next").disabled = true;
}

function enableNaviButton() {
    document.getElementById("find-lite-previous").disabled = false;
    document.getElementById("find-lite-next").disabled = false;
}

function refreshIndexText(isInNavigate = false) {
    const displayCount = isInNavigate ? currentIndex + 1 : 0;
    document.getElementById("find-lite-index-text").innerText = `${displayCount} / ${totalCount}`;
}

function isCaseSensitive() {
    return document.getElementById("find-lite-case-sensitive").classList.contains("active");
}

function isWholeWord() {
    return document.getElementById("find-lite-whole-word").classList.contains("active");
}

function isRegex() {
    return document.getElementById("find-lite-regex").classList.contains("active");
}