import * as pgPromise from "pg-promise"
import { String__ } from "./light_stdlib"
import * as assert from 'assert'

import { generate as generateRepository, FilterGroup, Filter, Filters, DTOsMap, Primitive, Obj } from "./repository"

export const Repository = generateRepository(class {
	readonly db: pgPromise.IDatabase<any>

	constructor(dbUrl: string) {
		this.db = pgPromise({/* Initialization options from config */ })(dbUrl)
		//this.db.connect().then(x => x.client.addListener("", (x) => { }))
	}

	async findAsync<E extends Extract<keyof DTOsMap, string>>(args: { entity: E, id: string }): Promise<DTOsMap[E]["fromStorage"]> {
		const obj = await this.db.oneOrNone(`SELECT * FROM ${getTableName(args.entity)} WHERE id = '${args.id}'`)
		return dbToApp<E>(args.entity, obj)
	}

	/**
	 * Retrieve an array of DTOs (from the db) of a specified entity
	 * @param entity Entity whose objects to get
	 * @param parentId Basic parent id filter
	 * @param filter Additional custom filter(s)
	 */
	async getAsync<E extends Extract<keyof DTOsMap, string>>(args: { entity: E, parentId?: string, filters?: FilterGroup<DTOsMap[E]["fromStorage"]> }): Promise<DTOsMap[E]["fromStorage"][]> {
		const pgFnName = `get_${getTableName(args.entity)}`
		const whereClause = args.filters ? getWhereClause(args.filters) : `1=1`
		console.log(`where clause for ${JSON.stringify(args.filters)} = ${whereClause}`)

		const dbObjects = await this.db.any(`SELECT * FROM ${pgFnName}('${args.parentId}') WHERE ${whereClause}`)
		return dbObjects.map(obj => ({ ...dbToApp<E>(args.entity, obj) }))
	}

	async saveAsync<E extends Extract<keyof DTOsMap, string>>(args: { entity: E, obj: DTOsMap[E]["toStorage"], mode: "insert" | "update" }): Promise<DTOsMap[E]["fromStorage"]> {
		if (!args.obj)
			throw new Error(`PGRepository updateAsync(): Object to update is missing`)

		if (args.mode === "insert") {
			const keys = Object.keys(args.obj)
			const values = keys.map(key => args.obj[key]).join(",")
			const columns = keys.map(k => new String__(k.toString()).toSnakeCase()).join(",")
			const query = `insert into ${args.entity} (${columns}) values (${values}) returning *`
			const insertedObj = await this.db.one<DTOsMap[E]["fromStorage"]>(query)
			return insertedObj
		}
		else {
			if (!args.obj.id)
				throw new Error(`PGRepository updateAsync(): Object Id property missing`)

			let keys = Object.keys(args.obj)
			let assignmentsClause = keys
				.filter(key => key.toString() !== "id")
				.map((key, index) => `${new String__(key.toString()).toSnakeCase()} = $${index + 1}`).join(', ')

			let stmt = `update ${args.entity} set ${assignmentsClause} where id=$${keys.length} returning id`
			console.log(`PgDbContext: update sql to be executed: "${stmt}", with params ${keys.map(k => args.obj[k])}`)

			let datum = await this.db.one<DTOsMap[E]["fromStorage"]>({ text: stmt, values: keys.map(key => args.obj[key]) })

			return datum
		}
	}

	async deleteAsync<E extends Extract<keyof DTOsMap, string>>(args: { entity: E, id: string }): Promise<void> {
		const stmt = `delete from ${getTableName(args.entity)} where id=$1`
		console.log(`pg repository: delete sql to be executed: "${stmt}"`)
		await this.db.any(stmt, [args.id])
	}

	extensions = {

		// unregisterAsync: async (id: string) => this.deleteAsync({ entity: "users", id }),

		// findUserAsync: async (userid: string) => this.findAsync({ entity: "users", id: userid }),

		// insertResultsAsync: async (results: DTOsMap["results"]["toStorage"][]) => { throw new Error(`insertResultsAsync not implemented`) },
		// deleteResultsAsync: async (analysisId: string) => {}
	}

    /* protected async queryAsync<E extends ExEntity, K extends keyof E>(args: {
        entity: E["objectType"],
        filters?: FilterGoup,
        columns?: K[],
        sorting?: (keyof E)[]}): Promise<E[]> {
        const getPgOp = (filterOp: any) => {
            switch (filterOp) {
                case "equal": return "="
                default: return
            }
        }

        const filter = args.filter
        const query = [
            `SELECT ${args.columns === undefined ? "*" : args.columns.join(",")}`,
            `FROM ${getPlural(args.entity)}`,
            filter ? `WHERE ${filter.negated ? "NOT" : ""} ${filter.fieldName} ${getPgOp(filter.operator)} ${JSON.stringify(filter.value)}` : '',
            args.sortBy ? `ORDER BY ${args.sortBy}` : ``
        ].join(" ")
        return await this.db.any(query) as E[]
    }
    */

})


