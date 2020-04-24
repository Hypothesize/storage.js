import { cloneDeep, mergeWith } from "lodash"
import { Hypothesize } from "./repository"

// import * as shortid from "shortid"
type Obj<TValue = any, TKey extends string = string> = { [key in TKey]: TValue }
type Primitive = number | string /*| boolean*/ | Date
type Omit<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };

export type Comparer<X = any, Y = number> = (a?: X, b?: X) => Y
export type Projector<X = any, Y = any, I = number> = (value: X, index?: I) => Y;
export type AsyncProjector<X = any, Y = any, I = number> = (value: X, index?: I) => Promise<Tuple<I, Y>>;
export type Predicate<X = any, I = number> = (value: X, index?: I) => boolean;
export type Reducer<X = any, Y = any, I = number> = (prev: Y, current: X, index?: I, collection?: Iterable<X>) => Y;

export interface KeyValuePair<TKey = any, TValue = any> { key: TKey, value: TValue }
export type Tuple<X, Y> = [X, Y]
export const Tuple = class <X, Y>  {
	constructor(x: X, y: Y) {
		return [x, y] as Tuple<X, Y>
	}
} as { new <X, Y>(x: X, y: Y): [X, Y] }

export class Object__ extends global.Object {
	static keys<T extends object>(obj: T): (keyof T)[]
	static keys<K extends string = string>(obj: Obj<any, K>): K[]
	static keys<K extends string = string>(obj: {}): string[]
	static keys<K extends string = string>(obj: {} | Obj<any, K>) {
		return super.keys(obj) //as K[]
	}

	static omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
		let result = obj
		keys.forEach(k => delete result[k])
		return result
	}
	static pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
		let result = {} as Pick<T, K>
		keys.forEach(k => result[k] = obj[k])
		return result
	}

	static clone<T>(value: T/*, maxDepth: number = 7, depth: number = 0*/): T {
		return cloneDeep(value)
	}

	static hasValue(value: any): boolean {
		if (typeof value === "undefined") return false;
		if (value === undefined) return false;
		if (value === null) return false;

		let str = value.toString() as string

		if (str.trim().length === 0) return false;
		if (/^\s*$/.test(str)) return false
		//if(str.replace(/\s/g,"") == "") return false
		return true
	}
	static shallowEquals(obj1: any, obj2: any, ignoreUnmatchedProps = false) {
		// let x = typeof obj1

		if (typeof obj1 !== typeof obj2) {
			return false
		}
		else if (typeof obj1 === "function") {
			return obj1.toString() === obj2.toString()
		}
		else if (typeof obj1 !== "object") {
			return obj1 === obj2
		}
		else {
			let keysToCheck = ignoreUnmatchedProps
				? Set__.intersection([new Set__(Object.keys(obj1)), new Set__(Object.keys(obj2))])
				: Set__.union([new Set__(Object.keys(obj1)), new Set__(Object.keys(obj2))])

			return keysToCheck.every(key => obj1[key] === obj2[key])
		}
	}
	static fromKeyValues<T>(...keyValues: Tuple<string, T>[]) {
		let obj = {} as Obj<T>
		keyValues.forEach(kvp => {
			obj[kvp[0]] = kvp[1]
		})

		return obj
	}
	static duplicateKeys<T>(obj: Obj, defaultValue: T) {
		let _obj = {} as Obj<T>
		Object.keys(obj).forEach(key => _obj[key] = defaultValue)
		return _obj
	}

    /**
     * gets a pseudo-random unused key on an object
     */

	// static getUnusedKey(obj: Obj) {
	//     let key = shortid.generate()
	//     while (obj[key])
	//         key = shortid.generate()

	//     return key
	// }

	static merge<X>(target: X, source: Partial<X> | undefined | null): X
	static merge<X>(target: Partial<X> | undefined | null, source: X): X
	static merge<X>(target: X, source: undefined | null): X
	static merge<X>(target: undefined | null, source: X): X
	static merge<X, Y>(target: X, source: Y): X & Y

    /**
     * Merges source onto target
     * Returns a new object only if the resulting content will be different from both taget and source
     * 
     */
	static merge<X, Y>(target: X, source: Y): X | Y | X & Y {
		if (target === null || target === undefined)
			return source as Y
		//return Object__.clone(source) as Y
		else if (source === null || source === undefined)
			// return target as X
			return Object__.clone(target) as X
		else if (typeof source !== "object" || typeof target !== "object")
			// return source as Y
			return Object__.clone(source) as Y
		else {
			let result = Object__.clone(target)
			// let result = { ...target as any as object } as X
			return mergeWith(result, source, (objValue, srcValue) => {
				if (Array.isArray(objValue)) {
					if (srcValue === undefined)
						return objValue
					else
						return srcValue
				}
			})

			// => { 'a': [1, 3], 'b': [2, 4] }

			// for (var srcKey in source) {
			//     let merged = false
			//     for (var tgtKey in result) {
			//         if (srcKey.toString() === tgtKey.toString()) {

			//             try {
			//                 result[tgtKey] = Object__.merge(result[tgtKey], source[srcKey])
			//                 merged = true
			//             }
			//             catch (e) {
			//                 console.error(`Object.merge: Error merging key "${tgtKey}": ${e}`)
			//                 throw e
			//             }
			//         }
			//     }

			//     if (merged === false)
			//         (result as any)[srcKey] = source[srcKey]
			// }
			// return result
		}
	}

	static isIterable(val: any) {
		return val !== null &&
			val !== undefined &&
			typeof val[Symbol.iterator] === 'function'
	}
}

export class String__ extends String {
	constructor(str: string) {
		super(str)
	}

	isWhiteSpace(): boolean {
		return this.replace(/^\s+|\s+$/g, '').length === 0;
	}

	getCharacters(): Array__<String__> {
		let _arr = Array__.fromLength<String__>(this.length);
		for (let index = 0; index < this.length; index++) {
			console.assert(this[index] != null, `String.getCharacters(): char as index ${index} is undefined`)

			let str = new String__(this[index])
			console.assert(str, `String.getCharacters(): new String is undefined`)

			_arr.set({ index: index, value: str })
		}

		return _arr
	}

	getArrayFromCsv<T extends Hypothesize.Primitive2>(): Array__<T> {
		const _arr = new Array__<T>()
		if (this[0] !== "," || this[this.length - 1] !== ",") {
			throw new Error("The string is not properly formatted")
		}

		return this.substring(1, this.length - 1) === ""
			? new Array__<T>()
			: new Array__<T>(this.substring(1, this.length - 1).split(",") as T[])
	}

