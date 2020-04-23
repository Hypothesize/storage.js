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