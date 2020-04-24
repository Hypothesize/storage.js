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

export type DTOsMap = Hypothesize.Entities.Map

export type ToStore<E extends keyof DTOsMap> = DTOsMap[E]["toStorage"]
export type FromStore<E extends keyof DTOsMap> = DTOsMap[E]["fromStorage"]

export interface RepositoryReadonly<E extends keyof DTOsMap> {
	/** find one entity object with a specific id, throws exception if not found */
	findAsync(id: string): Promise<FromStore<E>>

	/** get entity objects with optional parent and additional filters ... */
	getAsync(args: { parentId: string, filters?: Hypothesize.Data.FilterGroup<FromStore<E>> }): Promise<FromStore<E>[]>
}

export interface RepositoryEditable<E extends keyof DTOsMap> extends RepositoryReadonly<E> {
	saveAsync: (obj: ToStore<E>) => Promise<FromStore<E>>
}

export interface IOProvider<X = {}> {
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

export namespace Hypothesize {
	export type Key = string | number | symbol
	export type Obj<TValue = any, TKey extends string = string> = { [key in TKey]: TValue }
	export type TypedObj<T> = { [key in keyof T]: T[key] }
	export type Any = Obj<any>
	export type Primitive = number | string /*| boolean*/ | Date
	export type Primitive2 = number | string
	export type ExtractByType<TObj, TType> = Pick<TObj, { [k in keyof TObj]-?: TObj[k] extends TType ? k : never }[keyof TObj]>
	//export type ExtractByType<TObj, TType> = Pick<TObj, { [k in keyof TObj]: TObj[k] extends TType ? k : never }[keyof TObj]>;

	export type Nullable<T> = T | undefined | null
	export type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T]
	export type Functional<T, F> = { [P in keyof T]: (props?: F) => T[P] }
	export type ArgsType<F extends (...x: any[]) => any> = F extends (...x: infer A) => any ? A : never
	export type CtorArgsType<F extends new (...x: any[]) => object> = F extends new (...x: infer A) => object ? A : never
	export type NonUndefined<T> = T extends undefined ? never : T
	export type RecursivePartial<T> = { [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P] }
	export type RecursiveRequired<T> = { [P in keyof T]-?: Required<T[P]> }
	export type MaybePromise<T> = T | Promise<T>
	export type Promisify<T> = T extends string | number | undefined | null | Date ? Promise<T> : { [P in keyof T]?: Promisify<T[P]> }
	export type UnPromise<T> = T extends Promise<infer X> ? X : T extends Readonly<Promise<infer X>> ? Readonly<X> : T extends Partial<Promise<infer X>> ? Partial<X> : T
	export interface Msg { type: string, data?: any }

	export interface Ctor<TArgs = {}, TObj = {}> { new(args: TArgs): TObj }

	export type ArrayElementType<T> = T extends (infer U)[] ? U : T
	export type Tuple<X, Y> = [X, Y]

	//declare export namespace Core {
	export type Hasher<X = any, Y extends string | number | symbol = number> = (a?: X) => Y

	/** Returns -1 if a is smaller than b; 0 if a & b are equal, and 1 if a is bigger than b */
	export type Ranker<X = any> = (a: X, b: X) => number

	/** Returns true if a and b are equal, otherwise returne false */
	export type Comparer<X = any> = (a?: X, b?: X) => boolean


	export type Projector<X = any, Y = any> = (value: X) => Y
	export type Predicate<X = any> = (value: X) => boolean
	export type Reducer<X = any, Y = any> = (prev: Y, current: X) => Y

	export namespace Collection {
		export interface Enumerable<X> extends Iterable<X> {
			take: (n: number) => Enumerable<X>
			skip: (n: number) => Enumerable<X>
			filter: (predicate: Predicate<X>) => Enumerable<X>

			map<Y extends [S, Z], Z, S extends string>(projector: Projector<X, Y>): Enumerable<[S, Z]>
			map<Y>(projector: Projector<X, Y>): Enumerable<Y> //Y extends [string, infer Z] ? Enumerable<[string, Z]> : Enumerable<Y>

			reduce: <Y>(initial: Y, reducer: Reducer<X, Y>) => Enumerable<Y>
			forEach: (action: Projector<X>) => void

			first(): X | undefined

			materialize(): MaterialExtended<X>
		}
		export interface Material<X> extends Enumerable<X> {
			size: number
			some(predicate: Predicate<X>): boolean
			every(predicate: Predicate<X>): boolean
		}
		export interface MaterialExtended<X> extends Material<X> {
			unique(comparer: Comparer<X>): Material<X>
			union(...collections: Material<X>[]): Material<X>
			intersection(...collections: Material<X>[]): Material<X>
			except(...collections: Material<X>[]): Material<X>
			complement(universe: Iterable<X>): Material<X>

			sort(comparer?: Ranker<X>): Ordered<X>
			sortDescending(comparer?: Ranker<X>): Ordered<X>

			//has(value: X): boolean
			contains(value: X): boolean
			//includes(value: X): boolean
		}
		export interface Indexed<K, V> {
			get(index: K): V | undefined
			get(indices: K[]): (V | undefined)[]
			get(...indices: K[]): (V | undefined)[]
			get(selector: K | K[]): undefined | V | V[]

			indexesOf(value: V): Enumerable<K>
			indexesOf(value: V, mode: "as-value"): Enumerable<K>
			indexesOf(value: Predicate<V>, mode: "as-predicate"): Enumerable<K>
		}
		export interface IndexedExtended<K, V> extends Indexed<K, V> {
			keys(): Material<K>
			hasKey(key: K): boolean

			values(): Material<V>
			hasValue(value: V): boolean

			//indexOf(args: ({ value: V } | { block: Iterable<V> } | { predicate: Predicate<V> }) & { fromIndex?: number, fromEnd?: boolean }): K
		}
		export interface Ordered<T> extends MaterialExtended<T>, Indexed<number, T> {
			last(): T | undefined
			reverse(): Ordered<T>

			//indexOfRange(range: Iterable<number>, fromIndex?: number, fromEnd?: boolean): number
		}
	}
	//}

	/** Custom simplified web request object for easy JSON-serialization */
	export interface SimpleWebRequest {
		/** Request body, usually in the form of raw text */
		// body: any,

		/** Path params; e.g. path "projects/:project_id/tables/" results in params object: { projectId: ...}*/
		params: Obj,

		/** Query variables; e.g. url "/projects?{category=abc" results in query variables object: {category: "abc"} */
		query: Obj,

		/** Currently logged-in user, if any */
		user?: Entities.User.ForStorage,

		baseUrl: string
	}

	/** Used for sending response metadata from server to client through the script tag */
	export interface ServerInfo {
		req: SimpleWebRequest
		pageName: string
		env: {
			NODE_ENV: string | undefined,
			LOGGING: string | undefined,
			S3_BUCKET_NAME: string | undefined,
			S3_REGION_NAME: string | undefined,
			S3_CLOUDFRONT_URL: string | undefined
		}
	}

	export namespace Entities {
		export type Map = {
			users: {
				parent: undefined,
				toStorage: User.ForStorage
				fromStorage: User.FromStorage
			}
			projects: {
				parent: User.ForStorage,
				toStorage: Project.ForStorage
				fromStorage: Project.FromStorage
			}
			columns: {
				parent: Table.ForStorage,
				toStorage: Column.ForStorage
				fromStorage: Column.FromStorage
			},
			analyses: {
				parent: Project.ForStorage,
				toStorage: Analysis.ToStorage
				fromStorage: Analysis.FromStorage
			}
			tables: {
				parent: Project.ForStorage,
				toStorage: Table.ForStorage
				fromStorage: Table.FromStorage
			}
			results: {
				parent: Analysis.ToStorage,
				toStorage: Result.ForStorage
				fromStorage: Result.FromStorage
			}
		}

		export namespace User {
			export const enum Role {
				dev = 4,
				admin = 2,
				regular = 1,
				none = 0
			}
			export interface Base {
				firstName: string,
				lastName: string,
				emailAddress: string,
				companyName?: string,
			}
			export interface ForStorage extends Base {
				id: string
				role: Role,
				whenCreated?: number
				readonly pwdHash: string,
				readonly pwdSalt: string
			}
			export interface FromStorage extends ForStorage {

			}
		}

		export namespace Project {
			export type Category = (
				| "User" // projects belonging to user
				| "Recent" // projects recently accessed/created by user
				| "Popular" // popular (public) projects (as indicated by favs, clones, and views)
				| "Shared" // projects shared with user
			)
			export interface Base {
				name: string
				description: string
			}
			export interface ForStorage extends Base {
				id: string

				/** owner user id */
				userId: string

				/** is favorite of context user (computed from db) */
				isFavorite: boolean

				/** is shared (read-only) with all users */
				isPublic: boolean

				/** ticks timestamp */
				whenLastAccessed?: number

				/** ticks timestamp */
				whenCreated?: number
			}
			export interface FromStorage extends ForStorage {
				readonly categories: Category[], // which categories the project belongs to, computed from db
			}
		}

		export namespace Table {
			export interface Base {
				name: string
				dataFileName?: string
				numColumns: number
				numRows: number
				whenCreated: number
			}
			export interface ForStorage extends Base {
				id: string
				projectId: string
				storageUrl: string
			}
			export interface FromStorage extends ForStorage {
			}
			export interface Augmented extends Base {
				data?: Data.Table<Obj<number | string | undefined>>
			}
		}

		export namespace Column {
			export interface Base {
				name: string,

				/** system inferred/parsed column export type */
				columnType: Data.ColumnType,

				/** first value is user confirmed level (possibly unknown); the rest are inferred levels, in order of decreasing likelihood */
				measureLevels: Data.MeasureLevel[]
			}
			export interface ForStorage extends Base {
				id: string
				tableId: string