	trimLeft(...strings: string[]) {
		let str = this.toString()
		strings.forEach(_str => {
			if (str.toLowerCase().startsWith(_str.toLowerCase()))
				str = str.substr(_str.length)
		})

		return str
	}
	trimRight(...strings: string[]) {
		let str = this.toString()
		strings.forEach(_str => {
			if (str.toLowerCase().endsWith(_str.toLowerCase()))
				str = str.substr(0, str.length - _str.length)
		})

		return str
	}

	tokenizeWords(separateCaseBoundary: "upper" | "lower" | "all" | "none" = "none", seperatorChars?: string[]): Array__<String__> {
		//console.log(`starting tokenizeWords for "${this.valueOf()}"`)
		var separators = seperatorChars || [" ", "\t"]
		//console.log(`effective separators are "${separators}"`)

		var words: string[] = []
		var currentWord = ""
		var lastChar = this[0]

		let pushWord = (str: string = "") => {
			if (currentWord.length > 0) {
				words.push(currentWord)
				//console.log(`pushed ${currentWord} to words, now ${JSON.stringify(words)}`)
			}

			//console.log(`set currentWord to ${str}`)
			currentWord = str
		}

		let chars = this.getCharacters()
		//console.log(`chars array: ${JSON.stringify(chars)}`)

		for (let ch of chars) {
			console.assert(ch, `String.tokenizeWords(): ch is undefined`)
			//console.log(`testing char "${ch.valueOf()}"`)

			if (separators.includes(ch.valueOf())) {
				//console.log(`separators include char tested, will push ${currentWord} to words`)
				pushWord()
			}
			else {
				//console.log(`separators do not include char tested, testing for case boundary`)

				let nowCase = ch.getCase()
				let lastCase = new String__(lastChar).getCase()

				let test = (
					(separateCaseBoundary === "none") ||
					(separators.includes(lastChar)) ||
					(lastCase === undefined) ||
					(nowCase === undefined) ||
					(nowCase !== separateCaseBoundary) ||
					(nowCase === lastCase)
				)

				if (test === false) {
					//console.log(`case boundary test is true, pushing `)
					pushWord(ch.valueOf())
				}
				else {
					//console.log(`case boundary test is false, concatenating char to currentWord`)

					currentWord = currentWord.concat(ch.valueOf())
					//console.log(`currentWord concatenated to ${currentWord}`)
				}
			}
			// TTLoUKmidiForm
			// TTL-o-UK-midi-F-orm
			lastChar = ch.valueOf()
			//console.log(`lastChar set to ${lastChar}`)
		}

		//console.log(`Outta loop, pushing currentWord "${currentWord}" to words`)
		pushWord()
		return new Array__(words).map(x => new String__(x))
	}

	toSnakeCase() {
		return new String__(this.tokenizeWords("upper", ["-", "_", " ", "    ", "\t"]).join("_"))
	}
	toCamelCase() {
		return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
			return index === 0 ? word.toLowerCase() : word.toUpperCase();
		}).replace(/\s+/g, '');
	}
	toSpace() {
		return new String__(this.tokenizeWords("upper", ["-", "_", " ", "    ", "\t"]).join(" "))
	}
	toTitleCase() {
		let str = this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
		return new String__(str)
	}

    /**
	 * Shorten a string by placing an ellipsis at the middle of it.
     * @param maxLen is the maximum length of the new shortened string
	 */
	shorten(maxLen: number) {
		let title = this.toString()
		if (title.length <= maxLen) return new String__(title);

		let i = 0, j = title.length - 1;
		let left = "", right = "";
		let leftCount = 0, rightCount = 0;

		while (true) {
			left += title[i];
			leftCount += 1;
			i += 1;
			if (leftCount + rightCount + 3 >= maxLen) break;

			right += title[j];
			rightCount += 1;
			j -= 1;
			if (leftCount + rightCount + 3 >= maxLen) break;
		}
		right = right.split("").reverse().join("")

		return new String(left + "..." + right)
	}

	isUpperCase() {
		return this.toUpperCase() === this.valueOf()
	}
	isLowerCase() {
		return this.toLowerCase() === this.valueOf()
	}

    /**
     * returns the case of input string
     * if string contains only special characters, 'upper' is returned
     * @param str the input string
     */
	getCase(): "upper" | "lower" | undefined {
		if (this.toLowerCase() === this.toUpperCase())
			return undefined
		else if (this.isUpperCase())
			return "upper"
		else
			return "lower"
	}

	strip(chars: string[]) {
		if (!Array.isArray(chars))
			throw `String.strip(): Invalid chars argument type; expected 'Array'; found ${typeof (chars)}`;

		var result = "";
		for (var i = 0; i < this.length; i++) {
			if (chars.indexOf(this[i]) < 0) result += this[i];
		}
		return result
	}

    /**
     * Transforms single or multiple consecutive white-space characters into single spaces
     * @param chars
     */
	cleanWhitespace(chars?: string[]) {
		if (["null", "undefined", "array"].indexOf(typeof (chars)) < 0)
			throw `String.cleanWhitespace(): Invalid chars argument type; expected 'null', 'undefined', or 'array'; found ${typeof (chars)}`;

		var _chars = !(chars) ? ["\n", "\t", "\v", "\r"] : chars;
		var result = "";

		for (var i = 0; i < this.length; i++) {
			let val = this[i];
			result += (_chars.indexOf(val) < 0 ? val : " ")
		}
		return result.split(/[ ]{2,}/g).join(" ");
	}

	isEmptyOrWhitespace() {
		return this.strip([" ", "\n", "\t", "\v", "\r"]).length === 0;
	}

	plural() {
		if (this.endsWith("y")) {
			return new String__(this.substr(0, this.length - 1) + "ies")
		}
		else if (this.endsWith("sis")) {
			return new String__(this.substr(0, this.length - 3) + "ses")
		}
		else if (this.endsWith("s") || this.endsWith("x")) {
			return new String__(this + "es")
		}
		else {
			return new String__(this + "s")
		}
	}

	splitIntoChunks(size: number) {
		const numChunks = Math.ceil(this.length / size)
		const chunks = new Array(numChunks)

		for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
			chunks[i] = this.substr(o, size)
		}

		return chunks
	}

	isURL(): boolean {
		var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.+)+[a-z]{2,}|' + // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
			'(\\?[;&a-z\\d%_.~+=\\*-]*)?' + // query string
			'(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
		return pattern.test(this.toString());
	}
}

export class Number__ extends global.Number {
	constructor(num: number) {
		super(num)
	}

	static isFloat(value: any): boolean {
		let parsed = typeof value === "number"
			? value : Number.parseFloat(value);
		return (!Number.isNaN(parsed)) && (!Number.isInteger(parsed))
	}

	static isInteger(value: any): boolean {
		let parsed = typeof value === "number"
			? value : Number.parseFloat(value);
		return (!Number.isNaN(parsed)) && (Number.isInteger(parsed))
	}

