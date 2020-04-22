import { Object__ as Object } from "./stdlib"

export interface RepositoryGroup<X = {}> {
	projects: Repository<"project">
	tables: Repository<"table">
	analyses: Repository<"analysis">
	columns: RepositoryEditable<"column">
	results: RepositoryReadonly<"result">
	extensions: X
}

type ToStore<E extends keyof Entities.DTOsMap> = Entities.DTOsMap[E]["stored"]
type FromStore<E extends keyof Entities.DTOsMap> = Entities.DTOsMap[E]["extended"]

export interface RepositoryReadonly<E extends keyof Entities.DTOsMap> {
	/** find one entity object with a specific id, throws exception if not found */
	findAsync(id: string): Promise<FromStore<E>>

	/** get entity objects with optional parent and additional filters ... */
	getAsync(args: { parentId: string, filters?: Data.FilterGroup<FromStore<E>> }): Promise<FromStore<E>[]>
}

export interface RepositoryEditable<E extends keyof Entities.DTOsMap> extends RepositoryReadonly<E> {
	saveAsync: (obj: ToStore<E>) => Promise<FromStore<E>>
}

export interface Repository<E extends keyof Entities.DTOsMap> extends RepositoryEditable<E> {
	deleteAsync: (id: string | number) => Promise<void>
}


export interface IOProvider<X = {}> {
	/** find one entity object, throws exception if not found */
	findAsync: <E extends keyof Entities.DTOsMap>(args: { entity: E, id: string }) => Promise<FromStore<E>>

	/** get a set of entity objects */
	getAsync: <E extends keyof Entities.DTOsMap>(args: { entity: E, parentId?: string, filters?: Data.FilterGroup<FromStore<E>> }) => Promise<FromStore<E>[]>

	saveAsync: <E extends keyof Entities.DTOsMap>(args: { entity: E, obj: ToStore<E>, mode: "insert" | "update" }) => Promise<FromStore<E>>
	deleteAsync: <E extends keyof Entities.DTOsMap>(args: { entity: E, id: string }) => Promise<void>

	extensions: X
}

export function generate<C, X>(ioProviderClass: Ctor<C, IOProvider<X>>): new (config: C) => RepositoryGroup<X> {
	return class {
		readonly io: Readonly<IOProvider<X>>

		constructor(config: C) {
			try {
				this.io = Object.freeze(new ioProviderClass(config))
			}
			catch (err) {
				throw new Error(`Repository group constructor : ${err} `)
			}
			console.assert(this.io, `Repository group this.io after construction is still undefined`)
		}

		protected createRepository<E extends keyof Entities.DTOsMap>(e: E, methods?: (keyof Repository<E>)[]) {
			return {
				findAsync: async (id: string) => this.io.findAsync({ entity: e, id: id }),
				getAsync: async (selector?: { parentId?: string, filters?: Data.FilterGroup<FromStore<E>> }) => {
					return this.io.getAsync({ entity: e, parentId: selector?.parentId, filters: selector?.filters })
				},
				saveAsync: async (obj: ToStore<E>) => {
					return obj.id
						? this.io.saveAsync({ entity: e, obj, mode: "update" })
						: this.io.saveAsync({ entity: e, obj, mode: "insert" })
				},
				// updateAsync: async (obj: ToStore<E>) => this.io.saveAsync({ entity: e, obj, mode: "update" }),
				deleteAsync: async (id: string) => this.io.deleteAsync({ entity: e, id })
			}
		}

		projects = this.createRepository("project")

		tables = this.createRepository("table")

		analyses = this.createRepository("analysis")

		columns = {
			...this.createRepository("column"),
			deleteAsync: undefined
		}
		results = {
			...this.createRepository("result"),
			saveAsync: undefined,
			deleteAsync: undefined
		}

		get extensions() { return this.io.extensions }
	}
}