export interface Repository<E extends keyof DTOsMap> extends RepositoryEditable<E> {
	deleteAsync: (id: string) => Promise<void>
}

export interface RepositoryGroup<X = {}> {
	projects: Repository<"projects">
	tables: Repository<"tables">
	analyses: Repository<"analyses">
	columns: RepositoryEditable<"columns">
	results: RepositoryReadonly<"results">
	extensions: X
}

type DTOsMap = Hypothesize.Entities.Map

type ToStore<E extends keyof DTOsMap> = DTOsMap[E]["toStorage"]
type FromStore<E extends keyof DTOsMap> = DTOsMap[E]["fromStorage"]

interface RepositoryReadonly<E extends keyof DTOsMap> {
	/** find one entity object with a specific id, throws exception if not found */
	findAsync(id: string): Promise<FromStore<E>>

	/** get entity objects with optional parent and additional filters ... */
	getAsync(args: { parentId: string, filters?: Hypothesize.Data.FilterGroup<FromStore<E>> }): Promise<FromStore<E>[]>
}

interface RepositoryEditable<E extends keyof DTOsMap> extends RepositoryReadonly<E> {
	saveAsync: (obj: ToStore<E>) => Promise<FromStore<E>>
}

interface IOProvider<X = {}> {
	/** find one entity object, throws exception if not found */
	findAsync: <E extends keyof DTOsMap>(args: { entity: E, id: string }) => Promise<FromStore<E>>

	/** get a set of entity objects */
	getAsync: <E extends keyof DTOsMap>(args: { entity: E, parentId?: string, filters?: Hypothesize.Data.FilterGroup<FromStore<E>> }) => Promise<FromStore<E>[]>

	saveAsync: <E extends keyof DTOsMap>(args: { entity: E, obj: ToStore<E>, mode: "insert" | "update" }) => Promise<FromStore<E>>
	deleteAsync: <E extends keyof DTOsMap>(args: { entity: E, id: string }) => Promise<void>

	extensions: X
}

export function generate<C, X>(ioProviderClass: Hypothesize.Ctor<C, IOProvider<X>>): new (config: C) => RepositoryGroup<X> {
	return class {
		readonly io: Readonly<IOProvider<X>>

		constructor(config: C) {
			try {
				this.io = new ioProviderClass(config)
			}
			catch (err) {
				throw new Error(`Repository group constructor : ${err} `)
			}
			console.assert(this.io !== undefined, `Repository group this.io after construction is still undefined`)
		}

		protected createRepository<E extends keyof DTOsMap>(e: E, methods?: (keyof Repository<E>)[]) {
			return {
				findAsync: async (id: string) => this.io.findAsync({ entity: e, id: id }),
				getAsync: async (selector?: { parentId?: string, filters?: Hypothesize.Data.FilterGroup<FromStore<E>> }) => {
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

		projects = this.createRepository("projects")

		tables = this.createRepository("tables")

		analyses = this.createRepository("analyses")

		columns = {
			...this.createRepository("columns"),
			deleteAsync: undefined
		}
		results = {
			...this.createRepository("results"),
			saveAsync: undefined,
			deleteAsync: undefined
		}

		get extensions() { return this.io.extensions }
	}
}