	static parse(value: any): number | undefined {
		let parsed = typeof value === "number"
			? value
			: Number.parseFloat(value);
		return (!Number.isNaN(parsed)) ? parsed : undefined
	}

	static smartRounding(value: number) {
		let val: string
		if (value !== undefined && value % 1 !== 0) {
			const powers = Math.floor(Math.log(Math.abs(value)) / Math.LN10)
			const decimals = powers > -1
				? Math.max(0, 2 - powers) // Above 1, we show a decreasing number of decimal (> 100 we show none)
				: Math.max(-powers + 1) // Below 1, we show at least 2 decimals and perhaps more
			val = value.toFixed(decimals)
		}
		else {
			val = value !== undefined ? value.toString() : ""
		}

		return val //`${value !== parseFloat(val) ? "~ " : ""}${val}`
	}
}

export abstract class Collection<TValue> implements Iterable<TValue> {
	[Symbol.iterator]: () => Iterator<TValue>

	length: number = 0
	abstract getArray(): TValue[];
	abstract getObject(): Obj<TValue>;

	abstract clone(): Collection<TValue>;
	abstract deepClone(): any// Collection<TValue>;

	abstract append(items: TValue[]): Collection<TValue>;
	abstract union(items: TValue[], comparator?: Projector<TValue, Primitive>): Collection<TValue>;
	abstract unique(comparator?: Projector<TValue, Primitive>): Collection<TValue>;
	abstract forEach(func: Projector<TValue, void>): void;

	abstract map<TResult>(func: Projector<TValue, TResult>): Collection<TResult>;
	abstract reduce<TResult>(initial: TResult, reducer: Reducer<TValue, TResult>): TResult;

	abstract filter(func: Predicate<TValue>): Collection<TValue>;
	abstract take(count: number, fromEnd?: boolean): Collection<TValue>;
	abstract skip(count: number, fromEnd?: boolean): Collection<TValue>;
	abstract every(predicate: Predicate<TValue>): boolean;
	abstract some(predicate: Predicate<TValue>): boolean;

	abstract sort(comparisonProjector?: Projector<TValue, Primitive>): Collection<TValue>;
	abstract sortDescending(comparisonProjector?: Projector<TValue, Primitive>): Collection<TValue>;
	abstract reverse(): Collection<TValue>;

	abstract firstOrDefault(func?: Predicate<TValue>): TValue | undefined;
	abstract first(func?: Predicate<TValue>): TValue;
	abstract lastOrDefault(func?: Predicate<TValue>): TValue | undefined;
	abstract last(func?: Predicate<TValue>): TValue;

	abstract sum(func?: Projector<TValue, number>): number | undefined;
	abstract average(func?: Projector<TValue, number>): number | undefined;
	abstract count(mapper?: Projector<TValue, any>): number;
	abstract min(comparisonProjector?: Projector<TValue, Primitive>): TValue | undefined;
	abstract max(comparisonProjector?: Projector<TValue, Primitive>): TValue | undefined;
	abstract median(comparisonProjector?: Projector<TValue, Primitive>): TValue | undefined;
	abstract mode(): TValue | undefined;

	abstract frequency(item: TValue): number;

	abstract removeItems(comparisonProjector: Projector<TValue, Primitive>, ...itemsToRemove: TValue[]): Collection<TValue>;
	abstract removeIndices(indices: number[]): Collection<TValue>;
	abstract removeSliceCounted(index: number, count: number): Collection<TValue>;
	abstract removeSliceDelimited(fromIndex: number, toIndex: number): Collection<TValue>;
	abstract removeRange(from: TValue, to: TValue, mapper: Projector<TValue, Primitive>): Collection<TValue>;

	abstract insert(index: number, ...items: TValue[]): Collection<TValue>;
	abstract contains(obj: TValue, fromIndex?: number): boolean;
	abstract indexOf(obj: TValue, fromIndex?: number, fromEnd?: boolean): number;
}
export abstract class NumberCollection extends Collection<number> {
	abstract sum(): number | undefined;
	abstract average(): number | undefined;
	abstract min(): number | undefined;
	abstract max(): number | undefined;
	abstract median(): number | undefined;
	abstract mode(): number | undefined;

	abstract frequency(item: number): number;
}
export abstract class OrderedCollection<T = any> extends Collection<T> {

	abstract get(index: number): T | undefined

	static equals<T>(x: OrderedCollection<T>, y: OrderedCollection<T>, comparer?: Comparer<T, boolean>): boolean {
		if (x && !y) return false
		if (!x && y) return false
		if (!x && !y) return true
		if (x.length !== y.length) return false

		let _comparer = comparer || ((x, y) => x === y)
		for (let index = 0; index < x.length - 1; index++) {
			if (_comparer(x.get(index), y.get(index)) === false)
				return false
		}
		return true
	}

	static compare<T>(x: T, y: T, comparer?: Projector<T>, tryNumeric: boolean = false): number {
		let _x: any = comparer ? comparer(x) : x;
		let _y: any = comparer ? comparer(y) : y;

		// if (_x.toString() === "95000" || _y.toString() === "95000") {
		// 	console.log(`comparing ${_x} and ${_y} with tryNumeric=${tryNumeric}`)
		// }
		if (typeof _x === "string" && typeof _y === "string") {

			if (tryNumeric === true) {
				let __x = parseFloat(_x);
				let __y = parseFloat(_y);
				if ((!Number.isNaN(__x)) && (!Number.isNaN(__y))) {
					return __x - __y
				}
			}

			return new Intl.Collator().compare(_x || "", _y || "");
		}
		else if (typeof _x === "number" && typeof _y === "number") {
			return (_x || 0) - (_y || 0);
		}
		else if (_x instanceof Date && _y instanceof Date) {
			_x = _x || new Date()
			_y = _y || new Date()
			if (_x > _y)
				return 1;
			else if (_x === _y)
				return 0;
			else
				return -1;
		}
		else
			return _x === _y ? 0 : 1
	}

	static getComparer<T>(projector: Projector<T>, tryNumeric: boolean = false, reverse: boolean = false) {
		//console.log(`generating comparer, try numeric is ${tryNumeric}, reversed is ${reverse} `)
		return (x: T, y: T) => {
			return OrderedCollection.compare(x, y, projector, tryNumeric) * (reverse === true ? -1 : 1)
		}
	}
}

export class Array__<TValue = any> implements OrderedCollection<TValue> {
	readonly length: number

	constructor(items?: TValue[]) {
		this.length = items ? items.length : 0;
		for (let index = 0; index < this.length; index++) {
			(this as any)[index] = items![index];
		}
	}

