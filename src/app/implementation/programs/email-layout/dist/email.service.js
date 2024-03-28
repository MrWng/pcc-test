"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
exports.__esModule = true;
exports.EmailService = void 0;
var core_1 = require("@angular/core");
var framework_1 = require("@webdpt/framework");
var EmailService = /** @class */ (function () {
    function EmailService(config, http, datePipe, authToken) {
        var _this = this;
        this.config = config;
        this.http = http;
        this.datePipe = datePipe;
        this.authToken = authToken;
        this.config.get('uibotUrl').subscribe(function (url) {
            _this.uibotUrl = url + '/api/ai/v1/bot/';
        });
        this.config.get('atmcUrl').subscribe(function (url) {
            _this.atmcUrl = url;
        });
        this.config.get('bpmUrl').subscribe(function (url) {
            _this.bpmUrl = url;
        });
    }
    /**
     * 通过密钥获取data
     * @param secretKey
     */
    EmailService.prototype.getDataBySecretKey = function (secretKey) {
        // 1 - 模拟数据(必须注释提交)
        var url = '/assets/api/components/13/wbs.json';
        // 2 - 真实数据(提交必须解除注释)
        // const url = this.uibotUrl + `shorter/address/show/${secretKey}`;
        return this.http.get(url);
    };
    /**
     * 执行操作
     * @param params 提交参数
     */
    EmailService.prototype.executeAction = function (params) {
        var url = this.atmcUrl + '/api/atmc/v1/action/submit';
        return this.http.post(url, params);
    };
    /**
     * 格式化更新的参数
     * @param formData
     * @param oldData
     */
    EmailService.prototype.formateUpdateParams = function (formData, oldData) {
        var _this = this;
        if (oldData === void 0) { oldData = []; }
        var formArrayData = [];
        var newArrayData = [];
        Object.keys(formData).forEach(function (key) {
            if (Array.isArray(formData[key])) {
                formData[key].forEach(function (item) {
                    formArrayData.push(_this.translateNestedToTiled(item));
                });
            }
        });
        oldData.forEach(function (item, index) {
            var newObj = Object.assign({}, item, formArrayData[index]);
            newArrayData.push(newObj);
        });
        return newArrayData;
    };
    /**
     * 将源嵌套对象转换成平铺结构
     * @param source
     * @param obj
     */
    EmailService.prototype.translateNestedToTiled = function (source, obj) {
        var _this = this;
        if (source === void 0) { source = {}; }
        if (obj === void 0) { obj = {}; }
        Object.keys(source).forEach(function (key) {
            if (typeof source[key] === 'object') {
                var fieldType = Object.prototype.toString.call(source[key]);
                switch (fieldType) {
                    case '[object Date]':
                        obj[key] = _this.datePipe.transform(source[key], 'yyyy/MM/dd');
                        break;
                    case '[object Array]':
                        var newArr_1 = [];
                        source[key].forEach(function (item) {
                            var newItem;
                            if (typeof item === 'object') {
                                newItem = _this.translateNestedToTiled(item, newItem);
                            }
                            else {
                                newItem = item;
                            }
                            newArr_1.push(newItem);
                        });
                        obj[key] = newArr_1;
                        break;
                    case '[object Object]':
                        obj = _this.translateNestedToTiled(source[key], obj);
                        break;
                    default:
                        break;
                }
            }
            else {
                obj[key] = source[key];
            }
        });
        return obj;
    };
    EmailService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __param(3, core_1.Inject(framework_1.DW_AUTH_TOKEN))
    ], EmailService);
    return EmailService;
}());
exports.EmailService = EmailService;
