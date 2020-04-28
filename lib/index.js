"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./repository"));
var api_repository_1 = require("./api-repository");
exports.ApiRepository = api_repository_1.Repository;
if (typeof module !== 'undefined' && module.exports) {
    exports.PgRepository = require('./pg-repository');
}
else {
    exports.PgRepository = {};
}