	[Symbol.iterator]() {
		let _index = 0
		return {
			next: () => _index < this.length
				? { value: this.get(_index++)!, done: false }
				: { done: true } as IteratorResult<TValue>
		}
	}
    /*
        [Symbol.iterator] = function* () {
            for (var _index = 0; _index < this.length; _index++)
                yield (() => {
                    let val = this[_index] as TValue
                    //console.log(`returning ${val} in Array__ iterator`)

                    return val
                })() as TValue;
        }.bind(this)

        [Symbol.iterator] = this._arr[Symbol.iterator]
        [Symbol.iterator](): Iterator<TValue|undefined> {
            return {
                next: (value?: any): IteratorResult<TValue|undefined> => {
                    return {
                        done: true,
                        value: undefined
                    }
                }
            }
        }
    */

	static fromLength<T>(length: number = 0): Array__<T> { return new Array__<T>(new global.Array(length)); }
	static fromArguments<T>(...args: T[]): Array__<T> {
		return new Array__<T>(Array.prototype.slice.call(arguments))
	}
	static fromIterable<T>(arr: Iterable<T>): Array__<T> { return new Array__<T>(Array.from(arr)) }
	static fromObject<T>(obj: Obj<T>): Array__<T> { return new Array__<T>(Object__.keys(obj).map(key => obj[key])); }
	static fromRange(from: number, to: number, opts?: { mode: "width", width: number } | { mode: "count", count: number }): Array__<number> {
		if (opts) {
			if (opts.mode === "width" && opts.width <= 0) throw new Error("width must be positive non-zero number")
			if (opts.mode === "count" && opts.count <= 0) throw new Error("count must be positive non-zero number")
		}

		let diff = to - from
		let sign = to >= from ? 1 : -1
		let delta = opts === undefined
			? sign
			: opts.mode === "width"
				? (opts.width * sign)
				: diff / opts.count


		let length = Math.floor(diff / delta) + 1

		let arr = new global.Array<number>()
		for (var value = from; arr.length < length; value += delta) {
			arr.push(value)
		}

		return new Array__(arr)
	}

	clone() {
		return new Array__(this.getArray());
	}
	deepClone() {
		throw new Error(`Not Implemented`)
	}

	isDuplicated(element: TValue) {
		var alreadyOccured = false;
		for (var i = 0; i < this.length; i++) {
			if (this[i] === element) {
				if (alreadyOccured) {
					return true;
				}
				alreadyOccured = true;
			}
		}
		return false
	}

	getArray(): TValue[] {
		let _arr = new global.Array(this.length)
		for (let index = 0; index < this.length; index++)
			_arr[index] = (this as any)[index];

		return _arr;
	}

	getStringifiedArray(): string {
		return `,${this.join(",")},`
	}

	getObject(): Obj<TValue> {
		let obj = {} as Obj
		for (let index = 0; index < this.length; index++)
			obj[index] = (this as any)[index];

		return obj;
	}

	getNumbers(projector?: Projector<TValue, number>) {
		return this
			.map(datum => {
				if (datum === undefined) { throw new Error(`Tried to call getNumber() on an array including undefined values`) }
				let value = projector ? projector(datum) : datum
				return typeof (value) === "number"
					? value : Number.parseFloat(value.toString())
			})
			.filter(num => Number.isNaN(num) === false)
	}

	get(index: number): TValue | undefined
	get(indices: Iterable<number>): TValue[]
	get(...indices: number[]): TValue[]
	get(selection: number | Iterable<number>) {
		try {
			if (typeof selection === "number")
				return (this as any)[selection]
			else
				return [...selection].map(index => (this as any)[index])
		}
		catch (e) {
			console.error(`Error in Array__.get(); selection is: ${selection}; typeof selection is: ${typeof selection}`)
			throw e
		}
	}

	set(...keyValues: { value: TValue, index: number }[]): Array__<TValue> {
		let arr = this.getArray()
		keyValues.forEach(keyValue => {
			if (arr.length > keyValue.index) {
				arr[keyValue.index] = keyValue.value
			}
		})
		return new Array__(arr)
	}
	merge(...keyValues: { value: Partial<TValue>, index: number }[]): Array__<TValue> {
		let arr = this.getArray()
		keyValues.forEach(keyValue => {
			if (keyValue.index >= 0 && arr.length > keyValue.index) {
				arr[keyValue.index] = Object__.merge(arr[keyValue.index], keyValue.value)
			}
		})
		return new Array__(arr)
	}
    /**s
     * 
     * @param items 
     */
	append(items: TValue[]): Array__<TValue> {
		const newArray = this.getArray().concat(items)
		return new Array__<TValue>(newArray);
	}
	/**
	 * Append items to the end of this array and return the distinct elements in the result
	 */
	union(items: TValue[], comparator?: Projector<TValue, Primitive>): Array__<TValue> {
		return new Array__<TValue>(this.getArray().concat(items)).unique(comparator);
	}

	unique(comparator?: Projector<TValue, Primitive>): Array__<TValue> {
		let _arr = new Map__<Primitive | TValue, TValue>();
		this.forEach((_item, _index) => {
			_arr.set(comparator ? comparator(_item) : _item, _item)
		});
		return Array__.fromIterable<TValue>(_arr.values());
	}

	forEach(projector: Projector<TValue, void>) {
		for (let index = 0; index < this.length; index++) {
			projector((this as any)[index], index);
		}
	}
	map<TResult>(func: Projector<TValue, TResult>): Array__<TResult> {
		let _arr: TResult[] = new global.Array(this.length);
		this.forEach((item, index) => {
			_arr[index!] = func(item, index);
		})

		//console.log(`Collection map returning array of length ${_arr.length}`)
		return new Array__<TResult>(_arr);
	}
	reduce<TResult>(initial: TResult, reducer: Reducer<TValue, TResult>): TResult {
		let _value = initial; // initial parameter is required
		this.forEach((item, index) => {
			_value = reducer(_value, item, index);
		})

		return _value;
	}
	join<TResult>(separator: string): string {
		return (this.length === 0) ? "" : this.skip(1)
			.reduce(this.get(0)!.toString(), (prev, curr) => prev.toString() + separator + curr.toString())

	}

	filter(func: Predicate<TValue>): Array__<TValue> {
		var arr: TValue[] = [];
		this.forEach((item, index) => {
			if (func(item, index) === true)
				arr.push(item);
		})

		return new Array__<TValue>(arr);
	}

	/**
	 * Sorts an array in ascending order.
	 * @param func function that generates the primitive values used to actually sort this array
	 */
	sort(comparisonProjector?: Projector<TValue, Primitive>, tryNumeric?: boolean): Array__<TValue> {
		return Array__.fromIterable(
			this.getArray().sort((x: TValue, y: TValue) =>
				OrderedCollection.compare(x, y, comparisonProjector, tryNumeric)
			))
	}
	/**
	 * Sorts an array in descending order.
	 * @param func function that generates the primitive values used to actually sort this array
	 */
	sortDescending(comparisonProjector?: Projector<TValue, Primitive>): Array__<TValue> {
		return this.sort(comparisonProjector).reverse();
	}
	/**
	 * Returns new array containing this array's elements in reverse order.
	 */
	reverse(): Array__<TValue> {
		return Array__.fromIterable(this.getArray().reverse());
	}

