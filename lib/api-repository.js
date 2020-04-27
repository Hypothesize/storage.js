"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const web_1 = require("./web");
const light_stdlib_1 = require("./light_stdlib");
const shortid = require("shortid");
const repository_1 = require("./repository");
const constants_1 = require("./constants");
class Repository extends repository_1.generate(class {
    constructor(args) {
        this.extensions = {
            /** Store raw data in S3 and returns a promise of the URL of the stored object
            * @param data Data to be stored
            * @param key Key used to identify the stored data
            * @param string The URL where the data will be available, for instance the CloudFront base URL
            */
            storeRawAsync: (data, key, prefix) => __awaiter(this, void 0, void 0, function* () {
                const _key = key !== null && key !== void 0 ? key : shortid.generate();
                try {
                    yield web_1.putAsync({
                        uri: yield this.getPresignedS3UrlAsync(_key),
                        data: {
                            type: "text",
                            body: data instanceof ArrayBuffer
                                ? arrayBufferToBase64(data)
                                : JSON.stringify(data)
                        }
                    });
                }
                catch (err) {
                    throw new Error(`Error uploading data: ${err}`);
                }
                return `${prefix}/${_key}`;
            }),
            /** Retrieve raw data from S3 (via cloudfront)
             * @param url S3 (Cloudfront) URL of the data to retreive
             */
            getRawAsync: (url) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const resultMsg = yield web_1.getAsync({ uri: url });
                    return JSON.parse(resultMsg.body);
                }
                catch (err) {
                    throw new Error(`Error getting or parsing raw data at URL "${url}`);
                }
            })
        };
        this._baseUrl = args.baseUrl;
        console.log(`API repository base url: ${this._baseUrl}`);
    }
    findAsync(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const entityPluralName = new light_stdlib_1.String__(args.entity).plural();
            return web_1.getAsync({ uri: `${this._baseUrl}/${entityPluralName}/${args.id}/` })
                .then(res => {
                web_1.checkStatusCode(res, `Error finding ${args.entity} with id ${args.id} data`);
                return JSON.parse(res.body);
            });
        });
    }
    getAsync(args) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`API repository getAsync(entity=${args.entity}, parent id=${JSON.stringify(args.parentId)}, filters=${JSON.stringify(args.filters)})`);
            const parentEntity = constants_1.EntityParents["user"];
            const pluralParent = parentEntity !== "" ? new light_stdlib_1.String__(parentEntity).plural() : "";
            const effectiveParentId = parentEntity !== "" ? args.parentId : "";
            const pluralEntity = new light_stdlib_1.String__(args.entity).plural();
            const request = {
                uri: [this._baseUrl, pluralParent, effectiveParentId, pluralEntity].filter(x => x !== "").join("/"),
                query: args.filters ? { filter: JSON.stringify(args.filters) } : undefined
            };
            console.log(`API repository getAsync(); request: ${JSON.stringify(request)}`);
            return web_1.getAsync(request).then((res) => {
                web_1.checkStatusCode(res, `Error retrieving data`);
                return JSON.parse(res.body);
            });
        });
    }
    saveAsync(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const entityPluralName = new light_stdlib_1.String__(args.entity).plural();
            if (args.mode === "insert") {
                return web_1.postAsync({
                    uri: `${this._baseUrl}/api/${entityPluralName}/`,
                    data: { type: "json", body: args.obj }
                }).then(res => {
                    web_1.checkStatusCode(res, `Error inserting ${entityPluralName} data`);
                    return JSON.parse(res.body);
                });
            }
            else {
                return web_1.putAsync({
                    uri: `${this._baseUrl}/api/${entityPluralName}/`,
                    data: { type: "json", body: args.obj }
                }).then(res => {
                    web_1.checkStatusCode(res, `Error updating ${entityPluralName} data`);
                    return JSON.parse(res.body);
                });
            }
        });
    }
    deleteAsync(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const entityPluralName = new light_stdlib_1.String__(args.entity).plural();
            const res = yield web_1.deleteAsync({ uri: `${this._baseUrl}/${entityPluralName}/${args.id}` });
            web_1.checkStatusCode(res, `Error deleting ${entityPluralName} data`);
        });
    }
    getPresignedS3UrlAsync(key) {
        return web_1.getAsync({
            uri: `${this._baseUrl}/presigned_s3_url`,
            query: key ? { key } : undefined
        }).then(res => res.body);
    }
}, {}) {
}
exports.Repository = Repository;
function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
