# 需修改的參數
## app id
APP_ID=<app_id>
## app 名稱
APP_NAME=<app_name>
## 平台版本
PLATFORM_VERSION=5.2.11
## dap 平台類別，前端就是 frontend, 後端就是 backend
DAP_TYPE=frontend
## registry 位置
DOCKER_REGISTRY_URL=registry.digiwincloud.com.cn


SHELL=/bin/bash

# npm 相關指令
NPM=npm
NPM_INSTALL=$(NPM) install
NPM_RUN=$(NPM) run
NPM_TEST=$(NPM) test
NPM_BUILD=$(NPM_RUN) build
NPM_BUILD_PROD=$(NPM_BUILD)-prod

# angular 相關指令
NG=ng
NG_SERVE=$(NG) serve
NG_SERVE_PROD=$(NG_SERVE) prod


#版本控制
VERSION:=$(shell cat VERSION)
SUB_VERSION_FILE=./version_control/BUILD

#docker
DOCKER_CMD=docker
DOCKER_BUILD=$(DOCKER_CMD) build
DOCKER_RM_IMAGE=$(DOCKER_CMD) rmi
DOCKER_PUSH=$(DOCKER_CMD) push
DOCKER_IMAGE_REGISTRY=$(DOCKER_REGISTRY_URL)/$(APP_ID)/
DOCKER_IMAGE_NAME=$(APP_NAME)$(DAP_TYPE)-$(PLATFORM_VERSION)
DOCKER_FULL_IMAGE=$(DOCKER_IMAGE_REGISTRY)$(DOCKER_IMAGE_NAME):$(VERSION).$(shell cat $(SUB_VERSION_FILE))


init:
	$(GIT_ADD_REMOTE) $(GIT_REPOSITORY)
install:
	$(NPM_INSTALL)
test:
	$(NPM_TEST)
unit-test: install test
build:
	$(NPM_INSTALL)
	$(NPM_BUILD_PROD)
build_prod:
	$(NPM_INSTALL)
	$(NPM_BUILD_PROD)
move_dist:
	tar cvf dist.tar dist
	mv dist.tar buildfile
clean:
	rm -rf buildfile/dist.tar
	rm -rf dist

docker_build:
	@echo "開始打包 Docker Image - $(DOCKER_FULL_IMAGE)"
	$(DOCKER_BUILD) -t $(DOCKER_FULL_IMAGE) .
docker_push:
	@echo "開始 push docker image - $(DOCKER_FULL_IMAGE)"
	$(DOCKER_PUSH) $(DOCKER_FULL_IMAGE)
docker_clean:
	$(DOCKER_RM_IMAGE) $(DOCKER_FULL_IMAGE)
docker_ci: vc docker_build docker_push docker_clean
vc:
	@make -C version_control branch=$$branch
