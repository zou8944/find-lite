
# 定义PACKAGE_NAME变量
PACKAGE_NAME = $(shell basename `pwd`)

package:
	rm -f $(PACKAGE_NAME).zip
	# 将当前目录下 content、icons、app.js、manifest.json 打包成zip
	zip -r $(PACKAGE_NAME).zip content background popup icons app.js manifest.json