	firstOrDefault(func?: Predicate<TValue>): TValue | undefined {
		for (let index = 0; index < this.length; index++)
			if (func ? func((this as any)[index], index) === true : (this as any)[index] !== undefined)
				return (this as any)[index];

		return undefined;
	}
	first(func?: Predicate<TValue>): TValue {
		let firstOrDefault = this.firstOrDefault(func);
		if (firstOrDefault === undefined)
			throw new Error("First item not found");
		else
			return firstOrDefault;
	}
	lastOrDefault(func?: Predicate<TValue>): TValue | undefined {
		for (let index = (this.length - 1); index >= 0; index--)
			if (func ? func(this[index], index) === true : this[index] !== undefined)
				return this[index];

		return undefined;
	}
	last(func?: Predicate<TValue>): TValue {
		let lastOrDefault = this.lastOrDefault(func);
		if (lastOrDefault === undefined)
			throw new Error("Last item not found");
		else
			return lastOrDefault;
	}

	every(predicate: Predicate<TValue>): boolean {
		return this.count(predicate) === this.length;
	}
	some(predicate?: Predicate<TValue>): boolean {
		return this.firstOrDefault(predicate) !== undefined;
	}

	take(count: number, fromEnd: boolean = false): Array__<TValue> {
		return fromEnd
			? Array__.fromIterable(this.getArray().slice(-count))
			: Array__.fromIterable(this.getArray().slice(0, count));
	}
	skip(count: number, fromEnd: boolean = false): Array__<TValue> {
		return fromEnd
			? Array__.fromIterable(this.getArray().slice(0, -count))
			: Array__.fromIterable(this.getArray().slice(count));
	}

	/**
	 * Counts truthy mapped values in this array 
	 * This takes more time, but can be more useful than, just getting the length property
	 * @param func Optional mapper applied to each element before counting
	 */
	count(mapper?: Projector<TValue, any>): number {
		var count = 0;
		this.forEach((item, index) => {
			if (mapper ? mapper(item, index) : item as any)
				count++
		})

		return count;
	}
	sum(func?: Projector<TValue, number>): number {
		var sum = 0;
		this.forEach((item, index) => {
			sum += (func ? func(item, index) : item as any);
		})

		return sum;
	}
	average(projector?: Projector<TValue, number>): number | undefined {
		let sum = 0;
		let count = 0;
		this.forEach((item, index) => {
			let _value = projector ? projector(item, index) : item;
			if (typeof item === "number") {
				sum += _value as number;
				count++;
			}
		})

		if (count > 0)
			return sum / count;
		else
			return undefined
	}
	averageExcluding(mean: number, valueToExclude: number) {
		return (mean - (1.0 * valueToExclude / this.length)) * (1.0 * this.length / (this.length - 1));
	}

	min(comparisonProjector?: Projector<TValue, Primitive>): TValue | undefined {
		let _min = this.firstOrDefault();
		if (this.length <= 1)
			return _min;

		this.forEach((_item, _index) => {
			let _comparison = OrderedCollection.compare(_item, _min, comparisonProjector);
			if (_comparison < 0) // _item < _min
				_min = _item;
		})

		return _min;
	}
	max(projector?: Projector<TValue, Primitive>): TValue | undefined {
		let _max = this.firstOrDefault();
		if (this.length <= 1)
			return _max;

		this.forEach((_item, _index) => {
			let _comparison = OrderedCollection.compare(_item, _max, projector);
			if (_comparison > 0) // _item > _max
			{
				_max = _item;
			}
		})

		return _max;
	}

	variance(projector?: Projector<TValue, number>, mean?: number): number | undefined {
		if (this.length === 0) return undefined

		let numbers = this.getNumbers(projector)
		if (numbers.length === 0) return undefined
		if (numbers.length === 1) return 0

		let _mean = mean || numbers.average()!
		return numbers.map(datum => Math.pow(datum - _mean, 2)).sum() / (numbers.length - 1)
	}

	deviation(projector?: Projector<TValue, number>): number | undefined {
		let variance = this.variance(projector)
		return (variance !== undefined)
			? Math.sqrt(variance)
			: undefined
	}
	deviationExcluding(deviation: number, valueToExclude: number): number {
		let mean = this.averageExcluding(this.average()!, valueToExclude)
		return Math.sqrt(this.variance(undefined, mean)!)
	}
	median(comparisonProjector?: Projector<TValue, Primitive>): TValue | undefined {
		try {
			let _middle_index = Math.floor(this.length / 2);
			//console.log(`median(): middle index is ${_middle_index}`);

			let _sorted = this.sort(comparisonProjector);
			//console.log(`median(): sorted array length is ${_sorted.length}`);

			return _sorted[_middle_index];
		}
		catch (e) {
			console.warn(`median() error: ${e}`);
			return undefined;
		}
	}
	mode(): TValue | undefined {
		const freqs = this.frequencies().sort(x => x)
		return freqs.getArray()[freqs.length - 1][0]
	}
	frequency(item: TValue): number {
		return this.count(_item => _item === item);
	}
	frequencies(): Map__<TValue, number> {
		return Map__.fromFrequencies(this)
	}
	frequenciesPercentScaled(): Map__<TValue, number> {
		return this.frequencies().map(freq => freq * 100 / this.length)
	}
	interQuartileRange() {
		var sortedList = this.sort()
		var percentile25 = sortedList[Math.floor(0.25 * sortedList.length)];
		var percentile75 = sortedList[Math.ceil(0.75 * sortedList.length)];
		return percentile75 - percentile25;
	}
	firstQuartile() {
		var sortedList = this.sort()
		return sortedList[Math.floor(0.25 * sortedList.length)];
	}
	thirdQuartile() {
		var sortedList = this.sort()
		return sortedList[Math.ceil(0.75 * sortedList.length) - 1];
	}
	removeItems(
		comparisonProjector: Projector<TValue, Primitive>,
		...itemsToRemove: TValue[]): Array__<TValue> {

		let itemsToRemoveMapped = itemsToRemove.map(comparisonProjector);
		return this.filter(item => !itemsToRemoveMapped.includes(comparisonProjector(item)));
	}
	removeIndices(indices: number[]): Array__<TValue> {
		return this.filter((item, index) => !indices.includes(index!));
	}
	removeSliceCounted(index: number, count: number): Array__<TValue> {
		return Array__.fromIterable([...this.getArray()].splice(index, count));
	}
	removeSliceDelimited(fromIndex: number, toIndex: number): Array__<TValue> {
		let arr = this.getArray();
		arr.splice(fromIndex, toIndex - fromIndex + 1)
		return new Array__(arr)
	}
	removeRange(from: TValue, to: TValue, mapper: Projector<TValue, Primitive>): Array__<TValue> {
		throw new Error("removeRange() invalid operation on a general array");
	}
	insert(index: number, ...items: TValue[]): Array__<TValue> {
		let arr = this.getArray()
		return Array__.fromIterable([...arr.slice(0, index), ...items, ...arr.slice(index)]);
	}

