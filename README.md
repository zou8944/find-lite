# Find Lite - 网页上的快速查找工具

[For English](./README.en.md)

Find Lite 是一款方便、易用的Chrome扩展程序。它可以帮助你快速在网页上查找文本内容。特别地，这个插件支持以下功能：

- 支持区分大小写
- 支持全字匹配
- 支持使用正则表达式
- 支持高亮显示匹配结果
- 支持全局概览，可以直接在页面右侧查看所有匹配结果

## 为什么选择 Find Lite

Chrome 官方自带页面搜索功能不够强大，甚至无法区分大小写，使用起来不够方便。

为此，有人专门写了诸如 Find+、 Regex Find 等插件，体验之后，发现如下缺点：

- 搜索框均使用 popup 页面，因为 popup 的特性，失去焦点后会自动关闭，用户体验存在割裂感。
- 搜索结果高亮普遍采用 `<span>` + `background-color` 的方式，这种方式会导致页面布局发生变化。影响其他软件或插件的正常使用。
- 搜索结果无法全局概览，用户需要在搜索结果中逐个查看。

因此，我写了这个插件，希望能够解决以上问题。

Find Lite 的目标，是对 Chrome 自带搜索功能的增强，尽可能做到类似体验。同时相比其他插件，去除不实用的功能，相较而言是 "Lite"
的。

在 Find Lite 中，不需要任何额外设置，快捷键呼出 - 搜索 - 退出，是一切操作的流程。

## 安装方式

你可以通过在Chrome浏览器中打开Chrome网上应用店，并搜索“Find Lite”，来快速安装这个插件。

或者你也可以直接点击[这里](https://chrome.google.com/webstore/detail/find-lite/ndjgjgjgjgjgjgjgjgjgjgjgj)进行安装。

## 使用方法

安装插件后，不需要任何附加设置，一切操作和 Chrome 自带搜索功能几乎一样：

- `Ctrl+Shift+F` （Windows）或 `Command+Shift+F` （Mac） 呼出搜索框
- 输入搜索内容，按下 `Enter` 键开始搜索
- 再次按下 `Enter` 键，可以在搜索结果中循环查找
- `Shift+Enter` 键，可以在搜索结果中反向循环查找
- `Esc` 键，退出搜索

> 小tips
> - 选中文本后，按下 `Ctrl+Shift+F` （Windows）或 `Command+Shift+F` （Mac） 可以直接将选中文本作为搜索内容，且选中的文本将作为高亮聚焦的第一个搜索结果
> - 所有搜索结果将被高亮，但只有一个结果是当前结果，样式上会进一步高亮，我称之为高亮聚焦
> - 选择第一个高亮聚焦的逻辑：选择最靠近视窗中心的结果，如果有多个结果，选择最靠上的结果；如果视窗中没有结果，则选择第一个结果

## 使用预览

![img.png](doc/preview.png)

## Contribution

如果发现bug，请提交issue。如果有好的建议，欢迎提交pull request。