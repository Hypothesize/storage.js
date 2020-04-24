import { Hypothesize } from "./repository";
declare type Obj<TValue = any, TKey extends string = string> = {
    [key in TKey]: TValue;
};
declare type Primitive = number | string | Date;
declare type Omit<T, K extends keyof T> = {
    [P in Exclude<keyof T, K>]: T[P];
};
export declare type Comparer<X = any, Y = number> = (a?: X, b?: X) => Y;
export declare type Projector<X = any, Y = any, I = number> = (value: X, index?: I) => Y;
export declare type AsyncProjector<X = any, Y = any, I = number> = (value: X, index?: I) => Promise<Tuple<I, Y>>;
export declare type Predicate<X = any, I = number> = (value: X, index?: I) => boolean;
export declare type Reducer<X = any, Y = any, I = number> = (prev: Y, current: X, index?: I, collection?: Iterable<X>) => Y;
export interface KeyValuePair<TKey = any, TValue = any> {
    key: TKey;
    value: TValue;
}
export declare type Tuple<X, Y> = [X, Y];
export declare const Tuple: new <X, Y>(x: X, y: Y) => [X, Y];
export declare class Object__ extends global.Object {
    static keys<T extends object>(obj: T): (keyof T)[];
    static keys<K extends string = string>(obj: Obj<any, K>): K[];
    static keys<K extends string = string>(obj: {}): string[];
    static omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K>;
    static pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;
    static clone<T>(value: T): T;
    static hasValue(value: any): boolean;
    static shallowEquals(obj1: any, obj2: any, ignoreUnmatchedProps?: boolean): boolean;
    static fromKeyValues<T>(...keyValues: Tuple<string, T>[]): Obj<T, string>;
    static duplicateKeys<T>(obj: Obj, defaultValue: T): Obj<T, string>;
    /**
     * gets a pseudo-random unused key on an object
     */
    static merge<X>(target: X, source: Partial<X> | undefined | null): X;
    static merge<X>(target: Partial<X> | undefined | null, source: X): X;
    static merge<X>(target: X, source: undefined | null): X;
    static merge<X>(target: undefined | null, source: X): X;
    static merge<X, Y>(target: X, source: Y): X & Y;
    static isIterable(val: any): boolean;
}
export declare class String__ extends String {
    constructor(str: string);
    isWhiteSpace(): boolean;
    getCharacters(): Array__<String__>;
    getArrayFromCsv<T extends Hypothesize.Primitive2>(): Array__<T>;
    trimLeft(...strings: string[]): string;
    trimRight(...strings: string[]): string;
    tokenizeWords(separateCaseBoundary?: "upper" | "lower" | "all" | "none", seperatorChars?: string[]): Array__<String__>;
    toSnakeCase(): String__;
    toCamelCase(): string;
    toSpace(): String__;
    toTitleCase(): String__;
    /**
     * Shorten a string by placing an ellipsis at the middle of it.
     * @param maxLen is the maximum length of the new shortened string
     */
    shorten(maxLen: number): String | String__;
    isUpperCase(): boolean;
    isLowerCase(): boolean;
    /**
     * returns the case of input string
     * if string contains only special characters, 'upper' is returned
     * @param str the input string
     */
    getCase(): "upper" | "lower" | undefined;
    strip(chars: string[]): string;
    /**
     * Transforms single or multiple consecutive white-space characters into single spaces
     * @param chars
     */
    cleanWhitespace(chars?: string[]): string;
    isEmptyOrWhitespace(): boolean;
    plural(): String__;
    splitIntoChunks(size: number): any[];
    isURL(): boolean;
}
export declare class Number__ extends global.Number {
    constructor(num: number);
    static isFloat(value: any): boolean;
    static isInteger(value: any): boolean;
    static parse(value: any): number | undefined;
    static smartRounding(value: number): string;
}
export declare abstract class Collection<TValue> implements Iterable<TValue> {
    [Symbol.iterator]: () => Iterator<TValue>;
    length: number;
    abstract getArray(): TValue[];
    abstract getObject(): Obj<TValue>;
    abstract clone(): Collection<TValue>;
    abstract deepClone(): any;
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
export declare abstract class NumberCollection extends Collection<number> {
    abstract sum(): number | undefined;
    abstract average(): number | undefined;
    abstract min(): number | undefined;
    abstract max(): number | undefined;
    abstract median(): number | undefined;
    abstract mode(): number | undefined;
    abstract frequency(item: number): number;
}
export declare abstract class OrderedCollection<T = any> extends Collection<T> {
    abstract get(index: number): T | undefined;
    static equals<T>(x: OrderedCollection<T>, y: OrderedCollection<T>, comparer?: Comparer<T, boolean>): boolean;
    static compare<T>(x: T, y: T, comparer?: Projector<T>, tryNumeric?: boolean): number;
    static getComparer<T>(projector: Projector<T>, tryNumeric?: boolean, reverse?: boolean): (x: T, y: T) => number;
}
export declare class Array__<TValue = any> implements OrderedCollection<TValue> {
    readonly length: number;
    constructor(items?: TValue[]);
    [Symbol.iterator](): {
        next: () => IteratorReturnResult<any> | IteratorYieldResult<TValue> | {
            value: TValue;
            done: boolean;
        };
    };
    static fromLength<T>(length?: number): Array__<T>;
    static fromArguments<T>(...args: T[]): Array__<T>;
    static fromIterable<T>(arr: Iterable<T>): Array__<T>;
    static fromObject<T>(obj: Obj<T>): Array__<T>;
    static fromRange(from: number, to: number, opts?: {
        mode: "width";
        width: number;
    } | {
        mode: "count";
        count: number;
    }): Array__<number>;
    clone(): Array__<TValue>;
    deepClone(): void;
    isDuplicated(element: TValue): boolean;
    getArray(): TValue[];
    getStringifiedArray(): string;
    getObject(): Obj<TValue>;
    getNumbers(projector?: Projector<TValue, number>): Array__<number>;
    get(index: number): TValue | undefined;
    get(indices: Iterable<number>): TValue[];
    get(...indices: number[]): TValue[];
    set(...keyValues: {
        value: TValue;
        index: number;
    }[]): Array__<TValue>;
    merge(...keyValues: {
        value: Partial<TValue>;
        index: number;
    }[]): Array__<TValue>;
    /**s
     *
     * @param items
     */
    append(items: TValue[]): Array__<TValue>;
    /**
     * Append items to the end of this array and return the distinct elements in the result
     */
    union(items: TValue[], comparator?: Projector<TValue, Primitive>): Array__<TValue>;
    unique(comparator?: Projector<TValue, Primitive>): Array__<TValue>;
    forEach(projector: Projector<TValue, void>): void;
    map<TResult>(func: Projector<TValue, TResult>): Array__<TResult>;
    reduce<TResult>(initial: TResult, reducer: Reducer<TValue, TResult>): TResult;
    join<TResult>(separator: string): string;
    filter(func: Predicate<TValue>): Array__<TValue>;
    /**
     * Sorts an array in ascending order.
     * @param func function that generates the primitive values used to actually sort this array
     */
    sort(comparisonProjector?: Projector<TValue, Primitive>, tryNumeric?: boolean): Array__<TValue>;
    /**
     * Sorts an array in descending order.
     * @param func function that generates the primitive values used to actually sort this array
     */
    sortDescending(comparisonProjector?: Projector<TValue, Primitive>): Array__<TValue>;
    /**
     * Returns new array containing this array's elements in reverse order.
     */
    reverse(): Array__<TValue>;
    firstOrDefault(func?: Predicate<TValue>): TValue | undefined;
    first(func?: Predicate<TValue>): TValue;
    lastOrDefault(func?: Predicate<TValue>): TValue | undefined;
    last(func?: Predicate<TValue>): TValue;
    every(predicate: Predicate<TValue>): boolean;
    some(predicate?: Predicate<TValue>): boolean;
    take(count: number, fromEnd?: boolean): Array__<TValue>;
    skip(count: number, fromEnd?: boolean): Array__<TValue>;
    /**
     * Counts truthy mapped values in this array
     * This takes more time, but can be more useful than, just getting the length property
     * @param func Optional mapper applied to each element before counting
     */
    count(mapper?: Projector<TValue, any>): number;
    sum(func?: Projector<TValue, number>): number;
    average(projector?: Projector<TValue, number>): number | undefined;
    averageExcluding(mean: number, valueToExclude: number): number;
    min(comparisonProjector?: Projector<TValue, Primitive>): TValue | undefined;
    max(projector?: Projector<TValue, Primitive>): TValue | undefined;
    variance(projector?: Projector<TValue, number>, mean?: number): number | undefined;
    deviation(projector?: Projector<TValue, number>): number | undefined;
    deviationExcluding(deviation: number, valueToExclude: number): number;
    median(comparisonProjector?: Projector<TValue, Primitive>): TValue | undefined;
    mode(): TValue | undefined;
    frequency(item: TValue): number;
    frequencies(): Map__<TValue, number>;
    frequenciesPercentScaled(): Map__<TValue, number>;
    interQuartileRange(): number;
    firstQuartile(): any;
    thirdQuartile(): any;
    removeItems(comparisonProjector: Projector<TValue, Primitive>, ...itemsToRemove: TValue[]): Array__<TValue>;
    removeIndices(indices: number[]): Array__<TValue>;
    removeSliceCounted(index: number, count: number): Array__<TValue>;
    removeSliceDelimited(fromIndex: number, toIndex: number): Array__<TValue>;
    removeRange(from: TValue, to: TValue, mapper: Projector<TValue, Primitive>): Array__<TValue>;
    insert(index: number, ...items: TValue[]): Array__<TValue>;
    flatten<T = any>(): Array__<T>;
    /**
     * Determines whether an array includes a certain element, returning true or false as appropriate.
     * @param searchElement The element to search for.
     * @param fromIndex The position in this array at which to begin searching for searchElement.
     */
    contains(obj: TValue, fromIndex?: number): boolean;
    /**
     *
     * @param func Returns the index of the first element that meets a condition (or )
     * @param fromIndex
     */
    indexOfFirst(predicate?: Predicate<TValue>, fromIndex?: number): number;
    indexOf(value: TValue, fromIndex?: number, fromEnd?: boolean): number;
    indexOf(block: Iterable<TValue>, fromIndex?: number, fromEnd?: boolean): number;
}
export declare class ComparatorCollection<TValue> extends Array__<TValue> {
    readonly _comparator: Projector<TValue, Primitive> | undefined;
    constructor(comparator: Projector<TValue, Primitive>, ...items: TValue[]);
}
export declare class PrimitiveCollection<TValue extends Primitive> extends Array__<TValue> {
    unique(): PrimitiveCollection<TValue>;
    removeRange(from: Primitive, to: Primitive): PrimitiveCollection<TValue>;
}
export declare class NumericCollection extends PrimitiveCollection<number> {
    median(): number | undefined;
    static fromRange(from: number, to: number): NumericCollection;
}
export declare class Dictionary<TValue = any, TKey extends string = string> {
    private _obj;
    private _comparer?;
    constructor(entries?: Tuple<TKey, TValue>[], comparer?: Comparer<TValue, boolean>);
    static fromObject<T, K extends string>(obj: Obj<T, K>): Dictionary<T, K>;
    static fromArray<T>(arr: T[]): Dictionary<T, string>;
    static fromKeys<T>(arr: any[], defaultVal: T): Dictionary<T, string>;
    static fromProjection<K extends string, V, T = any>(items: Iterable<T>, keysProjector?: Projector<T, K>, valuesProjector?: Projector<T, V>): Dictionary<V, K>;
    get length(): number;
    get(key: TKey): TValue | undefined;
    set(key: TKey, val: TValue): void;
    clone(): Dictionary<TValue, TKey>;
    asObject(): Obj<TValue, string>;
    entries(): Tuple<TKey, TValue>[];
    values(): Array__<TValue>;
    keys(): Array__<TKey>;
    forEach(func: Projector<TValue, void, TKey>): void;
    last(predicate?: Predicate<TValue, TKey>): Tuple<TKey, TValue>;
    lastOrDefault(predicate?: Predicate<TValue, TKey>): Tuple<TKey, TValue>;
    first(predicate?: Predicate<TValue, TKey>): Tuple<TKey, TValue>;
    firstOrDefault(predicate?: Predicate<TValue, TKey>): Tuple<TKey, TValue>;
    indexOfKey(key: TKey): number;
    keyOf(val: TValue): TKey;
    hasKey(key: TKey): boolean;
    hasValue(val: TValue): boolean;
    union(other: Dictionary<TValue, TKey>, reducer?: (val1: TValue, val2: TValue) => TValue): Dictionary<TValue, TKey>;
    intersection(other: Dictionary<TValue, TKey>, valuesComparer?: Comparer<TValue, boolean>): Dictionary<TValue, TKey>;
    equals(other: Dictionary<TValue, TKey>, valuesComparer?: Comparer<TValue, boolean>): boolean;
    map<Y>(projection: Projector<TValue, Y, TKey>): Dictionary<Y, TKey>;
    mapAsync<T>(projection: AsyncProjector<TValue, T, TKey>): Promise<Dictionary<T, TKey>>;
    filter(predicate: Predicate<TValue, TKey>): Dictionary<TValue, TKey>;
    every(predicate: Predicate<TValue, TKey>): boolean;
    some(predicate: Predicate<TValue, string | number | symbol>): boolean;
}
export declare class Map__<TKey = any, TValue = any> extends global.Map<TKey, TValue> {
    private _comparer?;
    constructor(items?: Iterable<Tuple<TKey, TValue>>, comparer?: Comparer<TValue, boolean>);
    static fromProjection<K, V, T = any>(items: Iterable<T>, keysProjector?: Projector<T, K>, valuesProjector?: Projector<T, V>): Map__<K, V>;
    static fromKeys<T>(keys: Iterable<T>, seed?: any): Map__<T, any>;
    static fromObject<V, K extends string>(obj: Obj<V, K>): Map__<K, V>;
    static fromFrequencies<T>(items: Iterable<T>): Map__<T, number>;
    get length(): number;
    asObject(): Obj<TValue, string>;
    getArray(): Tuple<TKey, TValue>[];
    clone(): Map__<TKey, TValue>;
    deepClone(): void;
    intersection(other: Map__<TKey, TValue>, valuesComparer?: Comparer<TValue, boolean>): Map__<TKey, TValue>;
    equals(other: Map__<TKey, TValue>, valuesComparer?: Comparer<TValue, boolean>): boolean;
    map<T>(projection: Projector<TValue, T, TKey>): Map__<TKey, T>;
    sort(projection?: Projector<TValue, Primitive>): Map__<TKey, TValue>;
    mapAsync<T>(projection: AsyncProjector<TValue, T, TKey>): Promise<Map__<TKey, T>>;
    filter(predicate: (value: TValue, key: TKey) => boolean): Map__<TKey, TValue>;
    every(predicate: (value: TValue, key: TKey) => any): boolean;
    some(predicate: (value: TValue, key: TKey) => any): boolean;
}
export declare class Set__<T = any> extends global.Set<T> {
    private _comparer;
    constructor(items: Iterable<T>, comparer?: Comparer<T, boolean>);
    clone(): Set__<T>;
    get length(): number;
    has(value: T, comparer?: Comparer<T, boolean>): boolean;
    add(value: T, comparer?: Comparer<T, boolean>): this;
    append(items: Iterable<T>, comparer?: Comparer<T, boolean>): Set__<T>;
    equals(other: Set__<T>, comparer?: Comparer<T, boolean>): boolean;
    /**
     * Returns a new set with elements that occur both in this set and other input sets
     * @param comparisonProjector Optional projector of primitive result type for comparing elements
     */
    static intersection<T>(sets: Iterable<Set__<T>>, comparer?: Comparer<T, boolean>): Set__<T>;
    /**
     * Returns a new set with elements that occur in only one of all the input sets
     * @param comparisonProjector Optional projector of primitive result type for comparing elements
     */
    static difference<T>(sets: Iterable<Set__<T>>, comparer?: Comparer<T, boolean>): Set__<T>;
    /**
     * Returns a new set with elements that occur in at least one of all the input sets
     * @param comparisonProjector Optional projector of primitive result type for comparing elements
     */
    static union<T>(sets: Iterable<Set__<T>>, comparer?: Comparer<T, boolean>): Set__<T>;
    except(other: Set__<T>, comparer?: Comparer<T, boolean>): Set__<T>;
    /**
     * Returns a new set with elements derived by applying a projection to this set's elements
     * @param projection projection function of primitive result type
     */
    map<TResult>(projection: Projector<T, TResult>): Set__<TResult>;
    filter(predicate: Predicate<T>): Set__<T>;
    every(predicate: Predicate<T>): boolean;
    some(predicate: Predicate<T>): boolean;
}
export declare class Stack<T> {
    _size: number;
    _storage: Obj<T>;
    constructor(...initial: T[]);
    push(data: T): void;
    pop(): T | void;
}
export {};
