#版本檔案
LAST_APP_VERSION_FILE=APP_VERSION
BUILD_VERSION_FILE=BUILD

#版本變數
VERSION:=$(shell cat ../VERSION)
INIT_BUILD_VERSION=999
BUILD_VERSION=$(shell echo $(shell cat $(BUILD_VERSION_FILE))+1 | bc)
export APP_VERSION=$(shell cat $(LAST_APP_VERSION_FILE))
#Git
GIT_CMD=git
GIT_BRANCH=$(GIT_CMD) branch
GIT_ADD=$(GIT_CMD) add
GIT_COMMIT=$(GIT_CMD) commit
GIT_PUSH=$(GIT_CMD) push
GIT_CURRENT_BRANCH=$$branch
GIT_TAG=$(GIT_CMD) tag
# Pure targets.
#.PHONY: all
all: check_version_file_is_exist check_version add_version commit_record add_tag write_tag_to_file
#初始化 build version 檔案
init_build_version:
	touch $(BUILD_VERSION_FILE)
	echo $(INIT_BUILD_VERSION) > $(BUILD_VERSION_FILE)
#初始化 app version
init_app_version:
	touch $(LAST_APP_VERSION_FILE)
	echo $(VERSION) > $(LAST_APP_VERSION_FILE)

#檢查版本檔案是否存在
check_version_file_is_exist:
ifeq "$(wildcard $(BUILD_VERSION_FILE))" ""
	@make init_build_version
endif
ifeq "$(wildcard $(LAST_APP_VERSION_FILE))" ""
	@make init_app_version
endif

#檢查版本
check_version:
	@if [ $(shell cat $(LAST_APP_VERSION_FILE)) != $(VERSION) ]; then\
		make init_app_version;\
				make init_build_version;\
	fi
add_version:
	echo $(BUILD_VERSION) > $(BUILD_VERSION_FILE)
commit_record:
	$(GIT_ADD) $(LAST_APP_VERSION_FILE)
	$(GIT_ADD) $(BUILD_VERSION_FILE)
	$(GIT_COMMIT) --no-verify -m "auto increment build version $(shell cat BUILD) [CI SKIP]"
	$(GIT_PUSH) origin HEAD:"$(GIT_CURRENT_BRANCH)"
add_tag:
	$(GIT_TAG) -a v$(shell cat APP_VERSION).$(shell cat BUILD) -m "auto increment build version v$(shell cat APP_VERSION).$(shell cat BUILD)"
	$(GIT_PUSH) origin v$(shell cat APP_VERSION).$(shell cat BUILD)
# 这个是drone打包docker自定义tag版本号的来源
write_tag_to_file:
	echo "$(shell cat APP_VERSION).$(shell cat BUILD)" > ../.tags