				/** storage location for raw vector data */
				storageUrl: string
			}
			export interface FromStorage extends ForStorage {
			}
			export interface BusinessObject<TSummary extends Data.Summary.Base = Data.Summary.Base, TData = Primitive>
				extends Base, Omit<Hypothesize.Analysis.Variable, "columnName"> {

				summary?: Promise<TSummary>,
				vector: TData[]
			}
		}

		export namespace Analysis {
			export interface Base {
				name: string
				goal: Hypothesize.Analysis.Goal
				variables: Hypothesize.Analysis.Variable[]
				filters?: Data.Filter[],
				settings?: Obj
			}

			export namespace Kinds {
				export interface Summary extends Base {
					goal: "summary"
					variables: [{ columnName: string }]
					settings?: {}
				}
				export interface Experiment extends Base {
					goal: "experiment",
					variables:
					| [{ columnName: string, role: "intervention" }, { columnName: string, role: "effect" }]
					| [{ columnName: string, role: "effect" }]
					| [{ columnName: string, role: "intervention" }]
					| []
					settings?: {
						controlValue: any,
						controlType: "group" | "constant"
					}
				}
				export interface Factor extends Base {
					goal: "factors"
					variables: { columnName: string }[]
					settings?: {
						method: "PrincipalComponents" | "MaxLikelihood" | "PrincipalAxis"
						matrixType: "Correlation" | "Covariance"
						rotationType: 'none' | 'varimax' | 'quartimax' | 'equamax' | 'promax' | 'oblimin' | 'simplimax' | 'cluster'
						numFactors: number
					}
				}
				export interface Correlation extends Base {
					goal: "correlation",
					variables: { columnName: string, role: "control" | "default" }[]
					settings?: { useControl: boolean, measureLevels: Obj<Data.MeasureLevel> }
				}
				export interface Regression extends Base {
					goal: "regression",
					variables: { columnName: string, role: "outcome" | "predictor" }[]
					settings?: { regressionGoal: "testHypothesis" | "maxAccuracy" | "maxInterpretability", maxVariables: number }
				}

				export type Any = Base | Summary | Experiment | Factor | Correlation | Regression
			}

			export type ForAPI<D extends Hypothesize.Analysis.DataInfo.Any> = Base & D

			export type ForApp<A = Base> = A & {
				/** Whether the analysis name is one chosen by the user */
				isNameCustom: boolean

				/** Array of analysis cfg view names */
				viewHistory: Hypothesize.Analysis.ViewName[]

				/** current analysis cfg view index */
				viewIndex: number

				/** Whether the analysis configuration is fully complete and thus valid */
				isComplete: boolean

				results?: Array<Result.Group> /* hasResults: boolean */
				//errors?: { saveFailure?: string }
			}
			export type ToStorage<A = Base> = A & {
				id: string

				/** Id of project that contains this analysis */
				projectId: string

				/** Id of table that was used as the source of data for this analysis */
				tableId: string

				/** Time (as ticks) */
				whenCreated: number
			}
			export type FromStorage<A = Base> = ToStorage<A> & {
				resultStatus: string
				thumbnailSvg: string
			}
		}

		export namespace Result {
			export interface Image {
				type: "image"
				id: string
				name?: string
				url: string
			}
			export interface Table {
				type: "table"
				id: string
				name?: string
				data: object[]
			}
			export interface Error {
				type: "error"
				id: string
				message: string
			}
			export type Item = Table | Image | Error | Viz.Collection

			/** Group of result items that are usually displayed in a tab */
			export interface Group<TContent = Item> {
				name: string
				description: string

				/** Might contain viz generation info from R, or fully usable viz collection */
				content: Array<Item>

				initialLayout: "1 Column" | "2 Columns" | "4 Columns" | "Auto Columns" | "Flow"
				displayIndex: number
			}

			export interface ForStorage extends Group { id: string, analysisId: string, thumbnailSvg?: string }
			export interface FromStorage extends ForStorage { }

		}

		export namespace DTO {
			export type Stored = User.ForStorage | Project.ForStorage | Table.ForStorage | Column.ForStorage | Analysis.ToStorage | Result.ForStorage
			export type Extended = User.FromStorage | Project.FromStorage | Table.FromStorage | Column.FromStorage | Analysis.FromStorage | Result.FromStorage
		}
	}

	export namespace Data {
		export const enum ValueType {
			integer = "integer",
			float = "float",
			text = "text",
			date = "date",
			missing = "missing"
		}
		export interface NumberValue { original: any, effective: number, valueType: ValueType.integer | ValueType.float }
		export interface StringValue { original: any, effective: string, valueType: ValueType.text }
		export interface DateValue { original: any, effective: string, valueType: ValueType.date }
		export interface MissingValue { original: any, effective: undefined, valueType: ValueType.missing }
		export type ParsedValue = NumberValue | StringValue | DateValue | MissingValue

		export namespace Filters {
			export interface Base<TObj extends Obj<Primitive2>, TVal extends Primitive2 | null> {
				fieldName: keyof (ExtractByType<TObj, TVal>),
				value: TVal,
				negated?: boolean
			}
			export interface Categorical<T extends Obj<Primitive2>> extends Base<T, Primitive2 | null> {
				operator: "equal" | "not_equal",
			}
			export interface Ordinal<T extends Obj<Primitive2>> extends Base<T, number> {
				operator: "greater" | "greater_or_equal" | "less" | "less_or_equal",
				negated?: boolean
			}
			export interface Textual<T extends Obj<Primitive2>> extends Base<T, string> {
				operator: "contains" | "starts_with" | "ends_with",
			}
			export interface Statistical<T extends Obj<Primitive2>> extends Base<T, number> {
				operator: "is_outlier_by",
				/** number of std. deviations (possibly fractional) */
				//value: number
			}
		}
		export type Filter<T extends Obj<Primitive2> = Obj<Primitive2>> = (
			| Filters.Categorical<T>
			| Filters.Ordinal<T>
			| Filters.Textual<T>
			| Filters.Statistical<T>
		)
		export interface FilterGroup<T extends Obj = Obj> {
			/** combinator default is "and" */
			combinator?: "or" | "and",

			filters: (Data.Filter<T> | FilterGroup<T>)[]
		}

		export type ColumnType = (
			/**
			 * If a column has 100% missing values (i.e. once missing values are excluded there's nothing in the column) 
			 * then we classify it as a "missing" column. 
			 * Such columns do not belong to any of the "levels of measurement" such as nominal or ordinal, 
			 * are treated like they don't exist, 
			 * and don't appear anywhere in the app since they would just take up space. 
			 */
			"pure-missing"

			| "id-integer"

			/**
			 * More than 90% of all NON-missing values are integers
			 * AND number of unique values is less than 50% of the number of total values
			 * Then if the number of distincts among the repeated values are > 25 it's many-distinct, otherwise few-distincts
			 */
			| "repeated-integer-many-distincts"
			| "repeated-integer-few-distincts"

			/**
			 * More than 90% of all NON-missing values are integers
			 * AND number of unique values is more than 50% of number of total values
			 */
			| "pure-integer"

			| "repeated-numeric"
			| "pure-numeric"

			| "repeated-date"
			| "pure-date"

			| "repeated-text"
			| "pure-text"

			/**
			 * Less than 20% of non-missing values are integers or numerical non-integers
			 * Considered mostly non-numerical and will therefore 
			 * not show up when columns are required to be "numerical"
			 * Measurement level is likely "none" 
			 */
			| "barely-numeric"

			/**
			 * No particular export type has more than 90% of all NON-missing values 
			 */
			| "repeated-mixed"
			| "mixed"
		)

		export const enum MeasureLevel {
			/** undefined or unknown measurement level */
			"unknown" = 0,

			/** values that have no measurement level, e.g., free-form text */
			"none" = 1,

			/** values that can't be ordered (you can't say which is bigger), * e.g. "cat", "dog", "bunny" */
			"nominal" = 2,

			/** values that can be ordered, but can't be added or subtracted, e.g. "short", "medium", "tall" */
			"ordinal" = 4,

			/** numerical values that can be subtracted & averaged (e.g. temp in celsius, height in inches, num of pounds, amt of money */
			"interval" = 8
			//ratio = "ratio",
		}

		export namespace Summary {
			export interface Base<T = any> {
				sampleSize: number
				missingCount: number
				uniqueCount: number

				mode?: T

				min?: T
				max?: T
				median?: T
				firstQuartile?: T
				thirdQuartile?: T

				mean?: number
				deviation?: number
				interQuartileRange?: number
			}
			export interface Nominal<T extends Primitive = Primitive> extends Base {
				mode: T
			}
			export interface Ordinal<T extends Primitive = Primitive> extends Nominal<T> {
				min: T
				max: T
				median: T
				firstQuartile: T
				thirdQuartile: T
			}
			export interface Interval extends Ordinal<number> {
				mean: number
				deviation: number
				//firstQuartile: number
				//thirdQuartile: number
				interQuartileRange: number
			}
			export type Any = | Nominal | Ordinal | Interval
		}

		export type Cardinality = "continuous" | "discrete"
		export type SortOrder = "ascending" | "descending" | "none"

		/** Data table */
		export interface Table<T extends Obj = {}> {
			length: number
			idVector: Iterable<number>
			columnVectors: Collection.Enumerable<[keyof T, Collection.MaterialExtended<any>]>
			columnNames: Collection.Ordered<keyof T>
			rowObjects: Iterable<T & { rowId: number }>
			filter(filters?: Iterable<Filter<T>>, options?: any): Table<T>
			sort(args: { columnName: string, order: SortOrder, options?: Obj }): Table<T>
			page(args: { size: number, index: number }): Table<T>
		}

	}

