"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** The parent object (in a relational-database sense) of our entities */
var EntityParents;
(function (EntityParents) {
    EntityParents["user"] = "";
    EntityParents["project"] = "user";
    EntityParents["column"] = "table";
    EntityParents["analysis"] = "project";
    EntityParents["table"] = "project";
    EntityParents["result"] = "analysis";
})(EntityParents = exports.EntityParents || (exports.EntityParents = {}));
