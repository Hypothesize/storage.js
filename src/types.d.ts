type Obj<TValue = any, TKey extends string = string> = { [key in TKey]: TValue }
type ExtractByType<TObj, TType> = Pick<TObj, { [k in keyof TObj]-?: TObj[k] extends TType ? k : never }[keyof TObj]>
type Primitive = number | string

interface Ctor<TArgs = {}, TObj = {}> { new (args: TArgs): TObj }