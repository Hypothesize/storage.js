/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable fp/no-delete */
/* eslint-disable fp/no-mutation */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable brace-style */

import { Obj, Tuple, keys, values, objectFromTuples, DataTable, Filter, FilterGroup, forEach } from "@sparkwave/standard"
import {
	EntityCacheGroup, EntityType, Schema,
	IOProvider, Repository, RepositoryReadonly, RepositoryGroup, RepositoryGroupCtor
} from "./types"

const NO_FILTERS_KEY = "N/A"

/** Generates a repository group class from the io provider
 * @param schema The entity model schema
 * @param ioProvider IO provider; Repository is cache-only if not provided
 */
export function generateRepoGroupFn<S extends Schema, Cfg extends Obj | void = void, X extends Obj = {}>(args:
	{
		schema: S,
		ioProvider?: (cfg: Cfg) => IOProvider<S>,
		extensions?: (io: IOProvider<S>) => X,
		/** Time, in ms, after which a cache entry is considered expired */
		cacheExpiration?: number
	}): RepositoryGroup<Cfg, S, typeof args.extensions extends undefined ? undefined : X> {


	/*return class {
		private cache: EntityCacheGroup<S>
		private io: IOProvider<Cfg, S> | undefined
		readonly CACHE_EXPIRATION_MILLISECONDS = 10 * 60 * 1000 // 10 minutes
		readonly invalidOrStale = <T>(entry?: [T, number]) =>
			(entry === undefined) || (new Date().getTime() - entry[1] > CACHE_EXPIRATION_MILLISECONDS)

		constructor(config: Cfg) {
			this.cache = objectFromTuples(keys(schema).map(e => new Tuple(e, ({ objects: {}, vectors: {} }))))
			this.io = ioProvider ? ioProvider(config) : undefined
		}
	}*/

	return (config: Cfg) => {
		const cache: EntityCacheGroup<S> = objectFromTuples(keys(args.schema).map(e => new Tuple(e, ({
			objects: {},
			vectors: {}
		}))))

		try {
			const io = args.ioProvider ? args.ioProvider(config) : undefined
			const repositoryFactory = <E extends keyof S>(e: E, _cache: EntityCacheGroup<S>) => {
				const CACHE_EXPIRATION_MILLISECONDS = args.cacheExpiration !== undefined ? args.cacheExpiration : 10 * 60 * 1000 // 10 minutes
				const invalidOrStale = <T>(entry?: [T, number]) =>
					(entry === undefined) || (new Date().getTime() - entry[1] > CACHE_EXPIRATION_MILLISECONDS)

				return {
					findAsync: async (id, refreshCache?: boolean) => {
						const objects = _cache[e].objects
						if (io && (invalidOrStale(objects[id]) || refreshCache)) {
							// eslint-disable-next-line fp/no-mutation
							objects[id] = new Tuple(
								await io.findAsync({ entity: e, id: id }),
								new Date().getTime()
							)
						}
						return objects[id][0]
					},

					getAsync: async (filter, refreshCache?: boolean) => {
						const filtersKey = filter ? JSON.stringify(filter) : NO_FILTERS_KEY
						const vectors = _cache[e].vectors
						if (io) {
							if (invalidOrStale(vectors[filtersKey]) || refreshCache) {
								vectors[filtersKey] = [
									io.getAsync({ entity: e, filter: filter as any }),
									new Date().getTime()
								]
							}
						}
						else {
							if (vectors[filtersKey] === undefined) {
								const vals = vectors[NO_FILTERS_KEY]
									? await vectors[NO_FILTERS_KEY][0]
									: values(_cache[e].objects).map(v => v[0])
								const dataTable = DataTable.fromRows(vals)
								const newData = (filter ? dataTable.filter({ filter: filter as any }) : dataTable).rowObjects
								vectors[filtersKey] = [Promise.resolve([...newData]), new Date().getTime()]
							}
						}
						return vectors[filtersKey][0]
					},

					...(args.schema[e]["readonly"] === false ?
						{
							insertAsync: async (objects) => {
								if (io) {
									await io.insertAsync({ entity: e, objects })
								}

								// Append new objects to base vector cache, and remove all other vectors cache entries
								const baseVector = _cache[e].vectors[NO_FILTERS_KEY] || [Promise.resolve([]), new Date().getTime()]
								_cache[e].vectors = {
									[NO_FILTERS_KEY]: [
										baseVector[0].then(vector => [...vector, ...objects]),
										baseVector[1]
									]
								}

								forEach(objects, (datum) => {
									const idFieldname = args.schema[e].idField!
									_cache[e].objects[String(datum[idFieldname])] = new Tuple(datum, new Date().getTime())
								})
							},

							updateAsync: async (objects) => {
								if (io) {
									await io.updateAsync({ entity: e, objects })
								}

								// Remove all vectors cache entries
								_cache[e].vectors = {}

								forEach(objects, (datum) => {
									const idFieldname = args.schema[e].idField!
									_cache[e].objects[String(datum[idFieldname])] = new Tuple(datum, new Date().getTime())
								})

							},

							deleteAsync: async (ids) => {
								if (io) {
									await io.deleteAsync({ entity: e, ids })
								}

								_cache[e].vectors = {}
								forEach(ids, (id) => {
									delete _cache[e].objects[String(id)]
								})
							}
						}

						: {
						}
					),

				} as S[E]["readonly"] extends false ? Repository<EntityType<S[E]>> : RepositoryReadonly<EntityType<S[E]>>
			}

			return {
				...objectFromTuples(keys(args.schema).map(e => new Tuple(e, repositoryFactory(e, cache)))),
				extensions: (args.extensions && io ? args.extensions(io) : undefined) as typeof args.extensions extends undefined ? undefined : X
			}
		}
		catch (err) {
			throw new Error(`Error creating io provider: ${err} `)
		}
	}
}