	export namespace Analysis {
		/** Possible names of analysis configuration wizard views */
		export const enum ViewName {
			data = "data",
			goal = "goal",
			summaryColumn = "summaryColumn",
			experimentIntervention = "experimentIntervention",
			experimentEffect = "experimentEffect",
			experimentSettings = "experimentSettings",
			correlationColumns = "correlationColumns",
			correlationSettings = "correlationSettings",
			correlationControl = "correlationControl",
			regressionOutcomeColumns = "regressionOutcomeColumns",
			regressionPredictorColumns = "regressionPredictorColumns",
			regressionSettings = "regressionSettings",
			factorColumns = "factorColumns",
			factorMethods = "factorMethods",
			factorSettings = "factorSettings",
			filtering = "filtering"
		}

		/** Possible analysis goals (used to identify analysis types) */
		/* const enum Goal {
			summary = "summary",
			factors = "factors",
			experiment = "experiment",
			correlation = "correlation",
			regression = "regression"
		}*/

		export type Goal = (
			| "summary"
			| "factors"
			| "experiment"
			| "correlation"
			| "regression"
		)

		/** Basic export type for analysis variables */
		export interface Variable {
			/** Name of column from data-set */
			columnName: string

			/** Statistical role */
			role?: string // "outcome" | "default" | "intervention" | "effect" | "dependent" | "independent" | "control" | "predictor"

			/** Measurement level */
			measureLevel?: Data.MeasureLevel
		}

		/** Possible ways of referring to data to be used for analysis */
		export namespace DataInfo {
			export interface Url {
				data: {
					type: "url"

					/** Name of data-set */
					name?: string

					/** URL of external data */
					//url: string
					url: string
				}
			}
			export interface ActualRows {
				data: {
					type: "rows"

					/** Name of data-set */
					name?: string

					/** Actual data (used to create a stored table) */
					//rows: object[]
					rows: object[]
				}
			}
			export interface ActualColumns {
				data: {
					type: "columns"

					/** Name of data-set */
					name?: string

					/** Actual data (used to create a stored table) */
					//columns: Obj<Data.ParsedValue["effective"][], string> // dict of column vectors
					columns: Obj<Data.ParsedValue["effective"][], string> // dict of column vectors
				}
			}
			export interface Table {
				tableId: string

				/** Id of existing table */
				//tableId: Entities.Table.ForStorage["id"]
				//content: Entities.Table.ForStorage["id"]
			}
			export type Any = Url | ActualRows | ActualColumns | Table
		}

		/** Basic analysis/viz info */
		export type Core<TDataInfo extends DataInfo.Any = Analysis.DataInfo.Any> = Entities.Analysis.Base & {
			[key in "tableId" | "sourceData"]: key extends "tableId"
			? string
			: { name: string } & { asColumns: Obj<any[]> } | { asRows: any[] } | { url: string }
		}

		/** Info sent to API to create analysis metadata on server */
		export interface ForAPI extends Core {
			/** Id of parent project; if unspecified, new project is created */
			projectId?: string

			/** Source data for the analysis */
			dataInfo: DataInfo.Any
		}

		/** General statistical engine; Possible implementations: Local, R */
		export abstract class Engine<D extends DataInfo.Any> {
			/** Execute an analytic/viz operation and return the results */
			// execAsync(args: Core & { fn: string /* Fn to exec: analysis goal, viz name, etc */, dataInfo: D }): Promise<any>
		}

		// /** Analysis info sent to the R (or JS) Engine for performing analyses */
		// export interface ForEngine<> extends Base {
		// 	/** Function (corresponding to analysis goal, viz type, etc.) to execute */
		// 	fn: string,

		// 	/** Data to use for the analysis */
		// 	dataInfo: DataReference.Any
		// }


		// /** Which columns of the data are used, and their statistical roles */
		// variables: Variable[],

		// /** Filters on data as a whole */
		// filters: Data.Filter[],

		// /** Custom settings specific to the function being executed */
		// settings?: Obj

	}
	export type Analysis<D extends Analysis.DataInfo.Any = Analysis.DataInfo.Any> = {
		name: string
		goal: Analysis.Goal
		variables: Array<Analysis.Variable>
		filters?: Data.Filter[],
		settings?: Obj,
	} & D


	export interface Viz<A extends Viz.AxesType = Viz.AxesType, P extends Data.Cardinality = Data.Cardinality, S extends Data.Cardinality = Data.Cardinality> {
		name?: string,
		description?: string,
		helpText?: string,
		legend?: Viz.Legend,

		axesType: A
		cardinalityPrimary: P,
		cardinalitySecondary: S,

		layers: Viz.Layer<A, P, S>[]
		axes: { type: A, primary: Viz.Axis<P>, secondary: Viz.Axis<S> }
	}
	export namespace Viz {
		export type Primitive<T extends Data.Cardinality> = T extends "continuous" ? number : string
		export type AxesType = "cartesian" | "polar"
		export type LegendOption = {
			type: "line" | "dot" | "area" | "none"
			togglable: boolean
			position: "top-left-horizontal" | "top" | "top-right-horizontal" | "top-right-vertical" | "right" | "bottom-right-vertical" | "bottom-right-horizontal" | "bottom" | "bottom-left-horizontal" | "bottom-left-vertical" | "left" | "top-left-vertical"
		}

		export interface Layer<A extends AxesType = AxesType, P extends Data.Cardinality = Data.Cardinality, S extends Data.Cardinality = Data.Cardinality> {
			color?: string
			name: string
			description?: string
			legendOptions?: LegendOption

			axesType: A
			cardinalityPrimary: P
			cardinalitySecondary: S

			mark: (
				{
					type: "line",
					shouldShadeArea?: boolean,
					segmentSeparatorIcon?: Somatic.Renderer<any> //{ radius: number, gap: boolean }
				} | {
					type: "dots",
					icon?: Somatic.Renderer<any> // default is solid circle
				} | {
					type: "bars",

					/** Proportion of bar width used for spacing */
					barSpacingRatio?: number

					/** Relative position of bar on X data point; 0.5 means right in the middle, 0.0 means at the end */
					barPositionRatio?: number
				} | {
					type: "pie",
					radiusInner: number
					radiusOuter: number
				} | {
					type: "candles",
					stroke?: boolean,

					/** Proportion of bar width used for spacing */
					barSpacingRatio?: number
				} | {

					/** A straight line that cross the whole chart without depending on the scales, meaning it's not restricted inside the margins */
					type: "axisLine"
				}
			)

			series: Array<[Primitive<P>, Primitive<S>, number?]>
		}

		export type Axis<T extends Data.Cardinality> = {
			cardinality: T
			label?: string
			tickValues: Primitive<T>[] // nominal or ordinal axis ticks
			tickOptions?: {
				lines?: "default" /* show un-clipped lines */ | { clip?: boolean }
				labels?: "default" /* tick values as labels */ | { suffix?: string, prefix?: string },
				placement?: T extends "continuous"
				? { type: "automatic", min?: number, max?: number, approxCount?: number } // allow d3 to place approx # of ticks automatically
				| { type: "custom", start: number, interval: number, end: number } // manually control tick placement
				: undefined

				/** Whether the tick is shown at the start of its bar (histograms), or in the middle of it (bar charts) */
				alignment?: T extends "continuous" ? undefined : "start" | "middle"
			}
		}

		export interface Legend {
			elements: {
				type: "line" | "dot" | "area",
				color: string,
				label: string
			}[]
		}

		export interface Collection {
			type: "viz"
			name?: string
			visualizations: Viz[]
			masterVizName: string

			/** How the visualizations should be displayed */
			display?:

			/** Shows all of the viz in a flow layout */
			| "side-by-side"

			/** Shows all the viz at the same time, in the same place */
			| "superimposed"

			/** Shows one viz at a time, the choice of which is controlled externaly */
			| "one-at-a-time"
		}

		export type Generator<TSettings> = (
			columns: Array<{
				name: string
				columnType: Data.ColumnType,
				measureLevels: Data.MeasureLevel[]
				vector: Data.ParsedValue[]
			}>,
			settings: TSettings
		) => Viz.Collection
	}

	export namespace Component {
		export interface Theme {
			colors: {
				primary: { // navy
					light: string,
					dark: string
				},
				secondary: { // purple
					light: string,
					dark: string
				},

				error: string,
				warning: string,
				info: string,

				grayish: string,
				whitish: string,
				blackish: string
			}

			fonts: { /* e.g., "italic bold 12px/30px Georgia, serif" */
				text: string
				textAlt?: string
				link?: string
				titleBig?: string
				titleMedium?: string
				titleSmall?: string
				tiny?: string
			}

			thickness: number
		}
		export const enum Alignment {
			start = "start",
			end = "end",
			center = "center",
			stretch = "stretch",
			uniform = "uniform",
			dock = "dock"
		}
		export const enum Orientation {
			vertical = "vertical",
			horizontal = "horizontal"
		}

		export namespace Props {
			export type Html = Partial<Somatic.HTMLAttributes<HTMLElement>>
			export interface Themed { theme: Theme }

			export interface Panel {
				itemsAlignH?: Alignment,
				itemsAlignV?: Alignment,
				orientation?: Orientation | "vertical" | "horizontal"
			}
			export interface View<TData = {}> {
				sourceData: Iterable<TData>
				itemTemplate?: Somatic.Renderer<{ datum: TData, index: number, style?: Somatic.CSSProperties }>
			}
		}

		export type Panel = Somatic.Renderer<Component.Props.Panel>
	}
}

