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
    // 获取输入事件的文本，遍历整个dom，查找相关的内容
    const inputText = event.target.value;
    if (!inputText || inputText === "") {
        clearStatus();
        return;
    }

    const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const allTextNodes = [];
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
        allTextNodes.push(currentNode);
        currentNode = treeWalker.nextNode();
    }

    CSS.highlights.clear();
    ranges = allTextNodes.map((node) => {
        const indices = [];
        const text = node.textContent;
        let startPos = 0;
        while (startPos < text.length) {
            const index = text.indexOf(inputText, startPos);
            if (index === -1) break;
            indices.push(index);
            startPos = index + inputText.length;
        }
        return indices.map((index) => {
            const range = new Range();
            range.setStart(node, index);
            range.setEnd(node, index + inputText.length);
            return range;
        });
    }).flat();
    totalCount = ranges.length;

    CSS.highlights.set("search-results", new Highlight(...ranges));

    refreshIndexText(false);

    if (totalCount > 0) {
        enableNaviButton();
    } else {
        disableNaviButton();
    }
}

async function onCaseSensitiveClicked(event) {
    event.target.classList.toggle("active");
}

async function onWholeWordClicked(event) {
    event.target.classList.toggle("active");
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