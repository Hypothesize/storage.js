
import { singular } from "pluralize"
import { FilterGroup } from "@sparkwave/standard"
import { DTOsMap, IOProvider, Ctor, CacheEntry } from "./types"

export interface RepositoryReadonly<D extends DTOsMap, E extends keyof D> {
	/** find one entity object with a specific id, throws exception if not found */
	findAsync(id: string): Promise<D[E]["fromStorage"]>

	/** get entity objects with optional parent and additional filters ... */
	getAsync(args: { parentId: string, filters?: FilterGroup<D[E]["fromStorage"]> }): Promise<D[E]["fromStorage"][]>

	/** A method to remove an entry from the cache */
	bustCache(entry: CacheEntry<D>): () => void
}
export interface RepositoryEditable<D extends DTOsMap, E extends keyof D> extends RepositoryReadonly<D, E> {
	saveAsync: (obj: D[E]["toStorage"][]) => Promise<D[E]["fromStorage"][]>
}
export interface Repository<D extends DTOsMap, E extends keyof D> extends RepositoryEditable<D, E> {
	deleteAsync: (id: string) => Promise<D[E]["fromStorage"]>
	deleteManyAsync?: (args: { parentId: string } | { ids: string[] }) => Promise<D[E]["fromStorage"][]>
}
export type RepositoryGroup<D extends DTOsMap> = {
	[key in keyof D]: Repository<D, keyof D>
}

/** Generates a repository group from the io provider
 * @param ioProviderClass 
 * @param repos The individual repositories: tables, users...
 */
export function generate<X, D extends DTOsMap>(ioProviderClass: Ctor<object, IOProvider<X, D>>): new (config: object, dtoInfo: { [key in keyof D]: string }, cached: boolean) => RepositoryGroup<D> {
	type DTOIndex = keyof D
	return class {
		[key: string]: any
		readonly io: Readonly<IOProvider<X>>
		cache?: CacheEntry<D>[]

		constructor(config: object, dtoInfo: { [key in keyof D]: string }, cached: boolean) {
			try {
				this.io = new ioProviderClass({ ...config })
				this.cache = cached === true ? [] : undefined
			}
			catch (err) {
				throw new Error(`Repository group constructor : ${err} `)
			}
			console.assert(this.io !== undefined, `Repository group this.io after construction is still undefined`)
			Object.keys(dtoInfo).forEach(dtoName => {
				this[dtoName] = this.createRepository({ name: dtoName as DTOIndex, parentName: dtoInfo[dtoName] as DTOIndex })
			})
		}
		protected createRepository<E extends Extract<keyof D, "string">>(dto: { name: DTOIndex, parentName: DTOIndex }) {
			return {
				findAsync: async (id: string) => {
					if (this.cache !== undefined) {
						if (this.cache.find(entry => entry.type === "single" && entry.key === id) === undefined) {
							this.cache.push({ type: "single", key: id, content: this.io.findAsync({ entity: dto.name as string, id: id }) })
						}
						return this.cache.find(entry => entry.type === "single" && entry.key === id)?.content
					} else {
						return this.io.findAsync({ entity: dto.name as string, id: id })
					}
				},
				getAsync: async (selector: { parentId?: string, filters?: FilterGroup<D[E]["fromStorage"]> }) => {
					if (this.cache !== undefined) {
						if (this.cache.find(entry => entry.type === "multiple"
							&& entry.keys.entity === dto.name
							&& entry.keys.parentId === selector.parentId
							&& entry.keys.filters === JSON.stringify(selector.filters)
						) === undefined) {
							this.cache.push({
								type: "multiple",
								keys: { entity: dto.name, parentId: selector.parentId || "", filters: JSON.stringify(selector.filters) },
								content: this.io.getAsync({ entity: dto.name as string, parentId: selector?.parentId, filters: selector?.filters })
							})
						}
						return this.cache.find(entry => entry.type === "multiple"
							&& entry.keys.entity === dto.name
							&& entry.keys.parentId === selector.parentId
							&& entry.keys.filters === JSON.stringify(selector.filters)
						)?.content
					}
					else {
						return this.io.getAsync({ entity: dto.name as string, parentId: selector?.parentId, filters: selector?.filters })
					}
				},
				saveAsync: async (obj: D[E]["toStorage"][]) => {
					const resultPromise = obj[0].id
						? this.io.saveAsync({ entity: dto.name as string, obj: obj, mode: "update" })
						: this.io.saveAsync({ entity: dto.name as string, obj: obj, mode: "insert" })

					resultPromise.then(results => {
						results.forEach(result => {
							// We invalidate the findAsync cache of all entities with that id (so that updates work)
							result.id !== undefined ? this.bustCache({ type: "single", key: result.id }) : undefined

							// We invalidate all getAsync cache entries for entities with the same parent (when adding a table, the getTable of that project will be refreshed)
							const effectiveParentId = dto.parentName !== "" ? result[`${dto.parentName}Id`].toString() : ""
							this.bustCache({ type: "multiple", keys: { entity: dto.name, parentId: effectiveParentId } })
						})
					})
					return resultPromise
				},
				deleteAsync: async (id: string) => {
					const deletedEntity = await this.io.deleteAsync({ entity: dto.name as string, id: id })
					// We invalidate the findAsync cache of all entities with that id (so that updates work)
					this.bustCache({ type: "single", key: id })

					// We invalidate all getAsync cache entries for entities with the same parent (when adding a table, the getTable of that project will be refreshed)
					const effectiveParentId = dto.parentName !== "" ? deletedEntity[`${singular(dto.parentName as string)}Id`].toString() : ""
					this.bustCache({ type: "multiple", keys: { entity: dto.name, parentId: effectiveParentId } })
					return deletedEntity
				},
				deleteManyAsync: async (args: { parentId: string } | { ids: string[] }) => this.io.deleteManyAsync
					? this.io.deleteManyAsync({
						entity: dto.name as string,
						..."parentId" in args
							? { parentId: args["parentId"] }
							: { ids: args["ids"] }
					})
					: undefined,
				bustCache: (entryToBust: CacheEntry<D>) => {
					if (this.cache) {
						const entries = [...this.cache]
						this.cache.length = 0

						entries.filter(entry => {
							if (entryToBust.type === "single") {
								return !(entry.type === "single" && entry.key === entryToBust.key)
							}
							else {
								return !(entry.type === "multiple"
									&& entry.keys.entity === entryToBust.keys.entity
									&& entry.keys.parentId === entryToBust.keys.parentId)
							}
						}).forEach(entry => this.cache!.push(entry))
					}
				}
			} as Repository<D, E>
		}

		get extensions() { return this.io.extensions }
	} as any
}