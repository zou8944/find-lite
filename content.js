let ranges = [];
let currentIndex = 0;
let totalCount = 0;

function replaceURL(rawCSS, relativeURL) {
    return rawCSS.replace(relativeURL, chrome.runtime.getURL(relativeURL));
}

(async function () {
    // 插入css：由于css文件中有用到图片，所以需要用到chrome.runtime.getURL对他们进行替换
    let rawCSS = await fetch(chrome.runtime.getURL("content.css")).then(response => response.text());
    rawCSS = replaceURL(rawCSS, "icons/up-disable.png");
    rawCSS = replaceURL(rawCSS, "icons/up-enable.png");
    rawCSS = replaceURL(rawCSS, "icons/down-disable.png");
    rawCSS = replaceURL(rawCSS, "icons/down-enable.png");
    rawCSS = replaceURL(rawCSS, "icons/exit.png");
    const style = document.createElement("style");
    style.innerHTML = rawCSS;
    document.head.appendChild(style);

    // 插入html
    const rawHTML = `
        <div id="find-lite-container" class="find-lite-container">
            <div id="find-lite-search-field-container">
                <input id="find-lite-search-field" type="text" name="search" title="Search Field" size="30"/>
                <div id="find-lite-search-info">
                    <span id="find-lite-index-text"></span>
                </div>
            </div>
            <div id="find-lite-switcher-container">
                <button id="find-lite-case-sensitive" title="Case Sensitive">Cc</button>
                <button id="find-lite-whole-word" title="Whole Word">W</button>
                <button id="find-lite-regex" title="Regular Expression">.*</button>
            </div>
            <div id="find-lite-search-control-container">
                <button id="find-lite-previous" title="Previous"></button>
                <button id="find-lite-next" title="Next"></button>
                <button id="find-lite-exit" title="Exit"></button>
            </div>
        </div>`;
    const html = document.createElement("div");
    html.innerHTML = rawHTML;
    document.body.appendChild(html.children[0]);
    console.log("Hello from Find Lite!");

    registerAction();
})();

function registerAction() {
    // 键盘事件
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
            await showSearchBox();
        }
    }
    // ESC 清空并隐藏搜索框
    else if (event.keyCode === 27) {
        await onExitClicked(event);
    }
    // Shift+Enter 上一个
    else if (event.shiftKey && event.keyCode === 13) {
        await onPrevClicked(event);
    }
    // Enter 下一个
    else if (event.keyCode === 13) {
        await onNextClicked(event);
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
    renderCurrentRange();
}

async function onNextClicked(event) {
    currentIndex = (currentIndex + 1) % totalCount;
    renderCurrentRange();
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
    currentIndex = determineInitialRangeIndex(ranges);

    renderCurrentRange();

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

async function showSearchBox() {
    const searchBox = document.getElementById("find-lite-container");
    searchBox.classList.remove("hide");
    searchBox.classList.add("show");
    // 输入框填充当前选中的文本
    // TODO 由于集中焦点后原来的选择会丢失，因此需要将选中的设置为搜索结果的初始index，以达到迷惑的目的
    const selectedText = window.getSelection().toString();
    document.getElementById("find-lite-search-field").focus();
    document.getElementById("find-lite-search-field").value = selectedText;
    document.getElementById("find-lite-search-field").select();
    await onSearchInputChanged(null);
}

function disableNaviButton() {
    document.getElementById("find-lite-previous").disabled = true;
    document.getElementById("find-lite-next").disabled = true;
}

function enableNaviButton() {
    document.getElementById("find-lite-previous").disabled = false;
    document.getElementById("find-lite-next").disabled = false;
}

function determineInitialRangeIndex(ranges) {
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
}

function renderCurrentRange() {
    scrollToRange(ranges[currentIndex]);
    const displayCount = currentIndex + 1;
    document.getElementById("find-lite-index-text").innerText = `${displayCount} / ${totalCount}`;
    CSS.highlights.set("search-results-focus", new Highlight(ranges[currentIndex]));
}

function scrollToRange(range) {
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