function getTableName(entityName: Extract<keyof DTOsMap, string>): string {
	const plural = new String__(entityName).plural() as String
	return plural.toLocaleLowerCase()
}
function getColumnName(propertyName: string): string {
	return new String__(propertyName).toSnakeCase().toLocaleLowerCase()
}

function getWhereClause(filter: FilterGroup<any>): string {
	const quoteValue = (x: Primitive | null) => typeof x === "number" ? `${x}` : `'${x}'`
	//console.log(`quoteValue: ${quoteValue}`)


	const expressionTemplates: Obj<undefined | ((x: Primitive | null) => string), Required<Filter>["operator"]> = {
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
		//blank: x => `is NULL`
	}

	return filter.filters
		.map(f => {
			if ('fieldName' in f) { // this is a Filter object, not a FilterGroup
				let exprTemplate = expressionTemplates[f.operator]
				if (exprTemplate === undefined)
					throw new Error(`SQL Filtering operator "${f.operator}"`)
				return `${f.negated ? "NOT " : ""}${getColumnName(f.fieldName)} ${exprTemplate(f.value)}`
			}
			else {
				return `(${getWhereClause(f)})`
			}
		})
		.join(` ${(filter.combinator as string || "and")} `)
}
function dbToApp<T extends keyof DTOsMap>(entity: T, serverObj: any) {
	let appObject: any = { objectType: entity }

	Object.keys(serverObj).forEach(key => {
		const typedKey = new String__(key).toCamelCase().toString()
		appObject[typedKey] = serverObj[key]

		if (typedKey === 'measureLevels' && !Array.isArray(serverObj[key])) {
			appObject[typedKey] = serverObj[key].replace(/[\$\{}]/g, '').split(',')
		}
		// We never use null, but postgres always stores undefined values as 'null'
		if (appObject[typedKey] === null) {
			appObject[typedKey] = undefined
		}

		// Values NULL in postgres arrays (i.e. when converting optional 'measure_level' into an array 'measure_levels') should not appear in our app's array
		if (Array.isArray(appObject[typedKey])) {
			appObject[typedKey] = appObject[typedKey].filter((el: any) => el !== "NULL")
		}
	})
	return appObject as DTOsMap[T]["fromStorage"]
}

export const testSuite = () => {
	describe("getWhereClause", () => {
		it("should return a two single conditions when passing an array of two filters", () => {
			const filter: FilterGroup = {
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
			}
			const actualWhereClause = getWhereClause(filter)
			const expectedWhereClause = "user_id = 55 and project_id = 66"
			assert.equal(actualWhereClause, expectedWhereClause)
		})
		it("should return a single condition and another with two conditions nested when passing an array of a filter and a filterGroup", () => {
			const filter: FilterGroup = {
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
			}
			const actualWhereClause = getWhereClause(filter)
			const expectedWhereClause = "user_id = 55 and (NOT first_name = 'Diego' or first_name = 'John')"
			assert.equal(actualWhereClause, expectedWhereClause)
		})
		it("should return a condition with a sql string matching when passing a filter with 'contains' or related operators", () => {
			const filter: FilterGroup = {
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
			}
			const actualWhereClause = getWhereClause(filter)
			const expectedWhereClause = "user_id like '%14423%' and project_id like '55%'"
			assert.equal(actualWhereClause, expectedWhereClause)
		})
		it("should return a sql condition that checks if is NULL when passing a filter with 'blank' operator", () => {
			const filter: FilterGroup = {
				combinator: "and",
				filters: [
					{
						fieldName: "description",
						operator: "equals" as any,
						negated: false
					} as Filters.Categorical<any>
				]
			}
			const actualWhereClause = getWhereClause(filter)
			const expectedWhereClause = "description is NULL"
			assert.equal(actualWhereClause, expectedWhereClause)
		})
	})
}