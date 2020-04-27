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

export interface RepositoryReadonly<E extends keyof DTOsMap> {
	/** find one entity object with a specific id, throws exception if not found */
	findAsync(id: string): Promise<FromStore<E>>

	/** get entity objects with optional parent and additional filters ... */
	getAsync(args: { parentId: string, filters?: FilterGroup<FromStore<E>> }): Promise<FromStore<E>[]>
}
export interface RepositoryEditable<E extends keyof DTOsMap> extends RepositoryReadonly<E> {
	saveAsync: (obj: ToStore<E>) => Promise<FromStore<E>>
}
export interface Repository<E extends keyof DTOsMap> extends RepositoryEditable<E> {
	deleteAsync: (id: string) => Promise<void>
}
export type RepositoryGroup<X extends DTOsMap> = { [key in keyof X]: Repository<string> }

export type PassedObjects<X extends DTOsMap, I = {}> = {
	[key in keyof X]: DTO
}

interface Ctor<TArgs = {}, TObj = {}> { new(args: TArgs): TObj }

export type DTO = {
	toStorage: Object & { id?: string }
	fromStorage: Object
}
export type DTOsMap = { [key: string]: DTO }


export type ToStore<E extends keyof DTOsMap> = DTOsMap[E]["toStorage"]
export type FromStore<E extends keyof DTOsMap> = DTOsMap[E]["fromStorage"]

export interface IOProvider<X = {}> {
	/** find one entity object, throws exception if not found */
	findAsync: <E extends Extract<keyof DTOsMap, string>>(args: { entity: E, id: string }) => Promise<FromStore<E>>

	/** get a set of entity objects */
	getAsync: <E extends Extract<keyof DTOsMap, string>>(args: { entity: E, parentId?: string, filters?: FilterGroup<FromStore<E>> }) => Promise<FromStore<E>[]>

	saveAsync: <E extends Extract<keyof DTOsMap, string>>(args: { entity: E, obj: ToStore<E>, mode: "insert" | "update" }) => Promise<FromStore<E>>
	deleteAsync: <E extends Extract<keyof DTOsMap, string>>(args: { entity: E, id: string }) => Promise<void>

	extensions: X
}

/**
 * 
 * @param ioProviderClass 
 * @param repos The individual repositories: tables, users...
 */
export function generate<C, X, O extends DTOsMap>(ioProviderClass: Ctor<C, IOProvider<X>>, repos: O): new (config: C) => RepositoryGroup<O> {
	class test {
		readonly io: Readonly<IOProvider<X>>

		constructor(config: C) {
			try {
				this.io = new ioProviderClass(config)
			}
			catch (err) {
				throw new Error(`Repository group constructor : ${err} `)
			}
			console.assert(this.io !== undefined, `Repository group this.io after construction is still undefined`)
			Object.keys(repos).forEach(prop => {
				this[prop] = this.createRepository(prop)
			})
		}
		protected createRepository<E extends Extract<keyof DTOsMap, string>>(e: E, methods?: (keyof Repository<E>)[]) {
			return {
				findAsync: async (id: string) => this.io.findAsync({ entity: e, id: id }),
				getAsync: async (selector?: { parentId?: string, filters?: FilterGroup<FromStore<E>> }) => {
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

		get extensions() { return this.io.extensions }
	}
	return test as any
}