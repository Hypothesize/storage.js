import * as assert from "assert"
// import { Obj, TypeAssert, TypeGuard } from "@sparkwave/standard"

import { Obj, TypeAssert } from "@sparkwave/standard"
import { FieldType, EntityType, RepositoryGroup } from "../src/types"



describe("FieldType", () => {
	it("Generates literal types properly", () => {
		const _: TypeAssert<FieldType<{ type: "literal", value: "xyz", nullable: true }>, "xyz" | undefined> = "true"
	})
	it("Generates a union of literal types properly", () => {
		const _: TypeAssert<FieldType<(
			| { type: "literal", value: "abc", nullable: true }
			| { type: "literal", value: "xyz", nullable: true }
		)>, "abc" | "xyz" | undefined> = "true"
	})
	it("Applies a union of <undefined> to a field literal with nullable = true", () => {
		const test_1: TypeAssert<FieldType<(
			| {
				nullable: true,
				type: "object",
				valueType: "unknown"
			}
		)>, Obj<unknown> | undefined> = "true"

		assert.ok(true)
	})

	it("Handles union types properly", () => {
		const test_1: TypeAssert<FieldType<(
			| {
				nullable: true,
				type: "object",
				valueType: {
					type: "object",
					valueType: "string"
				}
			}
			| {
				nullable: true,
				type: "array",
				arrayType: "object"
			}
		)>, Obj<Obj<string>> | Obj[] | undefined> = "true"

		assert.ok(true)
	})
})


/*export const schema = {
	projects: {
		fields: {
			id: "string",
			name: "string",
			description: "string",
			userId: "string",
			categoryId: "string",
			isPublic: "boolean",
			whenLastAccessed: "number",
			whenCreated: "number"
		},
		readonly: false,
		idField: "id"
	},

	listings: {
		fields: {
			id: "string",
			projectId: "string",
			title: "string",
			phone: "string",
			altPhone: "string",
			contactName: "string",
			externalUrl: "string",
			whenPosted: "number",
			whenAdded: "number"
		},
		readonly: false,
		idField: "id"
	},

	listingFields: {
		fields: {
			id: "string",
			listingId: "string",
			fieldId: "string",
			value: "string",
		},
		idField: "id"
	},

	categories: {
		fields: {
			id: "string",
			name: "string",
			countryId: { type: "string", nullable: true },
			parsingEndpoint: "string"
		},
		readonly: false,
		idField: "id"
	},

	categoryFields: {
		fields: {
			id: "string",
			categoryId: "string",
			fieldName: "string",
			fieldType: { type: "string" },
		},
		readonly: false,
		idField: "id"
	},

	usersExtended: {
		fields: {
			id: "string",
			displayName: "string",
			emailAddress: "string",
			companyName: "string",
			role: "string",
			whenCreated: "number",
			pwdHash: "string",
			pwdSalt: "string"
		},
		idField: "id",
		readonly: false
	},

	users: {
		fields: {
			id: "string",
			displayName: "string",
			emailAddress: "string",
			companyName: "string",
			role: "string",
			whenCreated: "number",
			// pwdHash: "string",
			// pwdSalt: "string"
		},
		idField: "id",
		readonly: true
	}
} as const

class PostgresJsProvider extends PostgresDbProvider {
	protected sql: any
	constructor(config: { dbUrl: string }) {
		super()
		this.sql = postgres(config.dbUrl, {
			ssl: { rejectUnauthorized: false }, // True, or options for tls.connect
			max: 10,		// Max number of connections
			idle_timeout: 0, // Idle connection timeout in seconds
			connect_timeout: 30, // Connect timeout in seconds
			types: [],		// Array of custom types, see more below
			// onnotice: fn,// Defaults to console.log
			// onparameter: fn, // (key, value) when server param change
			// debug: fn,	// Is called with (connection, query, parameters)
			transform: {
				// column: fn,	// Transforms incoming column names
				// value: fn,	// Transforms incoming row values
				// row: fn	// Transforms entire rows
			},
			connection: {
				application_name: 'postgres.js', // Default application_name
				// ... // Other connection parameters
			}
		})
	}

	queryOne<T>(sql: string): Promise<T> {
		return this.sql`${sql}`
	}
	queryMany<T>(sql: string): Promise<T[]> {
		return this.sql`${sql}`
	}
	queryAny(sql: string) {
		return this.sql`${sql}`
	}

	// const pgErrorsCode = { UNIQUE_VIOLATION: "23505", NOT_NULL_VIOLATION: "23502" }

	override interpolatableValue(value: any): string {
		return String(value) // no quotes
	}
}
const ioProvider = asIOProvider(class tabularPostgresDbProvider extends PostgresJsProvider {
	override interpolatableColumnName(columnName: string): string {
		return toSnakeCase(columnName).toLowerCase()
	}
	override interpolatableRowsetName(rowsetName: string, operation: "select" | "insert" | "update" | "delete" = "select"): string {
		return `${operation}_${toSnakeCase(rowsetName).toLowerCase()}`
	}

	override insert<T extends Obj<unknown, string>>(tablename: string, data: T): string {
		return `SELECT * from ${this.interpolatableRowsetName(tablename)}(${JSON.stringify(data)}) as result`

	}
	override update<T extends Obj<unknown, string>>(tablename: string, data: T): string {
		return `SELECT * from ${this.interpolatableRowsetName(tablename)}(${JSON.stringify(data)}) as result`
	}
})

const repoFn = generateRepoGroupFn({ schema, ioProvider })
const repoClass = generateRepoGroupClass({ schema, ioProvider })

const APIRepository = generateRepoGroupClass({
	schema,

	ioProvider: (cfg: { baseUrl: string }) => {
		const baseUrl = (entity: string) => `${cfg.baseUrl}/api/${entity}`

		return {
			findAsync: async function (args) {
				return getAsync({ url: `${baseUrl(args.entity)}/${args.id}` }, r => r.json())
			},

			getAsync: async function (args) {
				return getAsync({
					url: baseUrl(args.entity),
					query: { filter: JSON.stringify(args.filter) }
				}, r => r.json())
			},

			insertAsync: async function (args) {
				await postAsync({
					url: baseUrl(args.entity),
					body: JSON.stringify(args.obj)
				})
			},

			updateAsync: async function (args) {
				return putAsync({
					url: baseUrl(args.entity),
					body: JSON.stringify(args.obj)
				}).then(r => r.json())
			},

			deleteAsync: async function (args) {
				await deleteAsync({ url: `${baseUrl(args.entity)}/${args.id}` })
			}
		}
	}
})

const cats1 = repoFn({ dbUrl: "" }).categories.getAsync(undefined, true)
const cats2 = new repoClass({ dbUrl: "" }).getAsync("categories", undefined, false).then(data => data[0].parsingEndpoint)
const x = new APIRepository({ baseUrl: "" }).getAsync("")
*/


