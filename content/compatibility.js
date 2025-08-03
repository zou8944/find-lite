FindLite.compatibility = (function() {
    const self = {};
    
    // 检查 CSS Highlight API 支持
    self.checkHighlightAPISupport = function() {
        return typeof CSS !== 'undefined' && 
               typeof CSS.highlights !== 'undefined' && 
               typeof Highlight !== 'undefined';
    };
    
    // 检查必要的浏览器 API
    self.checkBrowserSupport = function() {
        const required = {
            range: typeof Range !== 'undefined',
            selection: typeof Selection !== 'undefined',
            storage: typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined',
            runtime: typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined'
        };
        
        return {
            isSupported: Object.values(required).every(Boolean),
            details: required
        };
    };
    
    // 初始化兼容性检查
    self.init = function() {
        const browserSupport = self.checkBrowserSupport();
        const highlightSupport = self.checkHighlightAPISupport();
        
        if (!browserSupport.isSupported) {
            console.error('Find Lite: Browser not supported', browserSupport.details);
            return false;
        }
        
        if (!highlightSupport) {
            console.warn('Find Lite: CSS Highlight API not supported, falling back to legacy method');
            FindLite.useLegacyHighlight = true;
        }
        
        return true;
    };
    
    return self;
})();
