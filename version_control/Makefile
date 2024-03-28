#版本檔案
LAST_APP_VERSION_FILE=APP_VERSION
BUILD_VERSION_FILE=BUILD

#版本變數
VERSION:=$(shell cat ../VERSION)
BUILD_VERSION=$(shell echo $(shell cat $(BUILD_VERSION_FILE))+1 | bc)
export APP_VERSION=$(shell cat $(LAST_APP_VERSION_FILE))
#Git
GIT_CMD=git
GIT_ADD=$(GIT_CMD) add
GIT_COMMIT=$(GIT_CMD) commit
GIT_PUSH=$(GIT_CMD) push
GIT_CURRENT_BRANCH=$$branch
GIT_TAG=$(GIT_CMD) tag

all: add_version write_tag_to_file
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
write_tag_to_file:
	echo "$(shell cat APP_VERSION).$(shell cat BUILD)" > ../.tags
