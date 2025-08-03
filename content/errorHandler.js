FindLite.errorHandler = (function() {
    const self = {};
    
    // 错误类型枚举
    const ErrorTypes = {
        REGEX_ERROR: 'REGEX_ERROR',
        STORAGE_ERROR: 'STORAGE_ERROR',
        DOM_ERROR: 'DOM_ERROR',
        API_ERROR: 'API_ERROR'
    };
    
    // 错误处理器
    self.handle = function(type, error, context = {}) {
        const timestamp = new Date().toISOString();
        const errorInfo = {
            type,
            message: error.message || error,
            stack: error.stack,
            context,
            timestamp
        };
        
        // 记录错误（开发模式下）
        if (self.isDevelopment()) {
            console.error('Find Lite Error:', errorInfo);
        }
        
        // 根据错误类型处理
        switch (type) {
            case ErrorTypes.REGEX_ERROR:
                self.handleRegexError(error, context);
                break;
            case ErrorTypes.STORAGE_ERROR:
                self.handleStorageError(error, context);
                break;
            case ErrorTypes.DOM_ERROR:
                self.handleDOMError(error, context);
                break;
            default:
                self.handleGenericError(error, context);
        }
    };
    
    // 正则表达式错误处理
    self.handleRegexError = function(error, context) {
        // 可以在UI上显示错误提示
        if (FindLite.panel && FindLite.panel.element.searchField) {
            const field = FindLite.panel.element.searchField;
            field.style.borderColor = '#ff4444';
            field.title = `正则表达式错误: ${error.message}`;
            
            // 3秒后恢复正常样式
            setTimeout(() => {
                field.style.borderColor = '';
                field.title = 'Search Field';
            }, 3000);
        }
    };
    
    // 存储错误处理
    self.handleStorageError = function(error, context) {
        console.warn('Find Lite: Storage operation failed, using defaults');
        // 使用默认值继续操作
    };
    
    // DOM 错误处理
    self.handleDOMError = function(error, context) {
        console.warn('Find Lite: DOM operation failed, skipping');
        // 优雅降级
    };
    
    // 通用错误处理
    self.handleGenericError = function(error, context) {
        console.warn('Find Lite: Unexpected error occurred', error);
    };
    
    // 检查是否为开发模式
    self.isDevelopment = function() {
        try {
            const manifest = chrome.runtime.getManifest();
            return manifest.name.includes('dev') || manifest.version.includes('dev');
        } catch {
            return false;
        }
    };
    
    // 安全执行函数
    self.safeExecute = function(fn, context = {}) {
        try {
            return fn();
        } catch (error) {
            self.handle(ErrorTypes.DOM_ERROR, error, context);
            return null;
        }
    };
    
    // 异步安全执行
    self.safeExecuteAsync = async function(fn, context = {}) {
        try {
            return await fn();
        } catch (error) {
            self.handle(ErrorTypes.API_ERROR, error, context);
            return null;
        }
    };
    
    // 导出错误类型
    self.ErrorTypes = ErrorTypes;
    
    return self;
})();
