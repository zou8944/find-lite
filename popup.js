let ranges = [];
let currentIndex = 0;
let totalCount = 0;

let isCaseSensitive = false;
let isWholeWord = false;
let isRegex = false;

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
        }
        return;
    }
    // ESC 清空并隐藏搜索框
    if (event.keyCode === 27) {
        clearStatus();
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
        clearIndexText();
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

    refreshIndexText();

    if (totalCount > 0) {
        enableNaviButton();
    } else {
        disableNaviButton();
    }
}

async function onCaseSensitiveClicked(event) {
    isCaseSensitive = event.target.checked;
}

async function onWholeWordClicked(event) {
    isWholeWord = event.target.checked;
}

async function onRegexClicked(event) {
    isRegex = event.target.checked;
}

async function onPrevClicked(event) {
    console.log(currentIndex, totalCount);
    if (currentIndex === 0) {
        currentIndex = totalCount - 1;
    } else {
        currentIndex--;
    }
    CSS.highlights.set("search-results-focus", new Highlight(ranges[currentIndex]));
    refreshIndexText();
}

async function onNextClicked(event) {
    console.log(currentIndex, totalCount);
    if (currentIndex === totalCount - 1) {
        currentIndex = 0;
    } else {
        currentIndex++;
    }
    CSS.highlights.set("search-results-focus", new Highlight(ranges[currentIndex]));
    refreshIndexText();
}

async function onExitClicked(event) {
    clearStatus();
}


function clearStatus() {
    CSS.highlights.clear();
    ranges = [];
    currentIndex = 0;
    totalCount = 0;
    document.getElementById("find-lite-index-text").innerText = "";
    document.getElementById("find-lite-search-field").value = "";
    const searchBox = document.getElementById("find-lite-container");
    searchBox.classList.remove("show");
    searchBox.classList.add("hide");
    disableNaviButton();
}

function disableNaviButton() {
    document.getElementById("find-lite-previous").disabled = true;
    document.getElementById("find-lite-next").disabled = true;
}

function enableNaviButton() {
    document.getElementById("find-lite-previous").disabled = false;
    document.getElementById("find-lite-next").disabled = false;
}

function refreshIndexText() {
    document.getElementById("find-lite-index-text").innerText = `${currentIndex + 1} / ${totalCount}`;
}

function clearIndexText() {
    document.getElementById("find-lite-index-text").innerText = "";
}