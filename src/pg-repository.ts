import * as pgPromise from "pg-promise"
import * as bcrypt from "bcryptjs"
import * as assert from 'assert'
import * as shortid from 'shortid'
import { DTOsMap, FilterGroup, Filter, Filters, Primitive, Obj } from "./types"
import { generate } from "./repository"
import { String as String__ } from "@sparkwave/standard"

import { camelCase } from 'lodash'

const pgErrorsCode = {
	UNIQUE_VIOLATION: "23505",
	NOT_NULL_VIOLATION: "23502"
}

export const PgRepository = <Map extends DTOsMap>(extensions: { [key: string]: Promise<any> }) => {
	return generate<{}, Map>(class {
		readonly db: pgPromise.IDatabase<any>

		constructor(args: { dbUrl: string }) {
			this.db = pgPromise({})({ ssl: { rejectUnauthorized: false }, query_timeout: 10000, connectionString: args.dbUrl, connectionTimeoutMillis: 10000 })

			this.db.$config.pgp.pg.types.setTypeParser(20, parseInt)

			//this.db.connect().then(x => x.client.addListener("", (x) => { }))
		}

		async findAsync<E extends keyof DTOsMap>(args: { entity: E, id: string }): Promise<DTOsMap[E]["fromStorage"]> {
			const pgFnName = `get_${getTableName(args.entity)}`

			return this.db.one({
				text: `SELECT * FROM ${pgFnName}($1, $2)`,
				values: [null, args.id]
			})
				.then(entity => {
					if (typeof entity !== "object") {
						throw new Error(`The ${args.entity} with id ${args.id} received from the server is '${typeof entity}', should have been an object`)
					}
					return dbToApp<E>(args.entity, entity)
				})
				.catch(err => {
					throw new Error(`Could not find ${args.entity}: ${err.message}`)
				})
		}

		/**
		 * Retrieve an array of DTOs (from the db) of a specified entity
		 * @param entity Entity whose objects to get
		 * @param parentId Basic parent id filter
		 * @param filter Additional custom filter(s)
		 */
		async getAsync<E extends keyof DTOsMap>(args: { entity: E, parentId?: string, filters?: FilterGroup<DTOsMap[E]["fromStorage"]> }): Promise<DTOsMap[E]["fromStorage"][]> {
			const pgFnName = `get_${getTableName(args.entity)}`
			const whereClause = args.filters
				? getWhereClause(args.filters)
				: `1=1`

			return this.db.any({
				text: `SELECT * FROM ${pgFnName}($1, $2) WHERE ${whereClause}`,
				values: [args.parentId, null]
			})
				.then(entities => {
					return entities.map(obj => ({ ...dbToApp<E>(args.entity, obj) }))
				})
				.catch(err => {
					throw new Error(`Could not get ${args.entity}: ${err.message}`)
				})
		}

		async saveAsync<E extends keyof DTOsMap>(args: {
			entity: E,
			obj: DTOsMap[E]["toStorage"][],
			mode: "insert" | "update",
		}): Promise<DTOsMap[E]["fromStorage"][]> {
			if (!args.obj) {
				throw new Error(`PGRepository updateAsync(): Object to update is missing`)
			}
			const jsonToSave = JSON.stringify(args.obj.map(entity => ({
				...entity,
				id: entity.id !== undefined ? entity.id : shortid.generate()
			})))
			return this.db.many({
				text: `SELECT * from ${args.mode}_${args.entity}($1) as result`,
				values: [jsonToSave]
			})
				.then(result => {
					return result.map((result: DTOsMap[E]["fromStorage"]) => dbToApp<E>(args.entity, result)) as any
				})
				.catch(err => {
					if (err.code == pgErrorsCode.UNIQUE_VIOLATION)
						throw new Error(`Duplicated values when trying to ${args.mode === "insert" ? "create" : "update"} ${args.entity}`)
					else
						throw new Error(`Could not insert ${args.entity}: ${err.message}`)
				})

		}

		async deleteAsync<E extends keyof DTOsMap>(args: { entity: E, id: string }): Promise<void> {
			const stmt = `delete from ${getTableName(args.entity)} where id=$1`
			console.log(`pg repository: delete sql to be executed: "${stmt}"`)
			await this.db.any(stmt, [args.id])
		}

		async deleteManyAsync<E extends keyof DTOsMap>(args: { entity: E, ids: string[] }): Promise<void> {
			throw new Error("Not implemented")
		}

		extensions = extensions
	})
}

function getTableName(entityName: keyof DTOsMap): string {
	return entityName.toString().toLocaleLowerCase()
}
function getColumnName(propertyName: string): string {
	return new String__(propertyName).toSnakeCase().toString().toLocaleLowerCase()
}

function getWhereClause(filter: FilterGroup<any>): string {
	const quoteValue = (x: Primitive | null) => typeof x === "number" ? `${x}` : `'${x}'`
	//console.log(`quoteValue: ${quoteValue}`)


	const expressionTemplates: Obj<undefined | ((x: Primitive | null) => string), Required<Filter>["operator"]> = {
		equal: x => x ? `= ${quoteValue(x)}` : `is NULL`,
		not_equal: x => `<> ${quoteValue(x)}`,
		greater: x => `> ${quoteValue(x)}`,
		less: x => `< ${quoteValue(x)}`,
		greater_or_equal: x => `>= ${quoteValue(x)}`,
		less_or_equal: x => `<= ${quoteValue(x)}`,
		contains: x => `like '%${x}%'`,
		ends_with: x => `like '%${x}'`,
		starts_with: x => `like '${x}%'`,
		is_outlier_by: undefined,
		blank: undefined
	}

	return filter.filters.length == 0
		? `1=1`
		: filter.filters
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
		const typedKey = camelCase(key)
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
						operator: "equal",
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