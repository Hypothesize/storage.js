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
/**
 *
 * @param ioProviderClass
 * @param repos The individual repositories: tables, users...
 */
function generate(ioProviderClass, repos) {
    class test {
        constructor(config) {
            try {
                this.io = new ioProviderClass(config);
            }
            catch (err) {
                throw new Error(`Repository group constructor : ${err} `);
            }
            console.assert(this.io !== undefined, `Repository group this.io after construction is still undefined`);
            Object.keys(repos).forEach(prop => {
                this[prop] = this.createRepository(prop);
            });
        }
        createRepository(e, methods) {
            return {
                findAsync: (id) => __awaiter(this, void 0, void 0, function* () { return this.io.findAsync({ entity: e, id: id }); }),
                getAsync: (selector) => __awaiter(this, void 0, void 0, function* () {
                    return this.io.getAsync({ entity: e, parentId: selector === null || selector === void 0 ? void 0 : selector.parentId, filters: selector === null || selector === void 0 ? void 0 : selector.filters });
                }),
                saveAsync: (obj) => __awaiter(this, void 0, void 0, function* () {
                    return obj.id
                        ? this.io.saveAsync({ entity: e, obj, mode: "update" })
                        : this.io.saveAsync({ entity: e, obj, mode: "insert" });
                }),
                // updateAsync: async (obj: ToStore<E>) => this.io.saveAsync({ entity: e, obj, mode: "update" }),
                deleteAsync: (id) => __awaiter(this, void 0, void 0, function* () { return this.io.deleteAsync({ entity: e, id }); })
            };
        }
        get extensions() { return this.io.extensions; }
    }
    return test;
}
exports.generate = generate;
