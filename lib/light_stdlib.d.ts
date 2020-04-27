declare type Obj<TValue = any, TKey extends string = string> = {
    [key in TKey]: TValue;
};
declare type Primitive = number | string | Date;
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
export declare class String__ extends String {
    constructor(str: string);
    isWhiteSpace(): boolean;
    getCharacters(): Array__<String__>;
    getArrayFromCsv<T extends Primitive>(): Array__<T>;
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
export declare class Array__<TValue = any> {
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
    /**s
     *
     * @param items
     */
    append(items: TValue[]): Array__<TValue>;
    forEach(projector: Projector<TValue, void>): void;
    map<TResult>(func: Projector<TValue, TResult>): Array__<TResult>;
    reduce<TResult>(initial: TResult, reducer: Reducer<TValue, TResult>): TResult;
    join<TResult>(separator: string): string;
    filter(func: Predicate<TValue>): Array__<TValue>;
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
    variance(projector?: Projector<TValue, number>, mean?: number): number | undefined;
    deviation(projector?: Projector<TValue, number>): number | undefined;
    deviationExcluding(deviation: number, valueToExclude: number): number;
    frequency(item: TValue): number;
    removeItems(comparisonProjector: Projector<TValue, Primitive>, ...itemsToRemove: TValue[]): Array__<TValue>;
    removeIndices(indices: number[]): Array__<TValue>;
    removeSliceCounted(index: number, count: number): Array__<TValue>;
    removeSliceDelimited(fromIndex: number, toIndex: number): Array__<TValue>;
    removeRange(from: TValue, to: TValue, mapper: Projector<TValue, Primitive>): Array__<TValue>;
    insert(index: number, ...items: TValue[]): Array__<TValue>;
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
}
export {};