// const readonlySchema = {
// 	testEntity: {
// 		fields: {
// 			requiredNumber: "number",
// 			optionalNumber: { type: "number", nullable: true },
// 			textual: "string",
// 		},
// 		readonly: true
// 	}
// } as const

// const writableSchema = {
// 	testEntity: {
// 		fields: {
// 			requiredNumber: "number",
// 		},
// 		readonly: false
// 	}
// } as const

// type ReadonlyTestSchema = typeof readonlySchema
// type WritableTestSchema = typeof writableSchema

// const literalTestEntity: EntityType<ReadonlyTestSchema["testEntity"]> = {
// 	requiredNumber: 5,
// 	optionalNumber: undefined,
// 	textual: "Blue"
// }

// const readOnlyRepositoryGroup: RepositoryGroup<unknown, ReadonlyTestSchema> = (cfg) => ({
// 	testEntity: {
// 		getAsync: async () => {
// 			return [literalTestEntity]
// 		},
// 		findAsync: async () => {
// 			return literalTestEntity
// 		},
// 	},
// 	extensions: {}
// })

// const writableRepositoryGroup: RepositoryGroup<unknown, WritableTestSchema> = (cfg) => ({
// 	testEntity: {
// 		getAsync: async () => {
// 			return [literalTestEntity]
// 		},
// 		findAsync: async () => {
// 			return literalTestEntity
// 		},
// 		insertAsync: async () => { },
// 		updateAsync: async () => { },
// 		deleteAsync: async () => { }
// 	},
// 	extensions: {}
// })

// // Failing
// // const absentRequiredProp: TestEntityType["requiredNumber"] = null

// // const writableRepositoryGroupWithoutWriteMethods: RepositoryGroup<{}, WritableTestSchema> = (cfg) => ({
// // 	testEntity: {
// // 		getAsync: async () => { return [literalTestEntity] },
// // 		findAsync: async () => { return literalTestEntity },
// // 	},
// // 	extensions: {}
// // })

// /** Tests for whether a type is exactly <any>. Fails for types that are extended by <unknown> */
// export type IsAny<T> = ((Exclude<any, T> extends (never) ? 1 : 0) extends (0 | 1)
// 	? (0 | 1) extends (Exclude<any, T> extends never ? 1 : 0)
// 	? "false"
// 	: "true"
// 	: "true"
// )