export function generateRepoGroupClass<S extends Schema, C extends Obj | void = void, X extends Obj = Obj<never>>(
	schema: S,
	io?: (cfg: C) => IOProvider<S>,
	ext?: (io: IOProvider<S>) => X)
	: RepositoryGroupCtor<C, S, X> {
	return class {
		private _cache: EntityCacheGroup<S>
		private _io: IOProvider<S> | undefined
		readonly CACHE_EXPIRATION_MILLISECONDS = 10 * 60 * 1000 // 10 minutes

		public extensions: typeof ext extends undefined ? undefined : X

		invalidOrStale<T>(entry?: [T, number]) {
			return (entry === undefined) || (new Date().getTime() - entry[1] > this.CACHE_EXPIRATION_MILLISECONDS)
		}

		constructor(config: C) {
			this._cache = objectFromTuples(keys(schema).map(e => new Tuple(e, ({ objects: {}, vectors: {} }))))
			this._io = io ? io(config) : undefined

			this.extensions = (ext && this._io ? ext(this._io) : undefined) as typeof ext extends undefined ? undefined : X
		}

		async findAsync<E extends keyof S>(entity: E, id: any, refreshCache?: boolean) {
			const objects = this._cache[entity].objects
			if (this._io && (this.invalidOrStale(objects[id]) || refreshCache)) {
				// eslint-disable-next-line fp/no-mutation
				objects[id] = new Tuple(
					await this._io.findAsync({ entity, id: id }),
					new Date().getTime()
				)
			}
			return objects[id][0]
		}

		async getAsync<E extends keyof S>(entity: E, filter: Filter | FilterGroup, refreshCache?: boolean) {
			const filtersKey = filter ? JSON.stringify(filter) : NO_FILTERS_KEY
			const vectors = this._cache[entity].vectors
			if (this._io) {
				if (this.invalidOrStale(vectors[filtersKey]) || refreshCache) {
					vectors[filtersKey] = [
						this._io.getAsync({ entity, filter }),
						new Date().getTime()
					]
				}
			}
			else {
				if (vectors[filtersKey] === undefined) {
					const vals = vectors[NO_FILTERS_KEY]
						? await vectors[NO_FILTERS_KEY][0]
						: values(this._cache[entity].objects).map(v => v[0])
					const dataTable = DataTable.fromRows(vals)
					const newData = (filter ? dataTable.filter({ filter: filter as any }) : dataTable).rowObjects
					vectors[filtersKey] = [Promise.resolve([...newData]), new Date().getTime()]
				}
			}
			return vectors[filtersKey][0]
		}

		async insertAsync<E extends keyof S>(entity: E, objects: EntityType<S[E]>[]) {
			if (this._io) {
				await this._io.insertAsync({ entity, objects })
			}

			// Append new objects to base vector cache, and remove all other vectors cache entries
			const baseVector = this._cache[entity].vectors[NO_FILTERS_KEY] || [Promise.resolve([]), new Date().getTime()]
			this._cache[entity].vectors = {
				[NO_FILTERS_KEY]: [
					baseVector[0].then(vector => [...vector, ...objects]),
					baseVector[1]
				]
			}

			forEach(objects, (datum) => {
				const idFieldname = schema[entity].idField!
				this._cache[entity].objects[String(datum[idFieldname])] = new Tuple(datum, new Date().getTime())
			})
		}

		async updateAsync<E extends keyof S>(entity: E, objects: EntityType<S[E]>[]) {
			if (this._io) {
				await this._io.updateAsync({ entity, objects })
			}

			// Remove all vectors cache entries
			this._cache[entity].vectors = {}

			forEach(objects, (datum) => {
				const idFieldname = schema[entity].idField!
				this._cache[entity].objects[String(datum[idFieldname])] = new Tuple(datum, new Date().getTime())
			})
		}

		async deleteAsync<E extends keyof S>(entity: E, ids: string[]) {
			if (this._io) {
				await this._io.deleteAsync({ entity, ids })
			}
			this._cache[entity].vectors = {}
			forEach(ids, (id) => {
				delete this._cache[entity].objects[String(id)]
			})
		}
	}
}

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

/* Cache system specification
	If the option is enabled, a cache object will be created along with the repository group.
	It stores the return values of calls to "getAsync" and "findAsync" functions, to return it faster when the same calls are made afterwards.
	
	### Entries insertion
	A call to "findAsync" creates a "single" type cache entry, which stores a single entity.
	A call to "getAsync" creates a "multiple" cache entry, which stores all entities returned by the function.
	
	### Entries invalidation
	**Automatic**
	When the saveAsync and deleteAsync functions are called, all cache entries related to the updated entity will be removed: its "single" type entry if present, and any "multiple" entries that included it in the results.
	**Manual**
	In addition, every repository exposes a "invalidateCache" function: it should be used to invalidate the cache when the underlying data changed without the "saveAsync" or "deleteAsync" methods involved. For instance, when the database where entities are stored was modified by another user.
*/
