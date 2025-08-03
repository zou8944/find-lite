FindLite.searchOptimizer = (function() {
    const self = {};
    
    // 防抖配置
    const DEBOUNCE_DELAY = 300; // 毫秒
    const REGEX_DEBOUNCE_DELAY = 500; // 正则表达式防抖延迟更长
    
    // 搜索限制配置
    const MAX_SEARCH_TIME = 2000; // 最大搜索时间 2秒
    const MAX_MATCHES_PER_NODE = 1000; // 每个文本节点最大匹配数
    const MAX_TOTAL_MATCHES = 5000; // 总最大匹配数
    const MAX_REGEX_LENGTH = 200; // 正则表达式最大长度
    
    let searchTimeoutId = null;
    let searchStartTime = 0;
    let isSearching = false;
    
    // 防抖函数
    self.debounce = function(func, delay) {
        return function(...args) {
            clearTimeout(searchTimeoutId);
            searchTimeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };
    
    // 验证正则表达式安全性
    self.validateRegex = function(pattern) {
        const validation = {
            isValid: true,
            isSafe: true,
            error: null,
            warnings: []
        };
        
        // 长度检查
        if (pattern.length > MAX_REGEX_LENGTH) {
            validation.isValid = false;
            validation.error = `正则表达式过长，最大允许${MAX_REGEX_LENGTH}个字符`;
            return validation;
        }
        
        // 基本语法检查
        try {
            new RegExp(pattern);
        } catch (e) {
            validation.isValid = false;
            validation.error = `正则表达式语法错误: ${e.message}`;
            return validation;
        }
        
        // 危险模式检查
        const dangerousPatterns = [
            /\(\?\!/,  // 负向前瞻
            /\(\?\</,  // 负向后瞻
            /\(\?\=/,  // 正向前瞻
            /\(\?\<\=/,  // 正向后瞻
            /\(\?\:/,  // 非捕获组嵌套过深
            /\.\*\.\*/,  // 连续的贪婪匹配
            /\.\+\.\+/,  // 连续的贪婪匹配
            /\(\.\*\)\+/,  // 嵌套量词
            /\(\.\+\)\+/,  // 嵌套量词
            /\(\.\*\)\*/,  // 嵌套量词
            /\(\.\+\)\*/   // 嵌套量词
        ];
        
        for (const dangerous of dangerousPatterns) {
            if (dangerous.test(pattern)) {
                validation.isSafe = false;
                validation.warnings.push('检测到可能导致性能问题的正则表达式模式');
                break;
            }
        }
        
        // 检查嵌套深度
        const openParens = (pattern.match(/\(/g) || []).length;
        const closeParens = (pattern.match(/\)/g) || []).length;
        
        if (openParens !== closeParens) {
            validation.isValid = false;
            validation.error = '括号不匹配';
            return validation;
        }
        
        if (openParens > 10) {
            validation.isSafe = false;
            validation.warnings.push('嵌套层级过深，可能影响性能');
        }
        
        return validation;
    };
    
    // 限时搜索执行器
    self.executeTimeLimitedSearch = function(searchFunction, maxTime = MAX_SEARCH_TIME) {
        return new Promise((resolve, reject) => {
            isSearching = true;
            searchStartTime = Date.now();
            
            const timeoutId = setTimeout(() => {
                isSearching = false;
                reject(new Error(`搜索超时 (${maxTime}ms)`));
            }, maxTime);
            
            try {
                const result = searchFunction();
                clearTimeout(timeoutId);
                isSearching = false;
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                isSearching = false;
                reject(error);
            }
        });
    };
    
    // 检查是否应该停止搜索
    self.shouldStopSearch = function(currentMatches = 0) {
        if (!isSearching) return true;
        
        const elapsed = Date.now() - searchStartTime;
        if (elapsed > MAX_SEARCH_TIME) {
            console.warn('Find Lite: Search timeout reached');
            return true;
        }
        
        if (currentMatches > MAX_TOTAL_MATCHES) {
            console.warn('Find Lite: Too many matches found, stopping search');
            return true;
        }
        
        return false;
    };
    
    // 安全的正则表达式搜索
    self.safeRegexSearch = function(text, pattern, flags) {
        const matches = [];
        let match;
        let matchCount = 0;
        
        try {
            const regex = new RegExp(pattern, flags);
            const startTime = Date.now();
            
            while ((match = regex.exec(text)) !== null) {
                // 防止无限循环
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                
                matches.push(match);
                matchCount++;
                
                // 检查是否应该停止
                if (matchCount > MAX_MATCHES_PER_NODE) {
                    console.warn('Find Lite: Too many matches in single node');
                    break;
                }
                
                if (Date.now() - startTime > 100) { // 单个节点搜索超过100ms
                    console.warn('Find Lite: Single node search timeout');
                    break;
                }
                
                if (self.shouldStopSearch(matchCount)) {
                    break;
                }
            }
        } catch (error) {
            console.error('Find Lite: Regex search error:', error);
            throw error;
        }
        
        return matches;
    };
    
    // 获取适当的防抖延迟
    self.getDebounceDelay = function(isRegex) {
        return isRegex ? REGEX_DEBOUNCE_DELAY : DEBOUNCE_DELAY;
    };
    
    // 取消当前搜索
    self.cancelSearch = function() {
        if (searchTimeoutId) {
            clearTimeout(searchTimeoutId);
            searchTimeoutId = null;
        }
        isSearching = false;
    };
    
    // 导出常量
    self.constants = {
        DEBOUNCE_DELAY,
        REGEX_DEBOUNCE_DELAY,
        MAX_SEARCH_TIME,
        MAX_MATCHES_PER_NODE,
        MAX_TOTAL_MATCHES,
        MAX_REGEX_LENGTH
    };
    
    return self;
})();
