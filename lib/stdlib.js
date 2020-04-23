"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
exports.Tuple = class {
    constructor(x, y) {
        return [x, y];
    }
};
class Object__ extends global.Object {
    static keys(obj) {
        return super.keys(obj); //as K[]
    }
    static omit(obj, ...keys) {
        let result = obj;
        keys.forEach(k => delete result[k]);
        return result;
    }
    static pick(obj, ...keys) {
        let result = {};
        keys.forEach(k => result[k] = obj[k]);
        return result;
    }
    static clone(value /*, maxDepth: number = 7, depth: number = 0*/) {
        return lodash_1.cloneDeep(value);
    }
    static hasValue(value) {
        if (typeof value === "undefined")
            return false;
        if (value === undefined)
            return false;
        if (value === null)
            return false;
        let str = value.toString();
        if (str.trim().length === 0)
            return false;
        if (/^\s*$/.test(str))
            return false;
        //if(str.replace(/\s/g,"") == "") return false
        return true;
    }
    static shallowEquals(obj1, obj2, ignoreUnmatchedProps = false) {
        // let x = typeof obj1
        if (typeof obj1 !== typeof obj2) {
            return false;
        }
        else if (typeof obj1 === "function") {
            return obj1.toString() === obj2.toString();
        }
        else if (typeof obj1 !== "object") {
            return obj1 === obj2;
        }
        else {
            let keysToCheck = ignoreUnmatchedProps
                ? Set__.intersection([new Set__(Object.keys(obj1)), new Set__(Object.keys(obj2))])
                : Set__.union([new Set__(Object.keys(obj1)), new Set__(Object.keys(obj2))]);
            return keysToCheck.every(key => obj1[key] === obj2[key]);
        }
    }
    static fromKeyValues(...keyValues) {
        let obj = {};
        keyValues.forEach(kvp => {
            obj[kvp[0]] = kvp[1];
        });
        return obj;
    }
    static duplicateKeys(obj, defaultValue) {
        let _obj = {};
        Object.keys(obj).forEach(key => _obj[key] = defaultValue);
        return _obj;
    }
    /**
     * Merges source onto target
     * Returns a new object only if the resulting content will be different from both taget and source
     *
     */
    static merge(target, source) {
        if (target === null || target === undefined)
            return source;
        //return Object__.clone(source) as Y
        else if (source === null || source === undefined)
            // return target as X
            return Object__.clone(target);
        else if (typeof source !== "object" || typeof target !== "object")
            // return source as Y
            return Object__.clone(source);
        else {
            let result = Object__.clone(target);
            // let result = { ...target as any as object } as X
            return lodash_1.mergeWith(result, source, (objValue, srcValue) => {
                if (Array.isArray(objValue)) {
                    if (srcValue === undefined)
                        return objValue;
                    else
                        return srcValue;
                }
            });
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
    static isIterable(val) {
        return val !== null &&
            val !== undefined &&
            typeof val[Symbol.iterator] === 'function';
    }
}
exports.Object__ = Object__;
class String__ extends String {
    constructor(str) {
        super(str);
    }
    isWhiteSpace() {
        return this.replace(/^\s+|\s+$/g, '').length === 0;
    }
    getCharacters() {
        let _arr = Array__.fromLength(this.length);
        for (let index = 0; index < this.length; index++) {
            console.assert(this[index] != null, `String.getCharacters(): char as index ${index} is undefined`);
            let str = new String__(this[index]);
            console.assert(str, `String.getCharacters(): new String is undefined`);
            _arr.set({ index: index, value: str });
        }
        return _arr;
    }
    getArrayFromCsv() {
        const _arr = new Array__();
        if (this[0] !== "," || this[this.length - 1] !== ",") {
            throw new Error("The string is not properly formatted");
        }
        return this.substring(1, this.length - 1) === ""
            ? new Array__()
            : new Array__(this.substring(1, this.length - 1).split(","));
    }
    trimLeft(...strings) {
        let str = this.toString();
        strings.forEach(_str => {
            if (str.toLowerCase().startsWith(_str.toLowerCase()))
                str = str.substr(_str.length);
        });
        return str;
    }
    trimRight(...strings) {
        let str = this.toString();
        strings.forEach(_str => {
            if (str.toLowerCase().endsWith(_str.toLowerCase()))
                str = str.substr(0, str.length - _str.length);
        });
        return str;
    }
    tokenizeWords(separateCaseBoundary = "none", seperatorChars) {
        //console.log(`starting tokenizeWords for "${this.valueOf()}"`)
        var separators = seperatorChars || [" ", "\t"];
        //console.log(`effective separators are "${separators}"`)
        var words = [];
        var currentWord = "";
        var lastChar = this[0];
        let pushWord = (str = "") => {
            if (currentWord.length > 0) {
                words.push(currentWord);
                //console.log(`pushed ${currentWord} to words, now ${JSON.stringify(words)}`)
            }
            //console.log(`set currentWord to ${str}`)
            currentWord = str;
        };
        let chars = this.getCharacters();
        //console.log(`chars array: ${JSON.stringify(chars)}`)
        for (let ch of chars) {
            console.assert(ch, `String.tokenizeWords(): ch is undefined`);
            //console.log(`testing char "${ch.valueOf()}"`)
            if (separators.includes(ch.valueOf())) {
                //console.log(`separators include char tested, will push ${currentWord} to words`)
                pushWord();
            }
            else {
                //console.log(`separators do not include char tested, testing for case boundary`)
                let nowCase = ch.getCase();
                let lastCase = new String__(lastChar).getCase();
                let test = ((separateCaseBoundary === "none") ||
                    (separators.includes(lastChar)) ||
                    (lastCase === undefined) ||
                    (nowCase === undefined) ||
                    (nowCase !== separateCaseBoundary) ||
                    (nowCase === lastCase));
                if (test === false) {
                    //console.log(`case boundary test is true, pushing `)
                    pushWord(ch.valueOf());
                }
                else {
                    //console.log(`case boundary test is false, concatenating char to currentWord`)
                    currentWord = currentWord.concat(ch.valueOf());
                    //console.log(`currentWord concatenated to ${currentWord}`)
                }
            }
            // TTLoUKmidiForm
            // TTL-o-UK-midi-F-orm
            lastChar = ch.valueOf();
            //console.log(`lastChar set to ${lastChar}`)
        }
        //console.log(`Outta loop, pushing currentWord "${currentWord}" to words`)
        pushWord();
        return new Array__(words).map(x => new String__(x));
    }
    toSnakeCase() {
        return new String__(this.tokenizeWords("upper", ["-", "_", " ", "    ", "\t"]).join("_"));
    }
    toCamelCase() {
        return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }
    toSpace() {
        return new String__(this.tokenizeWords("upper", ["-", "_", " ", "    ", "\t"]).join(" "));
    }
    toTitleCase() {
        let str = this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        return new String__(str);
    }
    /**
     * Shorten a string by placing an ellipsis at the middle of it.
     * @param maxLen is the maximum length of the new shortened string
     */
    shorten(maxLen) {
        let title = this.toString();
        if (title.length <= maxLen)
            return new String__(title);
        let i = 0, j = title.length - 1;
        let left = "", right = "";
        let leftCount = 0, rightCount = 0;
        while (true) {
            left += title[i];
            leftCount += 1;
            i += 1;
            if (leftCount + rightCount + 3 >= maxLen)
                break;
            right += title[j];
            rightCount += 1;
            j -= 1;
            if (leftCount + rightCount + 3 >= maxLen)
                break;
        }
        right = right.split("").reverse().join("");
        return new String(left + "..." + right);
    }
    isUpperCase() {
        return this.toUpperCase() === this.valueOf();
    }
    isLowerCase() {
        return this.toLowerCase() === this.valueOf();
    }
    /**
     * returns the case of input string
     * if string contains only special characters, 'upper' is returned
     * @param str the input string
     */
    getCase() {
        if (this.toLowerCase() === this.toUpperCase())
            return undefined;
        else if (this.isUpperCase())
            return "upper";
        else
            return "lower";
    }
    strip(chars) {
        if (!Array.isArray(chars))
            throw `String.strip(): Invalid chars argument type; expected 'Array'; found ${typeof (chars)}`;
        var result = "";
        for (var i = 0; i < this.length; i++) {
            if (chars.indexOf(this[i]) < 0)
                result += this[i];
        }
        return result;
    }
    /**
     * Transforms single or multiple consecutive white-space characters into single spaces
     * @param chars
     */
    cleanWhitespace(chars) {
        if (["null", "undefined", "array"].indexOf(typeof (chars)) < 0)
            throw `String.cleanWhitespace(): Invalid chars argument type; expected 'null', 'undefined', or 'array'; found ${typeof (chars)}`;
        var _chars = !(chars) ? ["\n", "\t", "\v", "\r"] : chars;
        var result = "";
        for (var i = 0; i < this.length; i++) {
            let val = this[i];
            result += (_chars.indexOf(val) < 0 ? val : " ");
        }
        return result.split(/[ ]{2,}/g).join(" ");
    }
    isEmptyOrWhitespace() {
        return this.strip([" ", "\n", "\t", "\v", "\r"]).length === 0;
    }
    plural() {
        if (this.endsWith("y")) {
            return new String__(this.substr(0, this.length - 1) + "ies");
        }
        else if (this.endsWith("sis")) {
            return new String__(this.substr(0, this.length - 3) + "ses");
        }
        else if (this.endsWith("s") || this.endsWith("x")) {
            return new String__(this + "es");
        }
        else {
            return new String__(this + "s");
        }
    }
    splitIntoChunks(size) {
        const numChunks = Math.ceil(this.length / size);
        const chunks = new Array(numChunks);
        for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
            chunks[i] = this.substr(o, size);
        }
        return chunks;
    }
    isURL() {
        var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.+)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=\\*-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return pattern.test(this.toString());
    }
}
exports.String__ = String__;
class Number__ extends global.Number {
    constructor(num) {
        super(num);
    }
    static isFloat(value) {
        let parsed = typeof value === "number"
            ? value : Number.parseFloat(value);
        return (!Number.isNaN(parsed)) && (!Number.isInteger(parsed));
    }
    static isInteger(value) {
        let parsed = typeof value === "number"
            ? value : Number.parseFloat(value);
        return (!Number.isNaN(parsed)) && (Number.isInteger(parsed));
    }
    static parse(value) {
        let parsed = typeof value === "number"
            ? value
            : Number.parseFloat(value);
        return (!Number.isNaN(parsed)) ? parsed : undefined;
    }
    static smartRounding(value) {
        let val;
        if (value !== undefined && value % 1 !== 0) {
            const powers = Math.floor(Math.log(Math.abs(value)) / Math.LN10);
            const decimals = powers > -1
                ? Math.max(0, 2 - powers) // Above 1, we show a decreasing number of decimal (> 100 we show none)
                : Math.max(-powers + 1); // Below 1, we show at least 2 decimals and perhaps more
            val = value.toFixed(decimals);
        }
        else {
            val = value !== undefined ? value.toString() : "";
        }
        return val; //`${value !== parseFloat(val) ? "~ " : ""}${val}`
    }
}
exports.Number__ = Number__;
class Collection {
    constructor() {
        this.length = 0;
    }
}
exports.Collection = Collection;
class NumberCollection extends Collection {
}
exports.NumberCollection = NumberCollection;
class OrderedCollection extends Collection {
    static equals(x, y, comparer) {
        if (x && !y)
            return false;
        if (!x && y)
            return false;
        if (!x && !y)
            return true;
        if (x.length !== y.length)
            return false;
        let _comparer = comparer || ((x, y) => x === y);
        for (let index = 0; index < x.length - 1; index++) {
            if (_comparer(x.get(index), y.get(index)) === false)
                return false;
        }
        return true;
    }
    static compare(x, y, comparer, tryNumeric = false) {
        let _x = comparer ? comparer(x) : x;
        let _y = comparer ? comparer(y) : y;
        // if (_x.toString() === "95000" || _y.toString() === "95000") {
        // 	console.log(`comparing ${_x} and ${_y} with tryNumeric=${tryNumeric}`)
        // }
        if (typeof _x === "string" && typeof _y === "string") {
            if (tryNumeric === true) {
                let __x = parseFloat(_x);
                let __y = parseFloat(_y);
                if ((!Number.isNaN(__x)) && (!Number.isNaN(__y))) {
                    return __x - __y;
                }
            }
            return new Intl.Collator().compare(_x || "", _y || "");
        }
        else if (typeof _x === "number" && typeof _y === "number") {
            return (_x || 0) - (_y || 0);
        }
        else if (_x instanceof Date && _y instanceof Date) {
            _x = _x || new Date();
            _y = _y || new Date();
            if (_x > _y)
                return 1;
            else if (_x === _y)
                return 0;
            else
                return -1;
        }
        else
            return _x === _y ? 0 : 1;
    }
    static getComparer(projector, tryNumeric = false, reverse = false) {
        //console.log(`generating comparer, try numeric is ${tryNumeric}, reversed is ${reverse} `)
        return (x, y) => {
            return OrderedCollection.compare(x, y, projector, tryNumeric) * (reverse === true ? -1 : 1);
        };
    }
}
exports.OrderedCollection = OrderedCollection;
class Array__ {
    constructor(items) {
        this.length = items ? items.length : 0;
        for (let index = 0; index < this.length; index++) {
            this[index] = items[index];
        }
    }
    [Symbol.iterator]() {
        let _index = 0;
        return {
            next: () => _index < this.length
                ? { value: this.get(_index++), done: false }
                : { done: true }
        };
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
    static fromLength(length = 0) { return new Array__(new global.Array(length)); }
    static fromArguments(...args) {
        return new Array__(Array.prototype.slice.call(arguments));
    }
    static fromIterable(arr) { return new Array__(Array.from(arr)); }
    static fromObject(obj) { return new Array__(Object__.keys(obj).map(key => obj[key])); }
    static fromRange(from, to, opts) {
        if (opts) {
            if (opts.mode === "width" && opts.width <= 0)
                throw new Error("width must be positive non-zero number");
            if (opts.mode === "count" && opts.count <= 0)
                throw new Error("count must be positive non-zero number");
        }
        let diff = to - from;
        let sign = to >= from ? 1 : -1;
        let delta = opts === undefined
            ? sign
            : opts.mode === "width"
                ? (opts.width * sign)
                : diff / opts.count;
        let length = Math.floor(diff / delta) + 1;
        let arr = new global.Array();
        for (var value = from; arr.length < length; value += delta) {
            arr.push(value);
        }
        return new Array__(arr);
    }
    clone() {
        return new Array__(this.getArray());
    }
    deepClone() {
        throw new Error(`Not Implemented`);
    }
    isDuplicated(element) {
        var alreadyOccured = false;
        for (var i = 0; i < this.length; i++) {
            if (this[i] === element) {
                if (alreadyOccured) {
                    return true;
                }
                alreadyOccured = true;
            }
        }
        return false;
    }
    getArray() {
        let _arr = new global.Array(this.length);
        for (let index = 0; index < this.length; index++)
            _arr[index] = this[index];
        return _arr;
    }
    getStringifiedArray() {
        return `,${this.join(",")},`;
    }
    getObject() {
        let obj = {};
        for (let index = 0; index < this.length; index++)
            obj[index] = this[index];
        return obj;
    }
    getNumbers(projector) {
        return this
            .map(datum => {
            if (datum === undefined) {
                throw new Error(`Tried to call getNumber() on an array including undefined values`);
            }
            let value = projector ? projector(datum) : datum;
            return typeof (value) === "number"
                ? value : Number.parseFloat(value.toString());
        })
            .filter(num => Number.isNaN(num) === false);
    }
    get(selection) {
        try {
            if (typeof selection === "number")
                return this[selection];
            else
                return [...selection].map(index => this[index]);
        }
        catch (e) {
            console.error(`Error in Array__.get(); selection is: ${selection}; typeof selection is: ${typeof selection}`);
            throw e;
        }
    }
    set(...keyValues) {
        let arr = this.getArray();
        keyValues.forEach(keyValue => {
            if (arr.length > keyValue.index) {
                arr[keyValue.index] = keyValue.value;
            }
        });
        return new Array__(arr);
    }
    merge(...keyValues) {
        let arr = this.getArray();
        keyValues.forEach(keyValue => {
            if (keyValue.index >= 0 && arr.length > keyValue.index) {
                arr[keyValue.index] = Object__.merge(arr[keyValue.index], keyValue.value);
            }
        });
        return new Array__(arr);
    }
    /**s
     *
     * @param items
     */
    append(items) {
        const newArray = this.getArray().concat(items);
        return new Array__(newArray);
    }
    /**
     * Append items to the end of this array and return the distinct elements in the result
     */
    union(items, comparator) {
        return new Array__(this.getArray().concat(items)).unique(comparator);
    }
    unique(comparator) {
        let _arr = new Map__();
        this.forEach((_item, _index) => {
            _arr.set(comparator ? comparator(_item) : _item, _item);
        });
        return Array__.fromIterable(_arr.values());
    }
    forEach(projector) {
        for (let index = 0; index < this.length; index++) {
            projector(this[index], index);
        }
    }
    map(func) {
        let _arr = new global.Array(this.length);
        this.forEach((item, index) => {
            _arr[index] = func(item, index);
        });
        //console.log(`Collection map returning array of length ${_arr.length}`)
        return new Array__(_arr);
    }
    reduce(initial, reducer) {
        let _value = initial; // initial parameter is required
        this.forEach((item, index) => {
            _value = reducer(_value, item, index);
        });
        return _value;
    }
    join(separator) {
        return (this.length === 0) ? "" : this.skip(1)
            .reduce(this.get(0).toString(), (prev, curr) => prev.toString() + separator + curr.toString());
    }
    filter(func) {
        var arr = [];
        this.forEach((item, index) => {
            if (func(item, index) === true)
                arr.push(item);
        });
        return new Array__(arr);
    }
    /**
     * Sorts an array in ascending order.
     * @param func function that generates the primitive values used to actually sort this array
     */
    sort(comparisonProjector, tryNumeric) {
        return Array__.fromIterable(this.getArray().sort((x, y) => OrderedCollection.compare(x, y, comparisonProjector, tryNumeric)));
    }
    /**
     * Sorts an array in descending order.
     * @param func function that generates the primitive values used to actually sort this array
     */
    sortDescending(comparisonProjector) {
        return this.sort(comparisonProjector).reverse();
    }
    /**
     * Returns new array containing this array's elements in reverse order.
     */
    reverse() {
        return Array__.fromIterable(this.getArray().reverse());
    }
    firstOrDefault(func) {
        for (let index = 0; index < this.length; index++)
            if (func ? func(this[index], index) === true : this[index] !== undefined)
                return this[index];
        return undefined;
    }
    first(func) {
        let firstOrDefault = this.firstOrDefault(func);
        if (firstOrDefault === undefined)
            throw new Error("First item not found");
        else
            return firstOrDefault;
    }
    lastOrDefault(func) {
        for (let index = (this.length - 1); index >= 0; index--)
            if (func ? func(this[index], index) === true : this[index] !== undefined)
                return this[index];
        return undefined;
    }
    last(func) {
        let lastOrDefault = this.lastOrDefault(func);
        if (lastOrDefault === undefined)
            throw new Error("Last item not found");
        else
            return lastOrDefault;
    }
    every(predicate) {
        return this.count(predicate) === this.length;
    }
    some(predicate) {
        return this.firstOrDefault(predicate) !== undefined;
    }
    take(count, fromEnd = false) {
        return fromEnd
            ? Array__.fromIterable(this.getArray().slice(-count))
            : Array__.fromIterable(this.getArray().slice(0, count));
    }
    skip(count, fromEnd = false) {
        return fromEnd
            ? Array__.fromIterable(this.getArray().slice(0, -count))
            : Array__.fromIterable(this.getArray().slice(count));
    }
    /**
     * Counts truthy mapped values in this array
     * This takes more time, but can be more useful than, just getting the length property
     * @param func Optional mapper applied to each element before counting
     */
    count(mapper) {
        var count = 0;
        this.forEach((item, index) => {
            if (mapper ? mapper(item, index) : item)
                count++;
        });
        return count;
    }
    sum(func) {
        var sum = 0;
        this.forEach((item, index) => {
            sum += (func ? func(item, index) : item);
        });
        return sum;
    }
    average(projector) {
        let sum = 0;
        let count = 0;
        this.forEach((item, index) => {
            let _value = projector ? projector(item, index) : item;
            if (typeof item === "number") {
                sum += _value;
                count++;
            }
        });
        if (count > 0)
            return sum / count;
        else
            return undefined;
    }
    averageExcluding(mean, valueToExclude) {
        return (mean - (1.0 * valueToExclude / this.length)) * (1.0 * this.length / (this.length - 1));
    }
    min(comparisonProjector) {
        let _min = this.firstOrDefault();
        if (this.length <= 1)
            return _min;
        this.forEach((_item, _index) => {
            let _comparison = OrderedCollection.compare(_item, _min, comparisonProjector);
            if (_comparison < 0) // _item < _min
                _min = _item;
        });
        return _min;
    }
    max(projector) {
        let _max = this.firstOrDefault();
        if (this.length <= 1)
            return _max;
        this.forEach((_item, _index) => {
            let _comparison = OrderedCollection.compare(_item, _max, projector);
            if (_comparison > 0) // _item > _max
             {
                _max = _item;
            }
        });
        return _max;
    }
    variance(projector, mean) {
        if (this.length === 0)
            return undefined;
        let numbers = this.getNumbers(projector);
        if (numbers.length === 0)
            return undefined;
        if (numbers.length === 1)
            return 0;
        let _mean = mean || numbers.average();
        return numbers.map(datum => Math.pow(datum - _mean, 2)).sum() / (numbers.length - 1);
    }
    deviation(projector) {
        let variance = this.variance(projector);
        return (variance !== undefined)
            ? Math.sqrt(variance)
            : undefined;
    }
    deviationExcluding(deviation, valueToExclude) {
        let mean = this.averageExcluding(this.average(), valueToExclude);
        return Math.sqrt(this.variance(undefined, mean));
    }
    median(comparisonProjector) {
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
    mode() {
        const freqs = this.frequencies().sort(x => x);
        return freqs.getArray()[freqs.length - 1][0];
    }
    frequency(item) {
        return this.count(_item => _item === item);
    }
    frequencies() {
        return Map__.fromFrequencies(this);
    }
    frequenciesPercentScaled() {
        return this.frequencies().map(freq => freq * 100 / this.length);
    }
    interQuartileRange() {
        var sortedList = this.sort();
        var percentile25 = sortedList[Math.floor(0.25 * sortedList.length)];
        var percentile75 = sortedList[Math.ceil(0.75 * sortedList.length)];
        return percentile75 - percentile25;
    }
    firstQuartile() {
        var sortedList = this.sort();
        return sortedList[Math.floor(0.25 * sortedList.length)];
    }
    thirdQuartile() {
        var sortedList = this.sort();
        return sortedList[Math.ceil(0.75 * sortedList.length) - 1];
    }
    removeItems(comparisonProjector, ...itemsToRemove) {
        let itemsToRemoveMapped = itemsToRemove.map(comparisonProjector);
        return this.filter(item => !itemsToRemoveMapped.includes(comparisonProjector(item)));
    }
    removeIndices(indices) {
        return this.filter((item, index) => !indices.includes(index));
    }
    removeSliceCounted(index, count) {
        return Array__.fromIterable([...this.getArray()].splice(index, count));
    }
    removeSliceDelimited(fromIndex, toIndex) {
        let arr = this.getArray();
        arr.splice(fromIndex, toIndex - fromIndex + 1);
        return new Array__(arr);
    }
    removeRange(from, to, mapper) {
        throw new Error("removeRange() invalid operation on a general array");
    }
    insert(index, ...items) {
        let arr = this.getArray();
        return Array__.fromIterable([...arr.slice(0, index), ...items, ...arr.slice(index)]);
    }
    flatten() {
        var toString = Object__.prototype.toString;
        var arrayTypeStr = '[object Array]';
        var arr = [];
        var nodes = [...this.getArray()].slice();
        var node;
        if (!this.length) {
            return new Array__(arr);
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
        return new Array__(arr);
    }
    /**
     * Determines whether an array includes a certain element, returning true or false as appropriate.
     * @param searchElement The element to search for.
     * @param fromIndex The position in this array at which to begin searching for searchElement.
     */
    contains(obj, fromIndex) {
        return ([...this.getArray()].indexOf(obj, fromIndex) >= 0);
    }
    /**
     *
     * @param func Returns the index of the first element that meets a condition (or )
     * @param fromIndex
     */
    indexOfFirst(predicate, fromIndex) {
        for (let index = fromIndex || 0; index < this.length; index++)
            if (predicate ? predicate(this[index], index) : this[index] !== undefined)
                return index;
        return -1;
    }
    indexOf(val, fromIndex = 0, fromEnd = false) {
        // let isIterable = val != null && typeof val[Symbol.iterator] === 'function'
        if (Object__.isIterable(val) && typeof val !== "string") {
            let arr = [...val];
            //function find_csa(arr, subarr, from_index) {
            var i = fromIndex >>> 0;
            var arrLength = arr.length;
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
            return [...this.getArray()].indexOf(val, fromEnd ? -fromIndex : fromIndex);
        }
    }
}
exports.Array__ = Array__;
class ComparatorCollection extends Array__ {
    constructor(comparator, ...items) {
        super(items);
        this._comparator = comparator;
    }
}
exports.ComparatorCollection = ComparatorCollection;
class PrimitiveCollection extends Array__ {
    unique() {
        let _arr = [];
        for (let _item of [...this.getArray()]) {
            if (!_arr.includes(_item))
                _arr.push(_item);
        }
        return new PrimitiveCollection(_arr);
    }
    removeRange(from, to) {
        return this.filter((item, index) => item > to || item < from);
    }
}
exports.PrimitiveCollection = PrimitiveCollection;
class NumericCollection extends PrimitiveCollection {
    median() {
        let _ordered = this.sort();
        if (_ordered.length % 2) {
            var first = _ordered.get(Math.floor(_ordered.length / 2));
            let second = _ordered.get(Math.floor(_ordered.length / 2));
            return (first + second) / 2;
        }
        else {
            return _ordered.get(Math.floor(this.length / 2));
        }
    }
    static fromRange(from, to) {
        let _difference = to - from;
        let _length = Math.abs(_difference);
        let _sign = _difference / _length;
        let _index = 0;
        let _value = from;
        let _arr = new Array__([_length]);
        while (true) {
            _arr[_index++] = _value;
            if (_value === to)
                break;
            _value += _sign;
        }
        return new NumericCollection(_arr.getArray());
    }
}
exports.NumericCollection = NumericCollection;
class Dictionary {
    constructor(entries, comparer) {
        this._obj = {};
        if (entries)
            entries.forEach(entry => {
                this._obj[entry[0]] = entry[1];
            });
        this._comparer = comparer;
    }
    static fromObject(obj) {
        if (!obj)
            throw new Error(`Obj argument missing in Dictionary.fromObject(...)`);
        return new Dictionary(Object.keys(obj).map((key, index) => new exports.Tuple(key, obj[key])));
    }
    static fromArray(arr) {
        return new Dictionary(arr.map((element, index) => new exports.Tuple(index.toString(), element)));
    }
    static fromKeys(arr, defaultVal) {
        return new Dictionary(arr.map((element, index) => new exports.Tuple(element.toString(), defaultVal)));
    }
    static fromProjection(items, keysProjector, valuesProjector) {
        return new Dictionary([...items].map(item => {
            let key = (keysProjector ? keysProjector(item) : item);
            let value = (valuesProjector ? valuesProjector(item) : item);
            return new exports.Tuple(key, value);
        }));
    }
    get length() {
        return Object__.keys(this._obj).length;
    }
    get(key) {
        return this._obj[key];
    }
    set(key, val) {
        this._obj[key] = val;
    }
    clone() {
        return new Dictionary(this.entries(), this._comparer);
    }
    asObject() {
        let _obj = {};
        Object__.keys(this._obj).forEach(key => {
            _obj[key] = this._obj[key];
        });
        return _obj;
    }
    entries() {
        let _arr = [];
        for (let key of Object__.keys(this._obj)) {
            _arr.push(new exports.Tuple(key, this._obj[key]));
        }
        return _arr;
    }
    values() {
        return new Array__(Object__.keys(this._obj).map(key => this._obj[key]));
    }
    keys() {
        return new Array__(Object__.keys(this._obj));
    }
    forEach(func) {
        this.entries().forEach(entry => {
            func(entry[1], entry[0]);
        });
    }
    last(predicate) {
        return new Array__(this.entries())
            .last(predicate ? entry => predicate(entry[1], entry[0]) : undefined);
    }
    lastOrDefault(predicate) {
        return new Array__(this.entries())
            .lastOrDefault(predicate ? entry => predicate(entry[1], entry[0]) : undefined);
    }
    first(predicate) {
        return new Array__(this.entries())
            .first(predicate ? entry => predicate(entry[1], entry[0]) : undefined);
    }
    firstOrDefault(predicate) {
        return new Array__(this.entries())
            .firstOrDefault(predicate ? entry => predicate(entry[1], entry[0]) : undefined);
    }
    indexOfKey(key) {
        return this.keys().indexOf(key);
    }
    keyOf(val) {
        for (let entry of this.entries()) {
            if (entry[1] === val)
                return entry[0];
        }
        return undefined;
    }
    hasKey(key) {
        return this.keys().indexOf(key) >= 0;
    }
    hasValue(val) {
        return this.values().indexOf(val) >= 0;
    }
    union(other, reducer) {
        if (reducer === undefined && this.keys().some(key => other.keys().contains(key)))
            throw new Error(`Duplicate keys found and no reducer provided`);
        let dict = new Dictionary();
        this.entries().forEach(entry => {
            dict.set(entry[0], entry[1]);
        });
        other.entries().forEach(entry => {
            let key = entry[0];
            let val = dict.hasKey(key) ? reducer(dict.get(key), entry[1]) : entry[1];
            dict.set(key, val);
        });
        return dict;
    }
    intersection(other, valuesComparer) {
        if (!other)
            return new Dictionary();
        let _comparer = valuesComparer || this._comparer;
        return this.filter((value, key) => other.hasKey(key) && (_comparer
            ? (_comparer(other.get(key), value) === true)
            : (other.get(key) === value)));
    }
    equals(other, valuesComparer) {
        if (!other)
            return false;
        let _comparer = valuesComparer || this._comparer;
        return this.length === other.length &&
            this.intersection(other, _comparer).length === this.length;
    }
    // sort(projection: Projector<TValue, Primitive>) {
    //     const entries = new Array__(this.entries()).sort(entry => projection(entry[1])).getArray()
    //     let result = new Dictionary(entries);
    //     return result
    // }
    map(projection) {
        return new Dictionary(this.entries().map((entry, index) => {
            return new exports.Tuple(entry[0], projection(entry[1], entry[0]));
        }));
    }
    mapAsync(projection) {
        return __awaiter(this, void 0, void 0, function* () {
            var _map = new Dictionary();
            let promisesArr = this.entries()
                .map(entry => projection(entry[1], entry[0]));
            let resolvedArr = yield Promise.all(promisesArr);
            return new Dictionary(resolvedArr);
        });
    }
    filter(predicate) {
        return new Dictionary(this.entries().filter(entry => predicate(entry[1], entry[0]) === true));
    }
    every(predicate) {
        return this.entries().every(entry => predicate(entry[1], entry[0]));
    }
    some(predicate) {
        return this.entries().some(entry => predicate(entry[1], entry[0]));
    }
}
exports.Dictionary = Dictionary;
class Map__ extends global.Map /*implements Collection<Tuple<TKey, TValue>>*/ {
    constructor(items, comparer) {
        super([...items || []].map(tuple => [tuple[0], tuple[1]]));
        this._comparer = comparer;
    }
    static fromProjection(items, keysProjector, valuesProjector) {
        return new Map__([...items].map(item => {
            let key = (keysProjector ? keysProjector(item) : item);
            let value = (valuesProjector ? valuesProjector(item) : item);
            return new exports.Tuple(key, value);
        }));
    }
    static fromKeys(keys, seed) {
        return new Map__([...keys].map(_key => new exports.Tuple(_key, seed)));
    }
    static fromObject(obj) {
        if (!obj)
            return new Map__();
        return Object__.keys(obj)
            .reduce((map, key) => map.set(key, obj[key]), new Map__());
    }
    static fromFrequencies(items) {
        let freqs = new Map__(); //semi-colon required at end of this statement
        [...items].forEach(item => {
            freqs.set(item, (freqs.get(item) || 0) + 1);
        });
        return freqs;
    }
    get length() {
        return [...this.keys()].length;
    }
    asObject() {
        let _obj = {};
        this.forEach((_value, _key) => {
            _obj[_key.toString()] = _value;
        });
        return _obj;
    }
    getArray() {
        return [...this.keys()].map(key => [key, this.get(key)]);
    }
    clone() {
        return new Map__([...this.entries()], this._comparer);
    }
    deepClone() {
        throw new Error("Not implemented");
    }
    intersection(other, valuesComparer) {
        if (!other)
            return new Map__();
        let _comparer = valuesComparer || this._comparer;
        return this
            .filter((value, key) => other.has(key) && (_comparer
            ? (_comparer(other.get(key), value) === true)
            : (other.get(key) === value)));
    }
    equals(other, valuesComparer) {
        if (!other)
            return false;
        let _comparer = valuesComparer || this._comparer;
        return this.length === other.length && this.intersection(other, _comparer).length === this.length;
    }
    map(projection) {
        var _map = new Map__();
        this.forEach((_value, _key) => {
            _map.set(_key, projection(_value, _key));
        });
        return _map;
    }
    sort(projection) {
        return new Map__([...this.getArray()]
            .sort((x, y) => OrderedCollection.compare(x[1], y[1], projection)));
    }
    mapAsync(projection) {
        return __awaiter(this, void 0, void 0, function* () {
            var _map = new Map__();
            let promisesArr = this.getArray()
                .map(entry => projection(entry[1], entry[0]));
            let resolvedArr = yield Promise.all(promisesArr);
            return new Map__(resolvedArr);
        });
    }
    filter(predicate) {
        let arr = [];
        for (let entry of this.entries()) {
            if (predicate(entry[1], entry[0]) === true)
                arr.push(new exports.Tuple(entry[0], entry[1]));
        }
        return new Map__(arr);
    }
    every(predicate) {
        for (let entry of this.entries()) {
            if (predicate(entry[1], entry[0]) === false)
                return false;
        }
        return true;
    }
    some(predicate) {
        for (let entry of this.entries()) {
            if (predicate(entry[1], entry[0]) === true)
                return true;
        }
        return false;
    }
}
exports.Map__ = Map__;
class Set__ extends global.Set /*implements Hypothesize.StdLib.Set<T>*/ {
    constructor(items, comparer) {
        super();
        for (let item of items) {
            if (!this.has(item, comparer))
                this.add(item);
        }
    }
    clone() {
        return new Set__([...this.keys()], this._comparer);
    }
    get length() {
        return [...this.keys()].length;
    }
    has(value, comparer) {
        let _comparer = comparer || this._comparer;
        return _comparer
            ? this.some(x => _comparer(x, value))
            : super.has(value);
    }
    add(value, comparer) {
        let _comparer = comparer || this._comparer;
        if (_comparer && this.has(value, _comparer))
            return this;
        super.add(value);
        return this;
    }
    append(items, comparer) {
        return new Set__([...this.keys(), ...items], comparer || this._comparer);
    }
    equals(other, comparer) {
        if (this.length !== other.length)
            return false;
        return Set__.difference([this, other], comparer || this._comparer).length === 0;
    }
    /**
     * Returns a new set with elements that occur both in this set and other input sets
     * @param comparisonProjector Optional projector of primitive result type for comparing elements
     */
    static intersection(sets, comparer) {
        let passed = new Set__([]);
        let failed = new Set__([]);
        for (let set of [...sets].filter(_set => _set && _set.length > 0)) {
            for (let item of set) {
                if (passed.has(item, comparer))
                    continue;
                if (failed.has(item, comparer))
                    continue;
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
    static difference(sets, comparer) {
        let result = new Set__([], comparer);
        for (let set of sets)
            for (let item of set) {
                if (result.has(item, comparer)) {
                    result.delete(item);
                }
                else {
                    result.add(item);
                }
            }
        return result;
    }
    /**
     * Returns a new set with elements that occur in at least one of all the input sets
     * @param comparisonProjector Optional projector of primitive result type for comparing elements
     */
    static union(sets, comparer) {
        let result = new Set__([], comparer);
        for (let set of sets)
            for (let item of set) {
                if (!result.has(item, comparer)) {
                    result.add(item);
                }
            }
        return result;
    }
    except(other, comparer) {
        return new Set__([...this.keys()].filter(item => !other.has(item, comparer || this._comparer)));
    }
    /**
     * Returns a new set with elements derived by applying a projection to this set's elements
     * @param projection projection function of primitive result type
     */
    map(projection) {
        return new Set__([...this.keys()].map(projection));
    }
    filter(predicate) {
        return new Set__([...this.keys()].filter(predicate));
    }
    every(predicate) {
        return [...this.keys()].every(predicate);
    }
    some(predicate) {
        return [...this.keys()].some(predicate);
    }
}
exports.Set__ = Set__;
class Stack {
    constructor(...initial) {
        this._size = 0;
        this._storage = {};
        for (let item of initial)
            this.push(item);
    }
    push(data) {
        var size = ++this._size;
        this._storage[size] = data;
    }
    ;
    pop() {
        var size = this._size;
        let deletedData;
        if (size) {
            deletedData = this._storage[size];
            delete this._storage[size];
            this._size--;
            return deletedData;
        }
    }
}
exports.Stack = Stack;
