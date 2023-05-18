import {
	Obj, Tuple, Filter, FilterGroup,
	keys, values, fromKeyValues,
	DataTable, forEach
} from "@sparkwave/standard"
import {
	EntityCacheGroup, EntityType,
	Schema, IOProvider,
	Repository, RepositoryReadonly, RepositoryGroup, RepositoryGroupCtor
} from "./types"

const NO_FILTERS_KEY = "N/A"

/** 10 minutes cache expiry */
const DEFAULT_CACHE_EXPIRY_MILLISECONDS = 10 * 60 * 1000

/** Generates a repository group class from the io provider
 * @param args.schema The schema for the entities to be managed by the repo
 * @param args.ioProvider IO provider; Repo is memory-cache-only if not provided
 */
export function generateRepoGroupFn<S extends Schema, Cfg extends Obj | void = void>(args:
	{
		schema: S,
		ioProvider?: (cfg: Cfg) => IOProvider<S>,
		cacheExpiryMilliseconds?: number
	}): RepositoryGroup<Cfg, S> {

	return (config: Cfg) => {
		const cache: EntityCacheGroup<S> = fromKeyValues(keys(args.schema).map(e => new Tuple(e, ({
			objects: {},
			vectors: {}
		}))))

		try {
			const io = args.ioProvider ? args.ioProvider(config) : undefined
			const repositoryFactory = <E extends keyof S>(e: E, _cache: EntityCacheGroup<S>) => {
				const cacheExpiryMilliseconds = args.cacheExpiryMilliseconds ?? DEFAULT_CACHE_EXPIRY_MILLISECONDS
				const invalidOrStale = <T>(entry?: [T, number]) =>
					(entry === undefined) || (new Date().getTime() - entry[1] > cacheExpiryMilliseconds)

				return {
					findAsync: async (id, refreshCache?: boolean) => {
						const objects = _cache[e].objects
						if (io && (invalidOrStale(objects[id]) || refreshCache)) {
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
							insertAsync: async objects => {
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

								forEach(objects, datum => {
									const idFieldname = args.schema[e].idField!
									_cache[e].objects[String(datum[idFieldname])] = new Tuple(datum, new Date().getTime())
								})
							},

							updateAsync: async objects => {
								if (io) {
									await io.updateAsync({ entity: e, objects })
								}

								// Remove all vectors cache entries
								_cache[e].vectors = {}

								forEach(objects, datum => {
									const idFieldname = args.schema[e].idField!
									_cache[e].objects[String(datum[idFieldname])] = new Tuple(datum, new Date().getTime())
								})

							},

							deleteAsync: async ids => {
								if (io) {
									await io.deleteAsync({ entity: e, ids })
								}

								_cache[e].vectors = {}
								forEach(ids, id => {
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
				...fromKeyValues(keys(args.schema).map(e => new Tuple(e, repositoryFactory(e, cache))))
			}
		}
		catch (err) {
			throw new Error(`Error creating io provider: ${err} `)
		}
	}
}

export function generateRepoGroupClass<S extends Schema, C extends Obj | void = void>(schema: S, io?: (cfg: C) => IOProvider<S>)
	: RepositoryGroupCtor<C, S> {
	return class {
		private _cache: EntityCacheGroup<S>
		private _io: IOProvider<S> | undefined
		readonly CACHE_EXPIRATION_MILLISECONDS = 10 * 60 * 1000 // 10 minutes

		invalidOrStale<T>(entry?: [T, number]) {
			return (entry === undefined) || (new Date().getTime() - entry[1] > this.CACHE_EXPIRATION_MILLISECONDS)
		}

		constructor(config: C) {
			this._cache = fromKeyValues(keys(schema).map(e => new Tuple(e, ({ objects: {}, vectors: {} }))))
			this._io = io ? io(config) : undefined
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

			forEach(objects, datum => {
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

			forEach(objects, datum => {
				const idFieldname = schema[entity].idField!
				this._cache[entity].objects[String(datum[idFieldname])] = new Tuple(datum, new Date().getTime())
			})
		}

		async deleteAsync<E extends keyof S>(entity: E, ids: string[]) {
			if (this._io) {
				await this._io.deleteAsync({ entity, ids })
			}
			this._cache[entity].vectors = {}
			forEach(ids, id => {
				delete this._cache[entity].objects[String(id)]
			})
		}
	}
}


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
