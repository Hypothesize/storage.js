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
const pgPromise = require("pg-promise");
const light_stdlib_1 = require("./light_stdlib");
const assert = require("assert");
const repository_1 = require("./repository");
exports.Repository = () => repository_1.generate(class {
    constructor(dbUrl) {
        this.extensions = {
        // unregisterAsync: async (id: string) => this.deleteAsync({ entity: "users", id }),
        // findUserAsync: async (userid: string) => this.findAsync({ entity: "users", id: userid }),
        // insertResultsAsync: async (results: DTOsMap["results"]["toStorage"][]) => { throw new Error(`insertResultsAsync not implemented`) },
        // deleteResultsAsync: async (analysisId: string) => {}
        };
        this.db = pgPromise({ /* Initialization options from config */})(dbUrl);
        //this.db.connect().then(x => x.client.addListener("", (x) => { }))
    }
    findAsync(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const obj = yield this.db.oneOrNone(`SELECT * FROM ${getTableName(args.entity)} WHERE id = '${args.id}'`);
            return dbToApp(args.entity, obj);
        });
    }
    /**
     * Retrieve an array of DTOs (from the db) of a specified entity
     * @param entity Entity whose objects to get
     * @param parentId Basic parent id filter
     * @param filter Additional custom filter(s)
     */
    getAsync(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const pgFnName = `get_${getTableName(args.entity)}`;
            const whereClause = args.filters ? getWhereClause(args.filters) : `1=1`;
            console.log(`where clause for ${JSON.stringify(args.filters)} = ${whereClause}`);
            const dbObjects = yield this.db.any(`SELECT * FROM ${pgFnName}('${args.parentId}') WHERE ${whereClause}`);
            return dbObjects.map(obj => (Object.assign({}, dbToApp(args.entity, obj))));
        });
    }
    saveAsync(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.obj)
                throw new Error(`PGRepository updateAsync(): Object to update is missing`);
            if (args.mode === "insert") {
                const keys = Object.keys(args.obj);
                const values = keys.map(key => args.obj[key]).join(",");
                const columns = keys.map(k => new light_stdlib_1.String__(k.toString()).toSnakeCase()).join(",");
                const query = `insert into ${args.entity} (${columns}) values (${values}) returning *`;
                const insertedObj = yield this.db.one(query);
                return insertedObj;
            }
            else {
                if (!args.obj.id)
                    throw new Error(`PGRepository updateAsync(): Object Id property missing`);
                let keys = Object.keys(args.obj);
                let assignmentsClause = keys
                    .filter(key => key.toString() !== "id")
                    .map((key, index) => `${new light_stdlib_1.String__(key.toString()).toSnakeCase()} = $${index + 1}`).join(', ');
                let stmt = `update ${args.entity} set ${assignmentsClause} where id=$${keys.length} returning id`;
                console.log(`PgDbContext: update sql to be executed: "${stmt}", with params ${keys.map(k => args.obj[k])}`);
                let datum = yield this.db.one({ text: stmt, values: keys.map(key => args.obj[key]) });
                return datum;
            }
        });
    }
    deleteAsync(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const stmt = `delete from ${getTableName(args.entity)} where id=$1`;
            console.log(`pg repository: delete sql to be executed: "${stmt}"`);
            yield this.db.any(stmt, [args.id]);
        });
    }
});
function getTableName(entityName) {
    const plural = new light_stdlib_1.String__(entityName).plural();
    return plural.toLocaleLowerCase();
}
function getColumnName(propertyName) {
    return new light_stdlib_1.String__(propertyName).toSnakeCase().toLocaleLowerCase();
}
function getWhereClause(filter) {
    const quoteValue = (x) => typeof x === "number" ? `${x}` : `'${x}'`;
    //console.log(`quoteValue: ${quoteValue}`)
    const expressionTemplates = {
        equal: x => `= ${quoteValue(x)}`,
        not_equal: x => `<> ${quoteValue(x)}`,
        greater: x => `> ${quoteValue(x)}`,
        less: x => `< ${quoteValue(x)}`,
        greater_or_equal: x => `>= ${quoteValue(x)}`,
        less_or_equal: x => `<= ${quoteValue(x)}`,
        contains: x => `like '%${x}%'`,
        ends_with: x => `like '%${x}'`,
        starts_with: x => `like '${x}%'`,
        is_outlier_by: undefined,
    };
    return filter.filters
        .map(f => {
        if ('fieldName' in f) { // this is a Filter object, not a FilterGroup
            let exprTemplate = expressionTemplates[f.operator];
            if (exprTemplate === undefined)
                throw new Error(`SQL Filtering operator "${f.operator}"`);
            return `${f.negated ? "NOT " : ""}${getColumnName(f.fieldName)} ${exprTemplate(f.value)}`;
        }
        else {
            return `(${getWhereClause(f)})`;
        }
    })
        .join(` ${(filter.combinator || "and")} `);
}
function dbToApp(entity, serverObj) {
    let appObject = { objectType: entity };
    Object.keys(serverObj).forEach(key => {
        const typedKey = new light_stdlib_1.String__(key).toCamelCase().toString();
        appObject[typedKey] = serverObj[key];
        if (typedKey === 'measureLevels' && !Array.isArray(serverObj[key])) {
            appObject[typedKey] = serverObj[key].replace(/[\$\{}]/g, '').split(',');
        }
        // We never use null, but postgres always stores undefined values as 'null'
        if (appObject[typedKey] === null) {
            appObject[typedKey] = undefined;
        }
        // Values NULL in postgres arrays (i.e. when converting optional 'measure_level' into an array 'measure_levels') should not appear in our app's array
        if (Array.isArray(appObject[typedKey])) {
            appObject[typedKey] = appObject[typedKey].filter((el) => el !== "NULL");
        }
    });
    return appObject;
}
exports.testSuite = () => {
    describe("getWhereClause", () => {
        it("should return a two single conditions when passing an array of two filters", () => {
            const filter = {
                combinator: "and",
                filters: [
                    {
                        fieldName: "user_id",
                        operator: "equal",
                        negated: false,
                        value: 55
                    },
                    {
                        fieldName: "project_id",
                        operator: "equal",
                        negated: false,
                        value: 66
                    },
                ]
            };
            const actualWhereClause = getWhereClause(filter);
            const expectedWhereClause = "user_id = 55 and project_id = 66";
            assert.equal(actualWhereClause, expectedWhereClause);
        });
        it("should return a single condition and another with two conditions nested when passing an array of a filter and a filterGroup", () => {
            const filter = {
                combinator: "and",
                filters: [
                    {
                        fieldName: "user_id",
                        operator: "equal",
                        negated: false,
                        value: 55
                    },
                    {
                        combinator: "or",
                        filters: [
                            {
                                fieldName: "first_name",
                                operator: "equal",
                                negated: true,
                                value: "Diego"
                            },
                            {
                                fieldName: "first_name",
                                operator: "equal",
                                negated: false,
                                value: "John"
                            }
                        ]
                    },
                ]
            };
            const actualWhereClause = getWhereClause(filter);
            const expectedWhereClause = "user_id = 55 and (NOT first_name = 'Diego' or first_name = 'John')";
            assert.equal(actualWhereClause, expectedWhereClause);
        });
        it("should return a condition with a sql string matching when passing a filter with 'contains' or related operators", () => {
            const filter = {
                combinator: "and",
                filters: [
                    {
                        fieldName: "user_id",
                        operator: "contains",
                        negated: false,
                        value: "14423"
                    },
                    {
                        fieldName: "project_id",
                        operator: "starts_with",
                        negated: false,
                        value: "55"
                    }
                ]
            };
            const actualWhereClause = getWhereClause(filter);
            const expectedWhereClause = "user_id like '%14423%' and project_id like '55%'";
            assert.equal(actualWhereClause, expectedWhereClause);
        });
        it("should return a sql condition that checks if is NULL when passing a filter with 'blank' operator", () => {
            const filter = {
                combinator: "and",
                filters: [
                    {
                        fieldName: "description",
                        operator: "equals",
                        negated: false
                    }
                ]
            };
            const actualWhereClause = getWhereClause(filter);
            const expectedWhereClause = "description is NULL";
            assert.equal(actualWhereClause, expectedWhereClause);
        });
    });
};
