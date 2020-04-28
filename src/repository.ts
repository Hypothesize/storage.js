export type Obj<TValue = any, TKey extends string = string> = { [key in TKey]: TValue }
export type ExtractByType<TObj, TType> = Pick<TObj, { [k in keyof TObj]-?: TObj[k] extends TType ? k : never }[keyof TObj]>
export type Primitive = number | string

export namespace Filters {
	export interface Base<TObj extends Obj<Primitive>, TVal extends Primitive | null> {
		fieldName: keyof (ExtractByType<TObj, TVal>),
		value: TVal,
		negated?: boolean
	}
	export interface Categorical<T extends Obj<Primitive>> extends Base<T, Primitive | null> {
		operator: "equal" | "not_equal",
	}
	export interface Ordinal<T extends Obj<Primitive>> extends Base<T, number> {
		operator: "greater" | "greater_or_equal" | "less" | "less_or_equal",
		negated?: boolean
	}
	export interface Textual<T extends Obj<Primitive>> extends Base<T, string> {
		operator: "contains" | "starts_with" | "ends_with",
	}
	export interface Statistical<T extends Obj<Primitive>> extends Base<T, number> {
		operator: "is_outlier_by",
		/** number of std. deviations (possibly fractional) */
		//value: number
	}
}
export type Filter<T extends Obj<Primitive> = Obj<Primitive>> = (
	| Filters.Categorical<T>
	| Filters.Ordinal<T>
	| Filters.Textual<T>
	| Filters.Statistical<T>
)

export interface FilterGroup<T extends Obj = Obj> {
	/** combinator default is "and" */
	combinator?: "or" | "and",

	filters: (Filter<T> | FilterGroup<T>)[]
}

export interface RepositoryReadonly<D extends DTOsMap, E extends keyof D> {
	/** find one entity object with a specific id, throws exception if not found */
	findAsync(id: string): Promise<D[E]["fromStorage"]>

	/** get entity objects with optional parent and additional filters ... */
	getAsync(args: { parentId: string, filters?: FilterGroup<D[E]["fromStorage"]> }): Promise<D[E]["fromStorage"][]>
}
export interface RepositoryEditable<D extends DTOsMap, E extends keyof D> extends RepositoryReadonly<D, E> {
	saveAsync: (obj: D[E]["toStorage"]) => Promise<D[E]["fromStorage"]>
}
export interface Repository<D extends DTOsMap, E extends keyof DTOsMap> extends RepositoryEditable<D, E> {
	deleteAsync: (id: string) => Promise<void>
}
export type RepositoryGroup<X extends DTOsMap> = { [key in keyof X]: Repository<X, Extract<keyof X, string>> }

interface Ctor<TArgs = {}, TObj = {}, TEnt extends DTOsMap = DTOsMap> { new <TEnt>(args: TArgs): TObj }

export type DTO = {
	toStorage: Object & { id?: string }
	fromStorage: Object
}
export type DTOsMap = { [key: string]: DTO }

export interface IOProvider<X = {}, D extends DTOsMap = DTOsMap> {
	/** find one entity object, throws exception if not found */
	findAsync: <E extends Extract<keyof D, string>>(args: { entity: E, id: string }) => Promise<D[E]["fromStorage"]>

	/** get a set of entity objects */
	getAsync: <E extends Extract<keyof D, string>>(args: { entity: E, parentId?: string, filters?: FilterGroup<D[E]["fromStorage"]> }) => Promise<D[E]["fromStorage"][]>

	saveAsync: <E extends Extract<keyof D, string>>(args: { entity: E, obj: D[E]["toStorage"], mode: "insert" | "update" }) => Promise<D[E]["fromStorage"]>
	deleteAsync: <E extends Extract<keyof D, string>>(args: { entity: E, id: string }) => Promise<void>

	extensions: X
}

/**
 * 
 * @param ioProviderClass 
 * @param repos The individual repositories: tables, users...
 */
export function generate<C, X, D extends DTOsMap>(ioProviderClass: Ctor<C, IOProvider<X, D>>): new (config: C, dtoNames: Extract<keyof D, string>[]) => RepositoryGroup<D> {
	return class {
		readonly io: Readonly<IOProvider<X>>

		constructor(config: C, dtoNames: Extract<keyof X, string>[]) {
			try {
				this.io = new ioProviderClass(config)
			}
			catch (err) {
				throw new Error(`Repository group constructor : ${err} `)
			}
			console.assert(this.io !== undefined, `Repository group this.io after construction is still undefined`)
			dtoNames.forEach(prop => {
				this[prop as string] = this.createRepository(prop)
			})
		}
		protected createRepository<E extends Extract<keyof X, string>>(e: E) {
			return {
				findAsync: async (id: string) => this.io.findAsync({ entity: e, id: id }),
				getAsync: async (selector?: { parentId?: string, filters?: FilterGroup<D[E]["fromStorage"]> }) => {
					return this.io.getAsync({ entity: e, parentId: selector?.parentId, filters: selector?.filters })
				},
				saveAsync: async (obj: D[E]["toStorage"]) => {
					return obj.id
						? this.io.saveAsync({ entity: e, obj, mode: "update" })
						: this.io.saveAsync({ entity: e, obj, mode: "insert" })
				},
				// updateAsync: async (obj: ToStore<E>) => this.io.saveAsync({ entity: e, obj, mode: "update" }),
				deleteAsync: async (id: string) => this.io.deleteAsync({ entity: e, id })
			}
		}

		get extensions() { return this.io.extensions }
	} as any
}