export namespace Somatic {
	//#region Events
	export interface SyntheticEvent<T = Element> {
		bubbles: boolean
		/** A reference to the element on which the event listener is registered. */
		currentTarget: EventTarget & T
		cancelable: boolean
		defaultPrevented: boolean
		eventPhase: number
		isTrusted: boolean
		nativeEvent: Event
		preventDefault(): void
		isDefaultPrevented(): boolean
		stopPropagation(): void
		isPropagationStopped(): boolean
		persist(): void
		// If you thought this should be `EventTarget & T`, see https://github.com/DefinitelyTyped/DefinitelyTyped/pull/12239
		/**
		 * A reference to the element from which the event was originally dispatched.
		 * This might be a child element to the element on which the event listener is registered.
		 *
		 * @see currentTarget
		 */
		target: EventTarget
		timeStamp: number
		type: string
	}
	export interface ClipboardEvent<T = Element> extends SyntheticEvent<T> {
		clipboardData: DataTransfer
		nativeEvent: Event
	}
	export interface CompositionEvent<T = Element> extends SyntheticEvent<T> {
		data: string
		nativeEvent: Event
	}
	export interface DragEvent<T = Element> extends MouseEvent<T> {
		dataTransfer: DataTransfer
		nativeEvent: Event
	}
	export interface PointerEvent<T = Element> extends MouseEvent<T> {
		pointerId: number;
		pressure: number;
		tiltX: number;
		tiltY: number;
		width: number;
		height: number;
		pointerType: 'mouse' | 'pen' | 'touch';
		isPrimary: boolean;
		nativeEvent: Event;
	}
	export interface FocusEvent<T = Element> extends SyntheticEvent<T> {
		nativeEvent: Event;
		relatedTarget: EventTarget;
		target: EventTarget & T;
	}
	export interface FormEvent<T = Element> extends SyntheticEvent<T> {
	}
	export interface InvalidEvent<T = Element> extends SyntheticEvent<T> {
		target: EventTarget & T;
	}
	export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
		target: EventTarget & T;
	}
	export interface KeyboardEvent<T = Element> extends SyntheticEvent<T> {
		altKey: boolean;
		charCode: number;
		ctrlKey: boolean;
		/**
		 * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
		 */
		getModifierState(key: string): boolean;
		/**
		 * See the [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#named-key-attribute-values). for possible values
		 */
		key: string;
		keyCode: number;
		locale: string;
		location: number;
		metaKey: boolean;
		nativeEvent: Event;
		repeat: boolean;
		shiftKey: boolean;
		which: number;
	}
	export interface MouseEvent<T = Element> extends SyntheticEvent<T> {
		altKey: boolean;
		button: number;
		buttons: number;
		clientX: number;
		clientY: number;
		ctrlKey: boolean;
		/**
		 * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
		 */
		getModifierState(key: string): boolean;
		metaKey: boolean;
		nativeEvent: Event;
		pageX: number;
		pageY: number;
		relatedTarget: EventTarget;
		screenX: number;
		screenY: number;
		shiftKey: boolean;
	}
	export interface TouchEvent<T = Element> extends SyntheticEvent<T> {
		altKey: boolean;
		changedTouches: TouchList;
		ctrlKey: boolean;
		/**
		 * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
		 */
		getModifierState(key: string): boolean;
		metaKey: boolean;
		nativeEvent: Event;
		shiftKey: boolean;
		targetTouches: TouchList;
		touches: TouchList;
	}
	export interface UIEvent<T = Element> extends SyntheticEvent<T> {
		detail: number;
		nativeEvent: Event;
		view: {
			styleMedia: StyleMedia;
			document: Document;
		};
	}
	export interface WheelEvent<T = Element> extends MouseEvent<T> {
		deltaMode: number;
		deltaX: number;
		deltaY: number;
		deltaZ: number;
		nativeEvent: Event;
	}
	export interface AnimationEvent<T = Element> extends SyntheticEvent<T> {
		animationName: string;
		elapsedTime: number;
		nativeEvent: Event;
		pseudoElement: string;
	}
	export interface TransitionEvent<T = Element> extends SyntheticEvent<T> {
		elapsedTime: number;
		nativeEvent: Event;
		propertyName: string;
		pseudoElement: string;
	}

	export type EventHandler<E extends SyntheticEvent<any>> = { bivarianceHack(event: E): void }["bivarianceHack"];

	export type ReactEventHandler<T = Element> = EventHandler<SyntheticEvent<T>>;

	export type ClipboardEventHandler<T = Element> = EventHandler<ClipboardEvent<T>>;
	export type CompositionEventHandler<T = Element> = EventHandler<CompositionEvent<T>>;
	export type DragEventHandler<T = Element> = EventHandler<DragEvent<T>>;
	export type FocusEventHandler<T = Element> = EventHandler<FocusEvent<T>>;
	export type FormEventHandler<T = Element> = EventHandler<FormEvent<T>>;
	export type ChangeEventHandler<T = Element> = EventHandler<ChangeEvent<T>>;
	export type KeyboardEventHandler<T = Element> = EventHandler<KeyboardEvent<T>>;
	export type MouseEventHandler<T = Element> = EventHandler<MouseEvent<T>>;
	export type TouchEventHandler<T = Element> = EventHandler<TouchEvent<T>>;
	export type PointerEventHandler<T = Element> = EventHandler<PointerEvent<T>>;
	export type UIEventHandler<T = Element> = EventHandler<UIEvent<T>>;
	export type WheelEventHandler<T = Element> = EventHandler<WheelEvent<T>>;
	export type AnimationEventHandler<T = Element> = EventHandler<AnimationEvent<T>>;
	export type TransitionEventHandler<T = Element> = EventHandler<TransitionEvent<T>>;

	//#endregion

	//#region Attributes
	export interface Attributes { key?: Hypothesize.Key }
	export interface ClassAttributes<T> extends Attributes { }
	export interface DOMAttributes<T> {
		//childrenx?: Somatic.VNode[];
		dangerouslySetInnerHTML?: {
			__html: string;
		}

		// Clipboard Events
		onCopy?: ClipboardEventHandler<T>;
		onCopyCapture?: ClipboardEventHandler<T>;
		onCut?: ClipboardEventHandler<T>;
		onCutCapture?: ClipboardEventHandler<T>;
		onPaste?: ClipboardEventHandler<T>;
		onPasteCapture?: ClipboardEventHandler<T>;

		// Composition Events
		onCompositionEnd?: CompositionEventHandler<T>;
		onCompositionEndCapture?: CompositionEventHandler<T>;
		onCompositionStart?: CompositionEventHandler<T>;
		onCompositionStartCapture?: CompositionEventHandler<T>;
		onCompositionUpdate?: CompositionEventHandler<T>;
		onCompositionUpdateCapture?: CompositionEventHandler<T>;

		// Focus Events
		onFocus?: FocusEventHandler<T>;
		onFocusCapture?: FocusEventHandler<T>;
		onBlur?: FocusEventHandler<T>;
		onBlurCapture?: FocusEventHandler<T>;

		// Form Events
		onChange?: FormEventHandler<T>;
		onChangeCapture?: FormEventHandler<T>;
		onInput?: FormEventHandler<T>;
		onInputCapture?: FormEventHandler<T>;
		onReset?: FormEventHandler<T>;
		onResetCapture?: FormEventHandler<T>;
		onSubmit?: FormEventHandler<T>;
		onSubmitCapture?: FormEventHandler<T>;
		onInvalid?: FormEventHandler<T>;
		onInvalidCapture?: FormEventHandler<T>;

		// Image Events
		onLoad?: ReactEventHandler<T>;
		onLoadCapture?: ReactEventHandler<T>;
		onError?: ReactEventHandler<T>; // also a Media Event
		onErrorCapture?: ReactEventHandler<T>; // also a Media Event

		// Keyboard Events
		onKeyDown?: KeyboardEventHandler<T>;
		onKeyDownCapture?: KeyboardEventHandler<T>;
		onKeyPress?: KeyboardEventHandler<T>;
		onKeyPressCapture?: KeyboardEventHandler<T>;
		onKeyUp?: KeyboardEventHandler<T>;
		onKeyUpCapture?: KeyboardEventHandler<T>;

		// Media Events
		onAbort?: ReactEventHandler<T>;
		onAbortCapture?: ReactEventHandler<T>;
		onCanPlay?: ReactEventHandler<T>;
		onCanPlayCapture?: ReactEventHandler<T>;
		onCanPlayThrough?: ReactEventHandler<T>;
		onCanPlayThroughCapture?: ReactEventHandler<T>;
		onDurationChange?: ReactEventHandler<T>;
		onDurationChangeCapture?: ReactEventHandler<T>;
		onEmptied?: ReactEventHandler<T>;
		onEmptiedCapture?: ReactEventHandler<T>;
		onEncrypted?: ReactEventHandler<T>;
		onEncryptedCapture?: ReactEventHandler<T>;
		onEnded?: ReactEventHandler<T>;
		onEndedCapture?: ReactEventHandler<T>;
		onLoadedData?: ReactEventHandler<T>;
		onLoadedDataCapture?: ReactEventHandler<T>;
		onLoadedMetadata?: ReactEventHandler<T>;
		onLoadedMetadataCapture?: ReactEventHandler<T>;
		onLoadStart?: ReactEventHandler<T>;
		onLoadStartCapture?: ReactEventHandler<T>;
		onPause?: ReactEventHandler<T>;
		onPauseCapture?: ReactEventHandler<T>;
		onPlay?: ReactEventHandler<T>;
		onPlayCapture?: ReactEventHandler<T>;
		onPlaying?: ReactEventHandler<T>;
		onPlayingCapture?: ReactEventHandler<T>;
		onProgress?: ReactEventHandler<T>;
		onProgressCapture?: ReactEventHandler<T>;
		onRateChange?: ReactEventHandler<T>;
		onRateChangeCapture?: ReactEventHandler<T>;
		onSeeked?: ReactEventHandler<T>;
		onSeekedCapture?: ReactEventHandler<T>;
		onSeeking?: ReactEventHandler<T>;
		onSeekingCapture?: ReactEventHandler<T>;
		onStalled?: ReactEventHandler<T>;
		onStalledCapture?: ReactEventHandler<T>;
		onSuspend?: ReactEventHandler<T>;
		onSuspendCapture?: ReactEventHandler<T>;
		onTimeUpdate?: ReactEventHandler<T>;
		onTimeUpdateCapture?: ReactEventHandler<T>;
		onVolumeChange?: ReactEventHandler<T>;
		onVolumeChangeCapture?: ReactEventHandler<T>;
		onWaiting?: ReactEventHandler<T>;
		onWaitingCapture?: ReactEventHandler<T>;

		// MouseEvents
		onClick?: MouseEventHandler<T>;
		onClickCapture?: MouseEventHandler<T>;
		onContextMenu?: MouseEventHandler<T>;
		onContextMenuCapture?: MouseEventHandler<T>;
		onDoubleClick?: MouseEventHandler<T>;
		onDoubleClickCapture?: MouseEventHandler<T>;
		onDrag?: DragEventHandler<T>;
		onDragCapture?: DragEventHandler<T>;
		onDragEnd?: DragEventHandler<T>;
		onDragEndCapture?: DragEventHandler<T>;
		onDragEnter?: DragEventHandler<T>;
		onDragEnterCapture?: DragEventHandler<T>;
		onDragExit?: DragEventHandler<T>;
		onDragExitCapture?: DragEventHandler<T>;
		onDragLeave?: DragEventHandler<T>;
		onDragLeaveCapture?: DragEventHandler<T>;
		onDragOver?: DragEventHandler<T>;
		onDragOverCapture?: DragEventHandler<T>;
		onDragStart?: DragEventHandler<T>;
		onDragStartCapture?: DragEventHandler<T>;
		onDrop?: DragEventHandler<T>;
		onDropCapture?: DragEventHandler<T>;
		onMouseDown?: MouseEventHandler<T>;
		onMouseDownCapture?: MouseEventHandler<T>;
		onMouseEnter?: MouseEventHandler<T>;
		onMouseLeave?: MouseEventHandler<T>;
		onMouseMove?: MouseEventHandler<T>;
		onMouseMoveCapture?: MouseEventHandler<T>;
		onMouseOut?: MouseEventHandler<T>;
		onMouseOutCapture?: MouseEventHandler<T>;
		onMouseOver?: MouseEventHandler<T>;
		onMouseOverCapture?: MouseEventHandler<T>;
		onMouseUp?: MouseEventHandler<T>;
		onMouseUpCapture?: MouseEventHandler<T>;

		// Selection Events
		onSelect?: ReactEventHandler<T>;
		onSelectCapture?: ReactEventHandler<T>;

		// Touch Events
		onTouchCancel?: TouchEventHandler<T>;
		onTouchCancelCapture?: TouchEventHandler<T>;
		onTouchEnd?: TouchEventHandler<T>;
		onTouchEndCapture?: TouchEventHandler<T>;
		onTouchMove?: TouchEventHandler<T>;
		onTouchMoveCapture?: TouchEventHandler<T>;
		onTouchStart?: TouchEventHandler<T>;
		onTouchStartCapture?: TouchEventHandler<T>;

		// Pointer Events
		onPointerDown?: PointerEventHandler<T>;
		onPointerDownCapture?: PointerEventHandler<T>;
		onPointerMove?: PointerEventHandler<T>;
		onPointerMoveCapture?: PointerEventHandler<T>;
		onPointerUp?: PointerEventHandler<T>;
		onPointerUpCapture?: PointerEventHandler<T>;
		onPointerCancel?: PointerEventHandler<T>;
		onPointerCancelCapture?: PointerEventHandler<T>;
		onPointerEnter?: PointerEventHandler<T>;
		onPointerEnterCapture?: PointerEventHandler<T>;
		onPointerLeave?: PointerEventHandler<T>;
		onPointerLeaveCapture?: PointerEventHandler<T>;
		onPointerOver?: PointerEventHandler<T>;
		onPointerOverCapture?: PointerEventHandler<T>;
		onPointerOut?: PointerEventHandler<T>;
		onPointerOutCapture?: PointerEventHandler<T>;
		onGotPointerCapture?: PointerEventHandler<T>;
		onGotPointerCaptureCapture?: PointerEventHandler<T>;
		onLostPointerCapture?: PointerEventHandler<T>;
		onLostPointerCaptureCapture?: PointerEventHandler<T>;

		// UI Events
		onScroll?: UIEventHandler<T>;
		onScrollCapture?: UIEventHandler<T>;

		// Wheel Events
		onWheel?: WheelEventHandler<T>;
		onWheelCapture?: WheelEventHandler<T>;

		// Animation Events
		onAnimationStart?: AnimationEventHandler<T>;
		onAnimationStartCapture?: AnimationEventHandler<T>;
		onAnimationEnd?: AnimationEventHandler<T>;
		onAnimationEndCapture?: AnimationEventHandler<T>;
		onAnimationIteration?: AnimationEventHandler<T>;
		onAnimationIterationCapture?: AnimationEventHandler<T>;

		// Transition Events
		onTransitionEnd?: TransitionEventHandler<T>;
		onTransitionEndCapture?: TransitionEventHandler<T>;
	}
	export interface HTMLAttributes<T> extends DOMAttributes<T> {
		// React-specific Attributes
		defaultChecked?: boolean;
		defaultValue?: string | string[];
		suppressContentEditableWarning?: boolean;
		suppressHydrationWarning?: boolean;

		// Standard HTML Attributes
		accessKey?: string;
		className?: string;
		contentEditable?: boolean;
		contextMenu?: string;
		dir?: string;
		draggable?: boolean;
		hidden?: boolean;
		id?: string;
		lang?: string;
		placeholder?: string;
		slot?: string;
		spellCheck?: boolean;
		style?: CSSProperties;
		tabIndex?: number;
		title?: string;

		// Unknown
		inputMode?: string;
		is?: string;
		radioGroup?: string; // <command>, <menuitem>

		// WAI-ARIA
		role?: string;

		// RDFa Attributes
		about?: string;
		datatype?: string;
		inlist?: any;
		prefix?: string;
		property?: string;
		resource?: string;
		typeof?: string;
		vocab?: string;

		// Non-standard Attributes
		autoCapitalize?: string;
		autoCorrect?: string;
		autoSave?: string;
		color?: string;
		itemProp?: string;
		itemScope?: boolean;
		itemType?: string;
		itemID?: string;
		itemRef?: string;
		results?: number;
		security?: string;
		unselectable?: 'on' | 'off';
	}
	export interface SVGAttributes<T> extends DOMAttributes<T> {
		// Attributes which also defined in HTMLAttributes
		// See comment in SVGDOMPropertyConfig.js
		className?: string;
		color?: string;
		height?: number | string;
		id?: string;
		lang?: string;
		max?: number | string;
		media?: string;
		method?: string;
		min?: number | string;
		name?: string;
		style?: CSSProperties;
		target?: string;
		type?: string;
		width?: number | string;

		// Other HTML properties supported by SVG elements in browsers
		role?: string;
		tabIndex?: number;

		// SVG Specific attributes
		accentHeight?: number | string;
		accumulate?: "none" | "sum";
		additive?: "replace" | "sum";
		alignmentBaseline?: "auto" | "baseline" | "before-edge" | "text-before-edge" | "middle" | "central" | "after-edge" |
		"text-after-edge" | "ideographic" | "alphabetic" | "hanging" | "mathematical" | "inherit";
		allowReorder?: "no" | "yes";
		alphabetic?: number | string;
		amplitude?: number | string;
		arabicForm?: "initial" | "medial" | "terminal" | "isolated";
		ascent?: number | string;
		attributeName?: string;
		attributeType?: string;
		autoReverse?: number | string;
		azimuth?: number | string;
		baseFrequency?: number | string;
		baselineShift?: number | string;
		baseProfile?: number | string;
		bbox?: number | string;
		begin?: number | string;
		bias?: number | string;
		by?: number | string;
		calcMode?: number | string;
		capHeight?: number | string;
		clip?: number | string;
		clipPath?: string;
		clipPathUnits?: number | string;
		clipRule?: number | string;
		colorInterpolation?: number | string;
		colorInterpolationFilters?: "auto" | "sRGB" | "linearRGB" | "inherit";
		colorProfile?: number | string;
		colorRendering?: number | string;
		contentScriptType?: number | string;
		contentStyleType?: number | string;
		cursor?: number | string;
		cx?: number | string;
		cy?: number | string;
		d?: string;
		decelerate?: number | string;
		descent?: number | string;
		diffuseConstant?: number | string;
		direction?: number | string;
		display?: number | string;
		divisor?: number | string;
		dominantBaseline?: number | string;
		dur?: number | string;
		dx?: number | string;
		dy?: number | string;
		edgeMode?: number | string;
		elevation?: number | string;
		enableBackground?: number | string;
		end?: number | string;
		exponent?: number | string;
		externalResourcesRequired?: number | string;
		fill?: string;
		fillOpacity?: number | string;
		fillRule?: "nonzero" | "evenodd" | "inherit";
		filter?: string;
		filterRes?: number | string;
		filterUnits?: number | string;
		floodColor?: number | string;
		floodOpacity?: number | string;
		focusable?: number | string;
		fontFamily?: string;
		fontSize?: number | string;
		fontSizeAdjust?: number | string;
		fontStretch?: number | string;
		fontStyle?: number | string;
		fontVariant?: number | string;
		fontWeight?: number | string;
		format?: number | string;
		from?: number | string;
		fx?: number | string;
		fy?: number | string;
		g1?: number | string;
		g2?: number | string;
		glyphName?: number | string;
		glyphOrientationHorizontal?: number | string;
		glyphOrientationVertical?: number | string;
		glyphRef?: number | string;
		gradientTransform?: string;
		gradientUnits?: string;
		hanging?: number | string;
		horizAdvX?: number | string;
		horizOriginX?: number | string;
		href?: string;
		ideographic?: number | string;
		imageRendering?: number | string;
		in2?: number | string;
		in?: string;
		intercept?: number | string;
		k1?: number | string;
		k2?: number | string;
		k3?: number | string;
		k4?: number | string;
		k?: number | string;
		kernelMatrix?: number | string;
		kernelUnitLength?: number | string;
		kerning?: number | string;
		keyPoints?: number | string;
		keySplines?: number | string;
		keyTimes?: number | string;
		lengthAdjust?: number | string;
		letterSpacing?: number | string;
		lightingColor?: number | string;
		limitingConeAngle?: number | string;
		local?: number | string;
		markerEnd?: string;
		markerHeight?: number | string;
		markerMid?: string;
		markerStart?: string;
		markerUnits?: number | string;
		markerWidth?: number | string;
		mask?: string;
		maskContentUnits?: number | string;
		maskUnits?: number | string;
		mathematical?: number | string;
		mode?: number | string;
		numOctaves?: number | string;
		offset?: number | string;
		opacity?: number | string;
		operator?: number | string;
		order?: number | string;
		orient?: number | string;
		orientation?: number | string;
		origin?: number | string;
		overflow?: number | string;
		overlinePosition?: number | string;
		overlineThickness?: number | string;
		paintOrder?: number | string;
		panose1?: number | string;
		pathLength?: number | string;
		patternContentUnits?: string;
		patternTransform?: number | string;
		patternUnits?: string;
		pointerEvents?: number | string;
		points?: string;
		pointsAtX?: number | string;
		pointsAtY?: number | string;
		pointsAtZ?: number | string;
		preserveAlpha?: number | string;
		preserveAspectRatio?: string;
		primitiveUnits?: number | string;
		r?: number | string;
		radius?: number | string;
		refX?: number | string;
		refY?: number | string;
		renderingIntent?: number | string;
		repeatCount?: number | string;
		repeatDur?: number | string;
		requiredExtensions?: number | string;
		requiredFeatures?: number | string;
		restart?: number | string;
		result?: string;
		rotate?: number | string;
		rx?: number | string;
		ry?: number | string;
		scale?: number | string;
		seed?: number | string;
		shapeRendering?: number | string;
		slope?: number | string;
		spacing?: number | string;
		specularConstant?: number | string;
		specularExponent?: number | string;
		speed?: number | string;
		spreadMethod?: string;
		startOffset?: number | string;
		stdDeviation?: number | string;
		stemh?: number | string;
		stemv?: number | string;
		stitchTiles?: number | string;
		stopColor?: string;
		stopOpacity?: number | string;
		strikethroughPosition?: number | string;
		strikethroughThickness?: number | string;
		string?: number | string;
		stroke?: string;
		strokeDasharray?: string | number;
		strokeDashoffset?: string | number;
		strokeLinecap?: "butt" | "round" | "square" | "inherit";
		strokeLinejoin?: "miter" | "round" | "bevel" | "inherit";
		strokeMiterlimit?: number | string;
		strokeOpacity?: number | string;
		strokeWidth?: number | string;
		surfaceScale?: number | string;
		systemLanguage?: number | string;
		tableValues?: number | string;
		targetX?: number | string;
		targetY?: number | string;
		textAnchor?: string;
		textDecoration?: number | string;
		textLength?: number | string;
		textRendering?: number | string;
		to?: number | string;
		transform?: string;
		u1?: number | string;
		u2?: number | string;
		underlinePosition?: number | string;
		underlineThickness?: number | string;
		unicode?: number | string;
		unicodeBidi?: number | string;
		unicodeRange?: number | string;
		unitsPerEm?: number | string;
		vAlphabetic?: number | string;
		values?: string;
		vectorEffect?: number | string;
		version?: string;
		vertAdvY?: number | string;
		vertOriginX?: number | string;
		vertOriginY?: number | string;
		vHanging?: number | string;
		vIdeographic?: number | string;
		viewBox?: string;
		viewTarget?: number | string;
		visibility?: number | string;
		vMathematical?: number | string;
		widths?: number | string;
		wordSpacing?: number | string;
		writingMode?: number | string;
		x1?: number | string;
		x2?: number | string;
		x?: number | string;
		xChannelSelector?: string;
		xHeight?: number | string;
		xlinkActuate?: string;
		xlinkArcrole?: string;
		xlinkHref?: string;
		xlinkRole?: string;
		xlinkShow?: string;
		xlinkTitle?: string;
		xlinkType?: string;
		xmlBase?: string;
		xmlLang?: string;
		xmlns?: string;
		xmlnsXlink?: string;
		xmlSpace?: string;
		y1?: number | string;
		y2?: number | string;
		y?: number | string;
		yChannelSelector?: string;
		z?: number | string;
		zoomAndPan?: string;
	}
	export interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
		download?: any;
		href?: string;
		hrefLang?: string;
		media?: string;
		rel?: string;
		target?: string;
		type?: string;
	}
	export interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> { }
	export interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
		alt?: string;
		coords?: string;
		download?: any;
		href?: string;
		hrefLang?: string;
		media?: string;
		rel?: string;
		shape?: string;
		target?: string;
	}
	export interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
		href?: string;
		target?: string;
	}
	export interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
		cite?: string;
	}
	export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
		autoFocus?: boolean;
		disabled?: boolean;
		form?: string;
		formAction?: string;
		formEncType?: string;
		formMethod?: string;
		formNoValidate?: boolean;
		formTarget?: string;
		name?: string;
		type?: string;
		value?: string | string[] | number;
	}
	export interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
		height?: number | string;
		width?: number | string;
	}
	export interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
		span?: number;
		width?: number | string;
	}
	export interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
		span?: number;
	}
	export interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
		open?: boolean;
	}
	export interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
		cite?: string;
		dateTime?: string;
	}
	export interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
		open?: boolean;
	}
	export interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
		height?: number | string;
		src?: string;
		type?: string;
		width?: number | string;
	}
	export interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
		disabled?: boolean;
		form?: string;
		name?: string;
	}
	export interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
		acceptCharset?: string;
		action?: string;
		autoComplete?: string;
		encType?: string;
		method?: string;
		name?: string;
		noValidate?: boolean;
		target?: string;
	}
	export interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
		manifest?: string;
	}
	export interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
		allow?: string;
		allowFullScreen?: boolean;
		allowTransparency?: boolean;
		frameBorder?: number | string;
		height?: number | string;
		marginHeight?: number;
		marginWidth?: number;
		name?: string;
		sandbox?: string;
		scrolling?: string;
		seamless?: boolean;
		src?: string;
		srcDoc?: string;
		width?: number | string;
	}
	export interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
		alt?: string;
		crossOrigin?: "anonymous" | "use-credentials" | "";
		decoding?: "async" | "auto" | "sync";
		height?: number | string;
		sizes?: string;
		src?: string;
		srcSet?: string;
		useMap?: string;
		width?: number | string;
	}
	export interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
		cite?: string;
		dateTime?: string;
	}
	export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
		accept?: string;
		alt?: string;
		autoComplete?: string;
		autoFocus?: boolean;
		capture?: boolean | string; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
		checked?: boolean;
		crossOrigin?: string;
		disabled?: boolean;
		form?: string;
		formAction?: string;
		formEncType?: string;
		formMethod?: string;
		formNoValidate?: boolean;
		formTarget?: string;
		height?: number | string;
		list?: string;
		max?: number | string;
		maxLength?: number;
		min?: number | string;
		minLength?: number;
		multiple?: boolean;
		name?: string;
		pattern?: string;
		placeholder?: string;
		readOnly?: boolean;
		required?: boolean;
		size?: number;
		src?: string;
		step?: number | string;
		type?: string;
		value?: string | string[] | number;
		width?: number | string;

		onChange?: ChangeEventHandler<T>;
	}
	export interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
		autoFocus?: boolean;
		challenge?: string;
		disabled?: boolean;
		form?: string;
		keyType?: string;
		keyParams?: string;
		name?: string;
	}
	export interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
		form?: string;
		htmlFor?: string;
	}
	export interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
		value?: string | string[] | number;
	}
	export interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
		as?: string;
		crossOrigin?: string;
		href?: string;
		hrefLang?: string;
		integrity?: string;
		media?: string;
		rel?: string;
		sizes?: string;
		type?: string;
	}
	export interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
		name?: string;
	}
	export interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
		type?: string;
	}
	export interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
		autoPlay?: boolean;
		controls?: boolean;
		controlsList?: string;
		crossOrigin?: string;
		loop?: boolean;
		mediaGroup?: string;
		muted?: boolean;
		playsinline?: boolean;
		preload?: string;
		src?: string;
	}
	export interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
		charSet?: string;
		content?: string;
		httpEquiv?: string;
		name?: string;
	}
	export interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
		form?: string;
		high?: number;
		low?: number;
		max?: number | string;
		min?: number | string;
		optimum?: number;
		value?: string | string[] | number;
	}
	export interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
		cite?: string;
	}
	export interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
		classID?: string;
		data?: string;
		form?: string;
		height?: number | string;
		name?: string;
		type?: string;
		useMap?: string;
		width?: number | string;
		wmode?: string;
	}
	export interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
		reversed?: boolean;
		start?: number;
		type?: '1' | 'a' | 'A' | 'i' | 'I';
	}
	export interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
		disabled?: boolean;
		label?: string;
	}
	export interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
		disabled?: boolean;
		label?: string;
		selected?: boolean;
		value?: string | string[] | number;
	}
	export interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
		form?: string;
		htmlFor?: string;
		name?: string;
	}
	export interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
		name?: string;
		value?: string | string[] | number;
	}
	export interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
		max?: number | string;
		value?: string | string[] | number;
	}
	export interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
		async?: boolean;
		charSet?: string;
		crossOrigin?: string;
		defer?: boolean;
		integrity?: string;
		noModule?: boolean;
		nonce?: string;
		src?: string;
		type?: string;
	}
	export interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
		autoComplete?: string;
		autoFocus?: boolean;
		disabled?: boolean;
		form?: string;
		multiple?: boolean;
		name?: string;
		required?: boolean;
		size?: number;
		value?: string | string[] | number;
		onChange?: ChangeEventHandler<T>;
	}
	export interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
		media?: string;
		sizes?: string;
		src?: string;
		srcSet?: string;
		type?: string;
	}
	export interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
		media?: string;
		nonce?: string;
		scoped?: boolean;
		type?: string;
	}
	export interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
		cellPadding?: number | string;
		cellSpacing?: number | string;
		summary?: string;
	}
	export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
		autoComplete?: string;
		autoFocus?: boolean;
		cols?: number;
		dirName?: string;
		disabled?: boolean;
		form?: string;
		maxLength?: number;
		minLength?: number;
		name?: string;
		placeholder?: string;
		readOnly?: boolean;
		required?: boolean;
		rows?: number;
		value?: string | string[] | number;
		wrap?: string;

		onChange?: ChangeEventHandler<T>;
	}
	export interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
		align?: "left" | "center" | "right" | "justify" | "char";
		colSpan?: number;
		headers?: string;
		rowSpan?: number;
		scope?: string;
	}
	export interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
		align?: "left" | "center" | "right" | "justify" | "char";
		colSpan?: number;
		headers?: string;
		rowSpan?: number;
		scope?: string;
	}
	export interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
		dateTime?: string;
	}
	export interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
		default?: boolean;
		kind?: string;
		label?: string;
		src?: string;
		srcLang?: string;
	}
	export interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
		height?: number | string;
		playsInline?: boolean;
		poster?: string;
		width?: number | string;
	}
	export interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
		allowFullScreen?: boolean;
		allowpopups?: boolean;
		autoFocus?: boolean;
		autosize?: boolean;
		blinkfeatures?: string;
		disableblinkfeatures?: string;
		disableguestresize?: boolean;
		disablewebsecurity?: boolean;
		guestinstance?: string;
		httpreferrer?: string;
		nodeintegration?: boolean;
		partition?: string;
		plugins?: boolean;
		preload?: string;
		src?: string;
		useragent?: string;
		webpreferences?: string;
	}
	//#endregion

	export interface CSSProperties {
		alignContent?: string | null;
		alignItems?: string | null;
		alignSelf?: string | null;
		alignmentBaseline?: string | null;
		animation?: string | null;
		animationDelay?: string | null;
		animationDirection?: string | null;
		animationDuration?: string | null;
		animationFillMode?: string | null;
		animationIterationCount?: string | null;
		animationName?: string | null;
		animationPlayState?: string | null;
		animationTimingFunction?: string | null;
		backfaceVisibility?: string | null;
		background?: string | null;
		backgroundAttachment?: string | null;
		backgroundClip?: string | null;
		backgroundColor?: string | null;
		backgroundImage?: string | null;
		backgroundOrigin?: string | null;
		backgroundPosition?: string | null;
		backgroundPositionX?: string | null;
		backgroundPositionY?: string | null;
		backgroundRepeat?: string | null;
		backgroundSize?: string | null;
		baselineShift?: string | null;
		border?: string | null;
		borderBottom?: string | null;
		borderBottomColor?: string | null;
		borderBottomLeftRadius?: string | number | null;
		borderBottomRightRadius?: string | number | null;
		borderBottomStyle?: string | null;
		borderBottomWidth?: string | null;
		borderCollapse?: string | null;
		borderColor?: string | null;
		borderImage?: string | null;
		borderImageOutset?: string | null;
		borderImageRepeat?: string | null;
		borderImageSlice?: string | null;
		borderImageSource?: string | null;
		borderImageWidth?: string | number | null;
		borderLeft?: string | number | null;
		borderLeftColor?: string | null;
		borderLeftStyle?: string | null;
		borderLeftWidth?: string | number | null;
		borderRadius?: string | number | null;
		borderRight?: string | null;
		borderRightColor?: string | null;
		borderRightStyle?: string | null;
		borderRightWidth?: string | number | null;
		borderSpacing?: string | null;
		borderStyle?: string | null;
		borderTop?: string | null;
		borderTopColor?: string | null;
		borderTopLeftRadius?: string | number | null;
		borderTopRightRadius?: string | number | null;
		borderTopStyle?: string | null;
		borderTopWidth?: string | number | null;
		borderWidth?: string | number | null;
		bottom?: string | number | null;
		boxShadow?: string | null;
		boxSizing?: string | null;
		breakAfter?: string | null;
		breakBefore?: string | null;
		breakInside?: string | null;
		captionSide?: string | null;
		clear?: string | null;
		clip?: string | null;
		clipPath?: string | null;
		clipRule?: string | null;
		color?: string | null;
		colorInterpolationFilters?: string | null;
		columnCount?: any;
		columnFill?: string | null;
		columnGap?: any;
		columnRule?: string | null;
		columnRuleColor?: any;
		columnRuleStyle?: string | null;
		columnRuleWidth?: any;
		columnSpan?: string | null;
		columnWidth?: any;
		columns?: string | null;
		content?: string | null;
		counterIncrement?: string | null;
		counterReset?: string | null;
		cssFloat?: string | null;
		float?: string | null;
		cssText?: string;
		cursor?: string | null;
		direction?: string | null;
		display?: string | null;
		dominantBaseline?: string | null;
		emptyCells?: string | null;
		enableBackground?: string | null;
		fill?: string | null;
		fillOpacity?: string | null;
		fillRule?: string | null;
		filter?: string | null;
		flex?: string | null;
		flexBasis?: string | null;
		flexDirection?: string | null;
		flexFlow?: string | number | null;
		flexGrow?: string | number | null;
		flexShrink?: string | number | null;
		flexWrap?: string | null;
		floodColor?: string | null;
		floodOpacity?: string | number | null;
		font?: string | null;
		fontFamily?: string | null;
		fontFeatureSettings?: string | null;
		fontSize?: string | null;
		fontSizeAdjust?: string | null;
		fontStretch?: string | null;
		fontStyle?: string | null;
		fontVariant?: string | null;
		fontWeight?: string | number | null;
		glyphOrientationHorizontal?: string | null;
		glyphOrientationVertical?: string | null;
		height?: string | null;
		imeMode?: string | null;
		justifyContent?: string | null;
		kerning?: string | null;
		left?: string | number | null;
		readonly length?: number;
		letterSpacing?: string | null;
		lightingColor?: string | null;
		lineHeight?: string | null;
		listStyle?: string | null;
		listStyleImage?: string | null;
		listStylePosition?: string | null;
		listStyleType?: string | null;
		margin?: string | number | null;
		marginBottom?: string | number | null;
		marginLeft?: string | number | null;
		marginRight?: string | number | null;
		marginTop?: string | number | null;
		marker?: string | null;
		markerEnd?: string | null;
		markerMid?: string | null;
		markerStart?: string | null;
		mask?: string | null;
		maxHeight?: string | null;
		maxWidth?: string | null;
		minHeight?: string | null;
		minWidth?: string | null;
		msContentZoomChaining?: string | null;
		msContentZoomLimit?: string | null;
		msContentZoomLimitMax?: any;
		msContentZoomLimitMin?: any;
		msContentZoomSnap?: string | null;
		msContentZoomSnapPoints?: string | null;
		msContentZoomSnapType?: string | null;
		msContentZooming?: string | null;
		msFlowFrom?: string | null;
		msFlowInto?: string | null;
		msFontFeatureSettings?: string | null;
		msGridColumn?: any;
		msGridColumnAlign?: string | null;
		msGridColumnSpan?: any;
		msGridColumns?: string | null;
		msGridRow?: any;
		msGridRowAlign?: string | null;
		msGridRowSpan?: any;
		msGridRows?: string | null;
		msHighContrastAdjust?: string | null;
		msHyphenateLimitChars?: string | null;
		msHyphenateLimitLines?: any;
		msHyphenateLimitZone?: any;
		msHyphens?: string | null;
		msImeAlign?: string | null;
		msOverflowStyle?: string | null;
		msScrollChaining?: string | null;
		msScrollLimit?: string | null;
		msScrollLimitXMax?: any;
		msScrollLimitXMin?: any;
		msScrollLimitYMax?: any;
		msScrollLimitYMin?: any;
		msScrollRails?: string | null;
		msScrollSnapPointsX?: string | null;
		msScrollSnapPointsY?: string | null;
		msScrollSnapType?: string | null;
		msScrollSnapX?: string | null;
		msScrollSnapY?: string | null;
		msScrollTranslation?: string | null;
		msTextCombineHorizontal?: string | null;
		msTextSizeAdjust?: any;
		msTouchAction?: string | null;
		msTouchSelect?: string | null;
		msUserSelect?: string | null;
		msWrapFlow?: string;
		msWrapMargin?: any;
		msWrapThrough?: string;
		opacity?: string | number | null;
		order?: string | null;
		orphans?: string | null;
		outline?: string | null;
		outlineColor?: string | null;
		outlineStyle?: string | null;
		outlineWidth?: string | null;
		overflow?: string | null;
		overflowX?: string | null;
		overflowY?: string | null;
		padding?: string | number | null;
		paddingBottom?: string | number | null;
		paddingLeft?: string | number | null;
		paddingRight?: string | number | null;
		paddingTop?: string | number | null;
		pageBreakAfter?: string | null;
		pageBreakBefore?: string | null;
		pageBreakInside?: string | null;
		perspective?: string | null;
		perspectiveOrigin?: string | null;
		pointerEvents?: string | null;
		position?: "static" /*default*/ | "fixed" | "absolute" | "relative" | "sticky" | null;
		quotes?: string | null;
		right?: string | number | null;
		rubyAlign?: string | null;
		rubyOverhang?: string | null;
		rubyPosition?: string | null;
		stopColor?: string | null;
		stopOpacity?: string | null;
		stroke?: string | null;
		strokeDasharray?: string | null;
		strokeDashoffset?: string | null;
		strokeLinecap?: string | null;
		strokeLinejoin?: string | null;
		strokeMiterlimit?: string | number | null;
		strokeOpacity?: string | null;
		strokeWidth?: string | number | null;
		tableLayout?: string | null;
		textAlign?: string | null;
		textAlignLast?: string | null;
		textAnchor?: string | null;
		textDecoration?: string | null;
		textIndent?: string | number | null;
		textJustify?: string | null;
		textKashida?: string | null;
		textKashidaSpace?: string | null;
		textOverflow?: string | null;
		textShadow?: string | null;
		textTransform?: string | null;
		textUnderlinePosition?: string | null;
		top?: string | number | null;
		touchAction?: string | null;
		transform?: string | null;
		transformOrigin?: string | null;
		transformStyle?: string | null;
		transition?: string | null;
		transitionDelay?: string | null;
		transitionDuration?: string | null;
		transitionProperty?: string | null;
		transitionTimingFunction?: string | null;
		unicodeBidi?: string | null;
		verticalAlign?: string | null;
		visibility?: string | null;
		webkitAlignContent?: string | null;
		webkitAlignItems?: string | null;
		webkitAlignSelf?: string | null;
		webkitAnimation?: string | null;
		webkitAnimationDelay?: string | null;
		webkitAnimationDirection?: string | null;
		webkitAnimationDuration?: string | null;
		webkitAnimationFillMode?: string | null;
		webkitAnimationIterationCount?: string | null;
		webkitAnimationName?: string | null;
		webkitAnimationPlayState?: string | null;
		webkitAnimationTimingFunction?: string | null;
		webkitAppearance?: string | null;
		webkitBackfaceVisibility?: string | null;
		webkitBackgroundClip?: string | null;
		webkitBackgroundOrigin?: string | null;
		webkitBackgroundSize?: string | null;
		webkitBorderBottomLeftRadius?: string | null;
		webkitBorderBottomRightRadius?: string | null;
		webkitBorderImage?: string | null;
		webkitBorderRadius?: string | null;
		webkitBorderTopLeftRadius?: string | number | null;
		webkitBorderTopRightRadius?: string | number | null;
		webkitBoxAlign?: string | null;
		webkitBoxDirection?: string | null;
		webkitBoxFlex?: string | null;
		webkitBoxOrdinalGroup?: string | null;
		webkitBoxOrient?: string | null;
		webkitBoxPack?: string | null;
		webkitBoxSizing?: string | null;
		webkitColumnBreakAfter?: string | null;
		webkitColumnBreakBefore?: string | null;
		webkitColumnBreakInside?: string | null;
		webkitColumnCount?: any;
		webkitColumnGap?: any;
		webkitColumnRule?: string | null;
		webkitColumnRuleColor?: any;
		webkitColumnRuleStyle?: string | null;
		webkitColumnRuleWidth?: any;
		webkitColumnSpan?: string | null;
		webkitColumnWidth?: any;
		webkitColumns?: string | null;
		webkitFilter?: string | null;
		webkitFlex?: string | null;
		webkitFlexBasis?: string | null;
		webkitFlexDirection?: string | null;
		webkitFlexFlow?: string | null;
		webkitFlexGrow?: string | null;
		webkitFlexShrink?: string | null;
		webkitFlexWrap?: string | null;
		webkitJustifyContent?: string | null;
		webkitOrder?: string | null;
		webkitPerspective?: string | null;
		webkitPerspectiveOrigin?: string | null;
		webkitTapHighlightColor?: string | null;
		webkitTextFillColor?: string | null;
		webkitTextSizeAdjust?: any;
		webkitTransform?: string | null;
		webkitTransformOrigin?: string | null;
		webkitTransformStyle?: string | null;
		webkitTransition?: string | null;
		webkitTransitionDelay?: string | null;
		webkitTransitionDuration?: string | null;
		webkitTransitionProperty?: string | null;
		webkitTransitionTimingFunction?: string | null;
		webkitUserModify?: string | null;
		webkitUserSelect?: string | null;
		webkitWritingMode?: string | null;
		whiteSpace?: string | null;
		widows?: string | null;
		width?: string | null;
		wordBreak?: string | null;
		wordSpacing?: string | null;
		wordWrap?: string | null;
		writingMode?: string | null;
		zIndex?: string | number | null;
		zoom?: string | null;
	}

	export type VNodeType<P = any> = Renderer<P> /* component */ | string /* intrinsic elt */
	export interface VNode<P = any, T extends VNodeType<P> = VNodeType<P>> {
		type: T
		props: P
		children?: ({ toString(): string } | VNode<any>)[]
	}

	export interface DOMElement<Attr extends HTMLAttributes<Elt> | SVGAttributes<Elt>, Elt extends Element> extends VNode<Attr, string> {
		//type: string
	}
	export type DOMFactory<Attr extends DOMAttributes<Elt>, Elt extends Element> = (
		props?: ClassAttributes<Elt> & Attr | null,
		...children: VNode[]
	) => DOMElement<Attr, Elt>

	/** General message export type */
	export interface Message { type: string, data?: unknown }

	/** A change to internal part of a component's props (state) that does not need to be handled in any specific way. 
	 * Since somatic components are renderers (i.e., stateless), the typical response to this message 
	 * is to update an external props store for the component with the change, 
	 * so that the next invocation of the component can use the updated data
	 */
	export interface InternalPropsChangeMsg<P> extends Message { type: "internal-state-change", data: { delta: Hypothesize.RecursivePartial<P> } }


	/** Async function that defines a renderer (stateless functional) component */
	export type Renderer<Props extends Hypothesize.Obj = Hypothesize.Obj, Msg extends Message = Message> = (props: PropsExtended<Props, Msg>) => JSX.Element

	/** Props (including state) passed to renderer, as args, on each invocation */
	export type PropsExtended<PropsCore extends Hypothesize.Obj, Msg extends Message = Message> = PropsCore & {
		/** Child content of the renderer */
		children?: JSX.Element[],

		/** Callback for posting messages from the content generated by renderer */
		postMsgAsync?: (message: Msg) => Promise<any>
	}

	//const Fragment: Somatic.Renderer<any>
}

