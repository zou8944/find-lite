FindLite.panel = {
    element: {},
    loadAllElements: function () {
        FindLite.panel.element.containerId = "find-lite-container";
        FindLite.panel.element.currentFocusHighlightName = "search-results-focus";
        FindLite.panel.element.container = document.getElementById('find-lite-container');
        FindLite.panel.element.searchField = document.getElementById('find-lite-search-field');
        FindLite.panel.element.searchIndexText = document.getElementById('find-lite-index-text');
        FindLite.panel.element.caseSensitiveButton = document.getElementById('find-lite-case-sensitive');
        FindLite.panel.element.wholeWordButton = document.getElementById('find-lite-whole-word');
        FindLite.panel.element.regexButton = document.getElementById('find-lite-regex');
        FindLite.panel.element.previousButton = document.getElementById('find-lite-previous');
        FindLite.panel.element.nextButton = document.getElementById('find-lite-next');
        FindLite.panel.element.exitButton = document.getElementById('find-lite-exit');
        FindLite.panel.element.sidebar = document.getElementById('find-lite-sidebar');
    },
    appendCSS: async function () {
        function replaceURL(rawCSS, relativeURL) {
            return rawCSS.replace(relativeURL, chrome.runtime.getURL(relativeURL));
        }

        let rawCSS = await fetch(chrome.runtime.getURL("content/content.css")).then(response => response.text());
        rawCSS = replaceURL(rawCSS, "icons/up-disable.png");
        rawCSS = replaceURL(rawCSS, "icons/up-enable.png");
        rawCSS = replaceURL(rawCSS, "icons/down-disable.png");
        rawCSS = replaceURL(rawCSS, "icons/down-enable.png");
        rawCSS = replaceURL(rawCSS, "icons/exit.png");
        const style = document.createElement("style");
        style.innerHTML = rawCSS;
        document.head.appendChild(style);
    },
    appendHTML: function () {
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
            <div id="find-lite-sidebar">
            </div>
        </div>`;
        const html = document.createElement("div");
        html.innerHTML = rawHTML;
        document.body.appendChild(html.children[0]);
    },
    show: function () {
        FindLite.panel.element.container.style.removeProperty("display");
        FindLite.panel.element.container.classList.remove("hide");
        FindLite.panel.element.container.classList.add("show");
    },
    hide: function () {
        FindLite.panel.element.container.classList.remove("show");
        FindLite.panel.element.container.classList.add("hide");
        // 需要等待动画走完再消失
        setTimeout(function (){
            FindLite.panel.element.container.style.display = "none";
        }, 300)
    },
    showSidebar: function (topPercents) {
        for (let topPercent of topPercents) {
            const line = document.createElement("div");
            line.className = "find-lite-sidebar-line";
            line.style.top = topPercent;
            FindLite.panel.element.sidebar.appendChild(line);
        }
        FindLite.panel.element.sidebar.style.removeProperty("display");
    },
    hideSidebar: function () {
        FindLite.panel.element.sidebar.innerHTML = "";
        FindLite.panel.element.sidebar.style.display = "none";
    },
    clearSidebar: function() {
        FindLite.panel.element.sidebar.innerHTML = "";
    },
    focusAndSelect: function (text) {
        FindLite.panel.element.searchField.value = text;
        FindLite.panel.element.searchField.select();
        FindLite.panel.element.searchField.focus();
    },
    clearSearchField: function () {
        FindLite.panel.element.searchIndexText.innerText = "";
        FindLite.panel.element.searchField.value = "";
    },
    enableNaviButton: function () {
        FindLite.panel.element.previousButton.disabled = false;
        FindLite.panel.element.nextButton.disabled = false;
    },
    disableNaviButton: function () {
        FindLite.panel.element.previousButton.disabled = true;
        FindLite.panel.element.nextButton.disabled = true;
    },
    updateIndexText: function (index, total) {
        FindLite.panel.element.searchIndexText.innerText = Math.min(index + 1, total) + "/" + total;
    },
    setSwitcher: function (caseSensitive, wholeWord, regex) {
        if (caseSensitive) {
            FindLite.panel.element.caseSensitiveButton.classList.add("active");
        } else {
            FindLite.panel.element.caseSensitiveButton.classList.remove("active");
        }
        if (wholeWord) {
            FindLite.panel.element.wholeWordButton.classList.add("active");
        } else {
            FindLite.panel.element.wholeWordButton.classList.remove("active");
        }
        if (regex) {
            FindLite.panel.element.regexButton.classList.add("active");
            FindLite.panel.element.wholeWordButton.disabled = true;
            FindLite.panel.element.wholeWordButton.classList.remove("active");
        } else {
            FindLite.panel.element.regexButton.classList.remove("active");
            FindLite.panel.element.wholeWordButton.disabled = false;
        }
    },
    toggleSensitive: function () {
        FindLite.panel.element.caseSensitiveButton.classList.toggle("active");
    },
    toggleWholeWord: function () {
        FindLite.panel.element.wholeWordButton.classList.toggle("active");
    },
    toggleRegex: function () {
        FindLite.panel.element.regexButton.classList.toggle("active");
        if (FindLite.panel.isRegex()) {
            FindLite.panel.element.wholeWordButton.disabled = true;
            FindLite.panel.element.wholeWordButton.classList.remove("active");
        } else {
            FindLite.panel.element.wholeWordButton.disabled = false;
        }
    },
    isCaseSensitive: function () {
        return FindLite.panel.element.caseSensitiveButton.classList.contains("active");
    },
    isWholeWord: function () {
        return FindLite.panel.element.wholeWordButton.classList.contains("active");
    },
    isRegex: function () {
        return FindLite.panel.element.regexButton.classList.contains("active");
    }
};
