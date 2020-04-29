type Obj<TValue = any, TKey extends string = string> = { [key in TKey]: TValue }
type ExtractByType<TObj, TType> = Pick<TObj, { [k in keyof TObj]-?: TObj[k] extends TType ? k : never }[keyof TObj]>
type Primitive = number | string

interface Ctor<TArgs = {}, TObj = {}> { new (args: TArgs): TObj }

declare namespace Filters {
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
type Filter<T extends Obj<Primitive> = Obj<Primitive>> = (
	| Filters.Categorical<T>
	| Filters.Ordinal<T>
	| Filters.Textual<T>
	| Filters.Statistical<T>
)

interface FilterGroup<T extends Obj = Obj> {
	/** combinator default is "and" */
	combinator?: "or" | "and",

	filters: (Filter<T> | FilterGroup<T>)[]
}