export namespace JSX {
	//export type Element = Promise<Somatic.VNode>
	export type Element = Promise<Somatic.VNode>

	export interface IntrinsicElements {
		html: Somatic.HtmlHTMLAttributes<HTMLHeadingElement>,
		div: Somatic.HTMLAttributes<HTMLDivElement>,
		h1: Somatic.HTMLAttributes<HTMLHeadingElement>,
		h2: Somatic.HTMLAttributes<HTMLHeadingElement>,
		h3: Somatic.HTMLAttributes<HTMLHeadingElement>,
		br: Somatic.HtmlHTMLAttributes<HTMLBRElement>,
		i: Somatic.HtmlHTMLAttributes<HTMLElement>,
		b: Somatic.HtmlHTMLAttributes<HTMLElement>,
		p: Somatic.HtmlHTMLAttributes<HTMLParagraphElement>,
		li: Somatic.LiHTMLAttributes<HTMLLIElement>,
		ul: Somatic.HTMLAttributes<HTMLUListElement>,
		ol: Somatic.OlHTMLAttributes<HTMLOListElement>,
		a: Somatic.AnchorHTMLAttributes<HTMLAnchorElement>,
		select: Somatic.SelectHTMLAttributes<HTMLSelectElement>
		button: Somatic.ButtonHTMLAttributes<HTMLButtonElement>
		input: Somatic.InputHTMLAttributes<HTMLInputElement>;
		label: Somatic.LabelHTMLAttributes<HTMLLabelElement>,
		span: Somatic.HTMLAttributes<HTMLSpanElement>,
		optgroup: Somatic.OptgroupHTMLAttributes<HTMLOptGroupElement>,
		option: Somatic.OptionHTMLAttributes<HTMLOptionElement>,
		style: Somatic.StyleHTMLAttributes<HTMLStyleElement>,

		/* svg */
		svg: Somatic.SVGAttributes<SVGSVGElement>,
		g: Somatic.SVGAttributes<SVGGElement>,
		circle: Somatic.SVGAttributes<SVGCircleElement>,
		animate: Somatic.SVGAttributes<SVGAnimateElement>,
		animateTransform: Somatic.SVGAttributes<SVGAnimateTransformElement>,
		rect: Somatic.SVGAttributes<SVGRectElement>,
		line: Somatic.SVGAttributes<SVGLineElement>,
		polyline: Somatic.SVGAttributes<SVGPolylineElement>,
		path: Somatic.SVGAttributes<SVGPathElement>,
		polygon: Somatic.SVGAttributes<SVGPolygonElement>,
		title: Somatic.SVGAttributes<SVGTitleElement>,
		switch: Somatic.SVGAttributes<SVGSwitchElement>,
		desc: Somatic.SVGAttributes<SVGDescElement>,
		foreignObject: Somatic.SVGAttributes<SVGForeignObjectElement>,
		text: Somatic.SVGAttributes<SVGTextElement>,

	}
}