	flatten<T = any>(): Array__<T> {
		var toString = Object__.prototype.toString;
		var arrayTypeStr = '[object Array]'
		var arr: any[] = []
		var nodes = [...this.getArray()].slice()
		var node;

		if (!this.length) {
			return new Array__<any>(arr)
		}

		node = nodes.pop();
		do {
			if (toString.call(node) === arrayTypeStr) {
				nodes.push.apply(nodes, node);
			}
			else {
				arr.push(node);
			}
		} while (nodes.length && (node = nodes.pop()) !== undefined);

		arr.reverse(); // we reverse result to restore the original order
		return new Array__<T>(arr);
	}

	/**
	 * Determines whether an array includes a certain element, returning true or false as appropriate.
	 * @param searchElement The element to search for.
	 * @param fromIndex The position in this array at which to begin searching for searchElement.
	 */
	contains(obj: TValue, fromIndex?: number): boolean {
		return ([...this.getArray()].indexOf(obj, fromIndex) >= 0)
	}

    /**
     * 
     * @param func Returns the index of the first element that meets a condition (or )
     * @param fromIndex 
     */
	indexOfFirst(predicate?: Predicate<TValue>, fromIndex?: number): number {
		for (let index = fromIndex || 0; index < this.length; index++)
			if (predicate ? predicate(this[index], index) : this[index] !== undefined)
				return index;

		return -1;
	}

	indexOf(value: TValue, fromIndex?: number, fromEnd?: boolean): number
	indexOf(block: Iterable<TValue>, fromIndex?: number, fromEnd?: boolean): number
	indexOf(val: TValue | Iterable<TValue>, fromIndex: number = 0, fromEnd: boolean = false): number {
		// let isIterable = val != null && typeof val[Symbol.iterator] === 'function'
		if (Object__.isIterable(val) && typeof val !== "string") {
			let arr = [...val as Iterable<TValue>]
			//function find_csa(arr, subarr, from_index) {
			var i = fromIndex >>> 0
			var arrLength = arr.length
			var diffLength = this.length + 1 - arrLength;

			loop: for (; i < diffLength; i++) {
				for (var j = 0; j < arrLength; j++)
					if (this.get(i + j) !== arr[j])
						continue loop;
				return i;
			}
			return -1;
		}
		else {
			return [...this.getArray()].indexOf(val as TValue, fromEnd ? -fromIndex : fromIndex)
		}
	}

}
export class ComparatorCollection<TValue> extends Array__<TValue> {
	readonly _comparator: Projector<TValue, Primitive> | undefined;

	constructor(comparator: Projector<TValue, Primitive>, ...items: TValue[]) {
		super(items);
		this._comparator = comparator;
	}
}
export class PrimitiveCollection<TValue extends Primitive> extends Array__<TValue>{
	unique(): PrimitiveCollection<TValue> {
		let _arr: TValue[] = [];
		for (let _item of [...this.getArray()]) {
			if (!_arr.includes(_item))
				_arr.push(_item)
		}

		return new PrimitiveCollection<TValue>(_arr);
	}

	removeRange(from: Primitive, to: Primitive): PrimitiveCollection<TValue> {
		return this.filter((item, index) => item > to || item < from) as PrimitiveCollection<TValue>;
	}

	// static fromLength<T extends Primitive>(length: number = 0): PrimitiveCollection<T> {
	// 	return new PrimitiveCollection<T>(...new Array<T>(length))
	// }
	// static fromArray<T extends Primitive>(arr: T[]): PrimitiveCollection<T> {
	// 	return new PrimitiveCollection<T>(...arr)
	// }
	// static fromDictionary<T extends Primitive>(obj: Obj<T>): PrimitiveCollection<T> {
	// 	return new PrimitiveCollection<T>(...Object.keys(obj).map(key => obj[key]));
	// }
}
export class NumericCollection extends PrimitiveCollection<number> {
	median(): number | undefined {
		let _ordered = this.sort();
		if (_ordered.length % 2) {
			var first = _ordered.get(Math.floor(_ordered.length / 2))!
			let second = _ordered.get(Math.floor(_ordered.length / 2))!
			return (first + second) / 2;
		}
		else {
			return _ordered.get(Math.floor(this.length / 2))
		}
	}

	static fromRange(from: number, to: number): NumericCollection {
		let _difference = to - from;
		let _length = Math.abs(_difference);
		let _sign = _difference / _length;
		let _index = 0;
		let _value = from;
		let _arr = new Array__<number>([_length]);
		while (true) {
			_arr[_index++] = _value;
			if (_value === to)
				break;
			_value += _sign;
		}
		return new NumericCollection(_arr.getArray());
	}
}

export class Dictionary<TValue = any, TKey extends string = string> {
	private _obj: { [key in TKey]: TValue }
	private _comparer?: Comparer<TValue, boolean>

	constructor(entries?: Tuple<TKey, TValue>[], comparer?: Comparer<TValue, boolean>) {
		this._obj = {} as { [key in TKey]: TValue }
		if (entries)
			entries.forEach(entry => {
				this._obj[entry[0]] = entry[1]
			})
		this._comparer = comparer
	}

	static fromObject<T, K extends string>(obj: Obj<T, K>): Dictionary<T, K> {
		if (!obj)
			throw new Error(`Obj argument missing in Dictionary.fromObject(...)`)
		return new Dictionary(Object.keys(obj).map((key, index) => new Tuple(key as K, obj[key])))
	}
	static fromArray<T>(arr: T[]) {
		return new Dictionary(arr.map((element, index) => new Tuple(index.toString(), element)))
	}
	static fromKeys<T>(arr: any[], defaultVal: T) {
		return new Dictionary(arr.map((element, index) => new Tuple(element.toString() as string, defaultVal)))
	}
	static fromProjection<K extends string, V, T = any>(
		items: Iterable<T>,
		keysProjector?: Projector<T, K>,
		valuesProjector?: Projector<T, V>) {
		return new Dictionary<V, K>([...items].map(item => {
			let key = (keysProjector ? keysProjector(item) : item) as K
			let value = (valuesProjector ? valuesProjector(item) : item) as V
			return new Tuple(key, value)
		}))
	}

	get length(): number {
		return Object__.keys(this._obj).length;
	}

