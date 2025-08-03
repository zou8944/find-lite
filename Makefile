
# 定义PACKAGE_NAME变量
PACKAGE_NAME = $(shell basename `pwd`)

# 默认构建生产版本
all: package

# 生产版本打包
package:
	rm -f $(PACKAGE_NAME).zip
	# 将当前目录下 content、icons、app.js、manifest.json 打包成zip
	zip -r $(PACKAGE_NAME).zip content background popup icons app.js manifest.json

# 开发版本打包（保留调试信息）
package-dev:
	rm -f $(PACKAGE_NAME)-dev.zip
	zip -r $(PACKAGE_NAME)-dev.zip content background popup icons app.js manifest.json

# 清理构建文件
clean:
	rm -f *.zip

# 验证扩展文件
validate:
	@echo "Validating extension files..."
	@test -f manifest.json || (echo "Error: manifest.json not found" && exit 1)
	@test -f app.js || (echo "Error: app.js not found" && exit 1)
	@test -d content || (echo "Error: content directory not found" && exit 1)
	@test -d icons || (echo "Error: icons directory not found" && exit 1)
	@test -f content/searchOptimizer.js || (echo "Error: searchOptimizer.js not found" && exit 1)
	@test -f content/errorHandler.js || (echo "Error: errorHandler.js not found" && exit 1)
	@test -f content/compatibility.js || (echo "Error: compatibility.js not found" && exit 1)
	@echo "Validation passed!"

.PHONY: all package package-dev clean validate