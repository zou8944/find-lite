class ShortcutManager {
    constructor() {
        this.shortcuts = {
            'ctrl-shift-f': {
                name: 'Ctrl+Shift+F',
                mac: 'Command+Shift+F',
                keys: { ctrl: true, shift: true, key: 'f' }
            },
            'ctrl-alt-f': {
                name: 'Ctrl+Alt+F',
                mac: 'Command+Alt+F',
                keys: { ctrl: true, alt: true, key: 'f' }
            },
            'alt-shift-f': {
                name: 'Alt+Shift+F',
                mac: 'Alt+Shift+F',
                keys: { alt: true, shift: true, key: 'f' }
            },
            'ctrl-shift-g': {
                name: 'Ctrl+Shift+G',
                mac: 'Command+Shift+G',
                keys: { ctrl: true, shift: true, key: 'g' }
            },
            'ctrl-k': {
                name: 'Ctrl+K',
                mac: 'Command+K',
                keys: { ctrl: true, key: 'k' }
            },
            'custom': {
                name: '自定义快捷键',
                mac: '自定义快捷键',
                keys: null
            }
        };
        
        this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        this.currentShortcut = 'ctrl-shift-f';
        this.customShortcut = null;
        this.testTimeout = null;
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.bindEvents();
        this.updateDisplay();
        this.updateCustomDisplay();
        this.testCurrentShortcut();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['shortcutKey', 'customShortcut']);
            this.currentShortcut = result.shortcutKey || 'ctrl-shift-f';
            this.customShortcut = result.customShortcut || null;
            
            // 如果有自定义快捷键，显示自定义选项
            if (this.customShortcut) {
                document.getElementById('custom-shortcut').style.display = 'block';
                document.getElementById('custom-input').value = this.customShortcut.text;
            }
            
            document.getElementById('shortcut-select').value = this.currentShortcut;
        } catch (error) {
            console.warn('Find Lite: 加载设置失败', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({
                shortcutKey: this.currentShortcut,
                customShortcut: this.customShortcut
            });
        } catch (error) {
            console.warn('Find Lite: 保存设置失败', error);
        }
    }

    bindEvents() {
        // 快捷键选择变化
        document.getElementById('shortcut-select').addEventListener('change', (e) => {
            this.currentShortcut = e.target.value;
            
            // 如果选择了自定义，显示自定义输入区域
            if (e.target.value === 'custom') {
                document.getElementById('custom-shortcut').style.display = 'block';
                // 如果还没有自定义快捷键，清空输入框
                if (!this.customShortcut) {
                    document.getElementById('custom-input').value = '';
                    document.getElementById('custom-input').focus();
                }
            } else {
                document.getElementById('custom-shortcut').style.display = 'none';
                // 如果选择了预设快捷键，清除自定义快捷键
                this.customShortcut = null;
            }
            
            this.updateDisplay();
            this.updateCustomDisplay();
            this.saveSettings();
            this.testCurrentShortcut();
        });

        // 测试按钮
        document.getElementById('test-shortcut').addEventListener('click', () => {
            this.testCurrentShortcut();
        });

        // 自定义快捷键输入
        document.getElementById('custom-input').addEventListener('keydown', (e) => {
            e.preventDefault();
            this.recordCustomShortcut(e);
        });

        // 清除自定义快捷键
        document.getElementById('clear-custom').addEventListener('click', () => {
            this.customShortcut = null;
            document.getElementById('custom-input').value = '';
            // 切换回默认快捷键
            this.currentShortcut = 'ctrl-shift-f';
            document.getElementById('shortcut-select').value = 'ctrl-shift-f';
            document.getElementById('custom-shortcut').style.display = 'none';
            this.updateDisplay();
            this.updateCustomDisplay();
            this.saveSettings();
            this.testCurrentShortcut();
        });

        // 添加"设置自定义快捷键"按钮
        const customBtn = document.createElement('button');
        customBtn.textContent = '设置自定义快捷键';
        customBtn.className = 'test-btn';
        customBtn.style.marginLeft = '8px';
        customBtn.onclick = () => {
            document.getElementById('shortcut-select').value = 'custom';
            this.currentShortcut = 'custom';
            document.getElementById('custom-shortcut').style.display = 'block';
            document.getElementById('custom-input').focus();
            this.updateDisplay();
            this.updateCustomDisplay();
        };
        
        document.querySelector('.settings-section').appendChild(customBtn);
    }

    recordCustomShortcut(event) {
        const modifiers = [];

        if (event.ctrlKey || event.metaKey) modifiers.push(this.isMac ? 'Command' : 'Ctrl');
        if (event.altKey) modifiers.push('Alt');
        if (event.shiftKey) modifiers.push('Shift');

        let keyName = event.key;
        if (keyName === ' ') keyName = 'Space';
        if (keyName === 'Enter') keyName = 'Enter';
        if (keyName === 'Tab') keyName = 'Tab';
        if (keyName === 'Escape') keyName = 'Esc';
        if (keyName.length === 1) keyName = keyName.toUpperCase();

        // 必须包含至少一个修饰键，且不能只是修饰键
        if (modifiers.length > 0 && 
            keyName !== 'Control' && 
            keyName !== 'Alt' && 
            keyName !== 'Shift' && 
            keyName !== 'Meta' &&
            keyName !== 'Command') {
            
            const shortcutText = modifiers.join('+') + '+' + keyName;
            document.getElementById('custom-input').value = shortcutText;
            
            this.customShortcut = {
                text: shortcutText,
                keys: {
                    ctrl: event.ctrlKey || event.metaKey,
                    alt: event.altKey,
                    shift: event.shiftKey,
                    key: event.key.toLowerCase()
                }
            };
            
            this.saveSettings();
            this.updateDisplay();
            this.updateCustomDisplay();
            this.testCurrentShortcut();
            
            // 显示成功提示
            this.setStatus('available', `自定义快捷键已设置: ${shortcutText}`);
        } else {
            // 显示输入提示
            document.getElementById('custom-input').placeholder = '请按下包含修饰键的组合键 (如: Ctrl+J)';
        }
    }

    updateDisplay() {
        if (this.currentShortcut === 'custom' && this.customShortcut) {
            document.getElementById('current-display').textContent = this.customShortcut.text;
        } else if (this.currentShortcut === 'custom') {
            document.getElementById('current-display').textContent = '未设置自定义快捷键';
        } else {
            const shortcut = this.shortcuts[this.currentShortcut];
            const displayText = this.isMac ? shortcut.mac : shortcut.name;
            document.getElementById('current-display').textContent = displayText;
        }
    }

    updateCustomDisplay() {
        // 更新当前快捷键显示的样式
        const shortcutValueEl = document.getElementById('current-display');
        if (this.currentShortcut === 'custom') {
            shortcutValueEl.style.backgroundColor = '#e6f4ea';
            shortcutValueEl.style.borderColor = '#137333';
            shortcutValueEl.style.color = '#137333';
        } else {
            shortcutValueEl.style.backgroundColor = '';
            shortcutValueEl.style.borderColor = '';
            shortcutValueEl.style.color = '';
        }
    }

    async testCurrentShortcut() {
        this.setStatus('unknown', '检测中...');
        
        try {
            // 向活动标签页发送测试消息
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                const response = await this.sendTestMessage(tabs[0].id);
                if (response && response.status === 'ok') {
                    if (this.currentShortcut === 'custom' && this.customShortcut) {
                        this.setStatus('available', `自定义快捷键可用: ${this.customShortcut.text}`);
                    } else if (this.currentShortcut === 'custom') {
                        this.setStatus('conflict', '请先设置自定义快捷键');
                    } else {
                        const shortcut = this.shortcuts[this.currentShortcut];
                        const displayText = this.isMac ? shortcut.mac : shortcut.name;
                        this.setStatus('available', `快捷键可用: ${displayText}`);
                    }
                } else {
                    this.setStatus('conflict', '内容脚本未响应，请刷新页面');
                }
            } else {
                this.setStatus('unknown', '请在网页中测试快捷键');
            }
        } catch (error) {
            console.warn('Find Lite: 测试快捷键失败', error);
            this.setStatus('unknown', '检测失败');
        }
    }

    sendTestMessage(tabId) {
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
                if (chrome.runtime.lastError) {
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        });
    }

    setStatus(type, message) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        // 移除所有状态类
        indicator.className = 'status-' + type;
        text.textContent = message;
        
        // 设置对应图标
        const icon = indicator.querySelector('.status-icon');
        switch (type) {
            case 'available':
                icon.textContent = '✅';
                break;
            case 'conflict':
                icon.textContent = '⚠️';
                break;
            default:
                icon.textContent = '⏳';
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const shortcutManager = new ShortcutManager();
});