	get(key: TKey): TValue | undefined {
		return this._obj[key]
	}
	set(key: TKey, val: TValue) {
		this._obj[key] = val
	}

	clone(): Dictionary<TValue, TKey> {
		return new Dictionary(this.entries(), this._comparer);
	}
	asObject(): Obj<TValue, string> {
		let _obj = {} as { [key in TKey]: TValue }
		Object__.keys(this._obj).forEach(key => {
			_obj[key] = this._obj[key]
		});
		return _obj;
	}

	entries(): Tuple<TKey, TValue>[] {
		let _arr: Tuple<TKey, TValue>[] = []
		for (let key of Object__.keys(this._obj)) {
			_arr.push(new Tuple(key, this._obj[key]))
		}
		return _arr;
	}
	values(): Array__<TValue> {
		return new Array__(Object__.keys(this._obj).map(key => this._obj[key]))
	}
	keys(): Array__<TKey> {
		return new Array__(Object__.keys(this._obj))
	}
	forEach(func: Projector<TValue, void, TKey>): void {
		this.entries().forEach(entry => {
			func(entry[1], entry[0]);
		})
	}

	last(predicate?: Predicate<TValue, TKey>) {
		return new Array__(this.entries())
			.last(predicate ? entry => predicate(entry[1], entry[0]) : undefined)
	}
	lastOrDefault(predicate?: Predicate<TValue, TKey>) {
		return new Array__(this.entries())
			.lastOrDefault(predicate ? entry => predicate(entry[1], entry[0]) : undefined);
	}
	first(predicate?: Predicate<TValue, TKey>) {
		return new Array__(this.entries())
			.first(predicate ? entry => predicate(entry[1], entry[0]) : undefined);
	}
	firstOrDefault(predicate?: Predicate<TValue, TKey>) {
		return new Array__(this.entries())
			.firstOrDefault(predicate ? entry => predicate(entry[1], entry[0]) : undefined);
	}

	indexOfKey(key: TKey) {
		return this.keys().indexOf(key)
	}

	keyOf(val: TValue) {
		for (let entry of this.entries()) {
			if (entry[1] === val)
				return entry[0]
		}
		return undefined
	}
	hasKey(key: TKey) {
		return this.keys().indexOf(key) >= 0
	}
	hasValue(val: TValue) {
		return this.values().indexOf(val) >= 0
	}

	union(other: Dictionary<TValue, TKey>, reducer?: (val1: TValue, val2: TValue) => TValue) {
		if (reducer === undefined && this.keys().some(key => other.keys().contains(key)))
			throw new Error(`Duplicate keys found and no reducer provided`);

		let dict = new Dictionary<TValue, TKey>()
		this.entries().forEach(entry => {
			dict.set(entry[0], entry[1])
		})
		other.entries().forEach(entry => {
			let key = entry[0]
			let val = dict.hasKey(key) ? reducer!(dict.get(key)!, entry[1]) : entry[1]
			dict.set(key, val)
		})

		return dict
	}
	intersection(other: Dictionary<TValue, TKey>, valuesComparer?: Comparer<TValue, boolean>) {
		if (!other)
			return new Dictionary<TValue>()

		let _comparer = valuesComparer || this._comparer;
		return this.filter((value, key) =>
			other.hasKey(key!) && (_comparer
				? (_comparer(other.get(key!), value) === true)
				: (other.get(key!) === value)))
	}
	equals(other: Dictionary<TValue, TKey>, valuesComparer?: Comparer<TValue, boolean>): boolean {
		if (!other)
			return false
		let _comparer = valuesComparer || this._comparer;
		return this.length === other.length &&
			this.intersection(other, _comparer).length === this.length
	}

	// sort(projection: Projector<TValue, Primitive>) {
	//     const entries = new Array__(this.entries()).sort(entry => projection(entry[1])).getArray()
	//     let result = new Dictionary(entries);
	//     return result
	// }

	map<Y>(projection: Projector<TValue, Y, TKey>) {
		return new Dictionary(this.entries().map((entry, index) => {
			return new Tuple(entry[0], projection(entry[1], entry[0]))
		}))
	}
	async mapAsync<T>(projection: AsyncProjector<TValue, T, TKey>) {
		var _map = new Dictionary<T>();
		let promisesArr = this.entries()
			.map(entry => projection(entry[1]!, entry[0]))

		let resolvedArr = await Promise.all(promisesArr)
		return new Dictionary(resolvedArr);
	}

	filter(predicate: Predicate<TValue, TKey>) {
		return new Dictionary(this.entries().filter(entry => predicate(entry[1], entry[0]) === true));
	}
	every(predicate: Predicate<TValue, TKey>) {
		return this.entries().every(entry => predicate(entry[1], entry[0]))
	}
	some(predicate: Predicate<TValue, string | number | symbol>) {
		return this.entries().some(entry => predicate(entry[1], entry[0]))
	}
}

export class Map__<TKey = any, TValue = any> extends global.Map<TKey, TValue> /*implements Collection<Tuple<TKey, TValue>>*/ {
	private _comparer?: Comparer<TValue, boolean>

	constructor(items?: Iterable<Tuple<TKey, TValue>>, comparer?: Comparer<TValue, boolean>) {
		super([...items || []].map(tuple => [tuple[0], tuple[1]] as [TKey, TValue]))
		this._comparer = comparer
	}

	static fromProjection<K, V, T = any>(items: Iterable<T>, keysProjector?: Projector<T, K>, valuesProjector?: Projector<T, V>): Map__<K, V> {
		return new Map__<K, V>([...items].map(item => {
			let key = (keysProjector ? keysProjector(item) : item) as K
			let value = (valuesProjector ? valuesProjector(item) : item) as V
			return new Tuple(key, value)
		}))
	}
	static fromKeys<T>(keys: Iterable<T>, seed?: any): Map__<T, any> {
		return new Map__<T, any>([...keys].map(_key => new Tuple(_key, seed)))
	}
	static fromObject<V, K extends string>(obj: Obj<V, K>) {
		if (!obj)
			return new Map__<K, V>()
		return Object__.keys(obj)
			.reduce((map, key) => map.set(key, obj[key]), new Map__<K, V>());
	}
	static fromFrequencies<T>(items: Iterable<T>): Map__<T, number> {
		let freqs = new Map__<T, number>(); //semi-colon required at end of this statement
		[...items].forEach(item => {
			freqs.set(item, (freqs.get(item) || 0) + 1)
		})
		return freqs
	}

	get length(): number {
		return [...this.keys()].length;
	}

	asObject() {
		let _obj = {} as Obj<TValue, string>
		this.forEach((_value, _key) => {
			_obj[_key.toString()] = _value
		});
		return _obj
	}
	getArray() {
		return [...this.keys()].map(key => [key, this.get(key) as TValue] as Tuple<TKey, TValue>)
	}

	clone(): Map__<TKey, TValue> {
		return new Map__([...this.entries()], this._comparer)
	}
	deepClone() {
		throw new Error("Not implemented")
	}

	intersection(other: Map__<TKey, TValue>, valuesComparer?: Comparer<TValue, boolean>) {
		if (!other)
			return new Map__<TKey, TValue>()

		let _comparer = valuesComparer || this._comparer;
		return this
			.filter((value, key) =>
				other.has(key) && (_comparer
					? (_comparer(other.get(key), value) === true)
					: (other.get(key) === value)))
	}

	equals(
		other: Map__<TKey, TValue>,
		valuesComparer?: Comparer<TValue, boolean>): boolean {

		if (!other)
			return false
		let _comparer = valuesComparer || this._comparer;
		return this.length === other.length && this.intersection(other, _comparer).length === this.length
	}

	map<T>(projection: Projector<TValue, T, TKey>): Map__<TKey, T> {
		var _map = new Map__();
		this.forEach((_value, _key) => {
			_map.set(_key, projection(_value, _key));
		});
		return _map;
	}
	sort(projection?: Projector<TValue, Primitive>): Map__<TKey, TValue> {
		return new Map__([...this.getArray()]
			.sort((x, y) =>
				OrderedCollection.compare(x[1], y[1], projection)
			))
	}
	async mapAsync<T>(projection: AsyncProjector<TValue, T, TKey>): Promise<Map__<TKey, T>> {
		var _map = new Map__<TKey, T>();
		let promisesArr = this.getArray()
			.map(entry => projection(entry[1]!, entry[0]))

		let resolvedArr = await Promise.all(promisesArr)
		return new Map__(resolvedArr);
	}

	filter(predicate: (value: TValue, key: TKey) => boolean): Map__<TKey, TValue> {
		let arr: Tuple<TKey, TValue>[] = [];
		for (let entry of this.entries()) {
			if (predicate(entry[1], entry[0]) === true)
				arr.push(new Tuple(entry[0], entry[1]))
		}
		return new Map__<TKey, TValue>(arr);
	}
	every(predicate: (value: TValue, key: TKey) => any): boolean {
		for (let entry of this.entries()) {
			if (predicate(entry[1], entry[0]) === false)
				return false;
		}
		return true;
	}
	some(predicate: (value: TValue, key: TKey) => any): boolean {
		for (let entry of this.entries()) {
			if (predicate(entry[1], entry[0]) === true)
				return true;
		}
		return false;
	}
}

export class Set__<T = any> extends global.Set<T> /*implements Hypothesize.StdLib.Set<T>*/ {
	private _comparer: Comparer<T, boolean> | undefined
	constructor(items: Iterable<T>, comparer?: Comparer<T, boolean>) {
		super();
		for (let item of items) {
			if (!this.has(item, comparer))
				this.add(item)
		}
	}

	clone(): Set__<T> {
		return new Set__([...this.keys()], this._comparer);
	}

	get length(): number {
		return [...this.keys()].length;
	}
	has(value: T, comparer?: Comparer<T, boolean>): boolean {
		let _comparer = comparer || this._comparer;
		return _comparer
			? this.some(x => _comparer!(x, value))
			: super.has(value);
	}

	add(value: T, comparer?: Comparer<T, boolean>): this {
		let _comparer = comparer || this._comparer;
		if (_comparer && this.has(value, _comparer)) return this;
		super.add(value)
		return this
	}
	append(items: Iterable<T>, comparer?: Comparer<T, boolean>): Set__<T> {
		return new Set__<T>([...this.keys(), ...items], comparer || this._comparer);
	}

	equals(other: Set__<T>, comparer?: Comparer<T, boolean>): boolean {
		if (this.length !== other.length)
			return false;
		return Set__.difference([this, other], comparer || this._comparer).length === 0;
	}

	/**
	 * Returns a new set with elements that occur both in this set and other input sets
	 * @param comparisonProjector Optional projector of primitive result type for comparing elements
	 */
	static intersection<T>(sets: Iterable<Set__<T>>, comparer?: Comparer<T, boolean>): Set__<T> {
		let passed = new Set__<T>([]);
		let failed = new Set__<T>([]);

		for (let set of [...sets].filter(_set => _set && _set.length > 0)) {
			for (let item of set) {
				if (passed.has(item, comparer)) continue;
				if (failed.has(item, comparer)) continue;

				if ([...sets].every(_set => _set.has(item, comparer)))
					passed.add(item);
				else
					failed.add(item);

			}
		}
		return new Set__(passed.keys());
	}

	/**
	 * Returns a new set with elements that occur in only one of all the input sets
	 * @param comparisonProjector Optional projector of primitive result type for comparing elements
	 */
	static difference<T>(sets: Iterable<Set__<T>>, comparer?: Comparer<T, boolean>): Set__<T> {
		let result = new Set__<T>([], comparer)
		for (let set of sets)
			for (let item of set) {
				if (result.has(item, comparer)) {
					result.delete(item)
				}
				else {
					result.add(item)
				}
			}
		return result
	}

	/**
	 * Returns a new set with elements that occur in at least one of all the input sets
	 * @param comparisonProjector Optional projector of primitive result type for comparing elements
	 */
	static union<T>(sets: Iterable<Set__<T>>, comparer?: Comparer<T, boolean>): Set__<T> {
		let result = new Set__<T>([], comparer)
		for (let set of sets)
			for (let item of set) {
				if (!result.has(item, comparer)) {
					result.add(item)
				}
			}
		return result
	}

	except(other: Set__<T>, comparer?: Comparer<T, boolean>): Set__<T> {
		return new Set__([...this.keys()].filter(item => !other.has(item, comparer || this._comparer)))
	}

	/**
	 * Returns a new set with elements derived by applying a projection to this set's elements
	 * @param projection projection function of primitive result type 
	 */
	map<TResult>(projection: Projector<T, TResult>): Set__<TResult> {
		return new Set__([...this.keys()].map(projection))
	}
	filter(predicate: Predicate<T>): Set__<T> {
		return new Set__<T>([...this.keys()].filter(predicate));
	}
	every(predicate: Predicate<T>): boolean {
		return [...this.keys()].every(predicate);
	}
	some(predicate: Predicate<T>): boolean {
		return [...this.keys()].some(predicate);
	}
}

export class Stack<T> {
	_size: number
	_storage: Obj<T>

	constructor(...initial: T[]) {
		this._size = 0;
		this._storage = {};
		for (let item of initial)
			this.push(item);
	}

	push(data: T) {
		var size = ++this._size;
		this._storage[size] = data;
	};

	pop(): T | void {
		var size = this._size
		let deletedData: T;

		if (size) {
			deletedData = this._storage[size];

			delete this._storage[size];
			this._size--;

			return deletedData;
		}
	}
}