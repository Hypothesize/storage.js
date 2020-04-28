export declare type Obj<TValue = any, TKey extends string = string> = {
    [key in TKey]: TValue;
};
export declare type ExtractByType<TObj, TType> = Pick<TObj, {
    [k in keyof TObj]-?: TObj[k] extends TType ? k : never;
}[keyof TObj]>;
export declare type Primitive = number | string;
export declare namespace Filters {
    interface Base<TObj extends Obj<Primitive>, TVal extends Primitive | null> {
        fieldName: keyof (ExtractByType<TObj, TVal>);
        value: TVal;
        negated?: boolean;
    }
    interface Categorical<T extends Obj<Primitive>> extends Base<T, Primitive | null> {
        operator: "equal" | "not_equal";
    }
    interface Ordinal<T extends Obj<Primitive>> extends Base<T, number> {
        operator: "greater" | "greater_or_equal" | "less" | "less_or_equal";
        negated?: boolean;
    }
    interface Textual<T extends Obj<Primitive>> extends Base<T, string> {
        operator: "contains" | "starts_with" | "ends_with";
    }
    interface Statistical<T extends Obj<Primitive>> extends Base<T, number> {
        operator: "is_outlier_by";
    }
}
export declare type Filter<T extends Obj<Primitive> = Obj<Primitive>> = (Filters.Categorical<T> | Filters.Ordinal<T> | Filters.Textual<T> | Filters.Statistical<T>);
export interface FilterGroup<T extends Obj = Obj> {
    /** combinator default is "and" */
    combinator?: "or" | "and";
    filters: (Filter<T> | FilterGroup<T>)[];
}
export interface RepositoryReadonly<E extends keyof DTOsMap> {
    /** find one entity object with a specific id, throws exception if not found */
    findAsync(id: string): Promise<FromStore<E>>;
    /** get entity objects with optional parent and additional filters ... */
    getAsync(args: {
        parentId: string;
        filters?: FilterGroup<FromStore<E>>;
    }): Promise<FromStore<E>[]>;
}
export interface RepositoryEditable<E extends keyof DTOsMap> extends RepositoryReadonly<E> {
    saveAsync: (obj: ToStore<E>) => Promise<FromStore<E>>;
}
export interface Repository<E extends keyof DTOsMap> extends RepositoryEditable<E> {
    deleteAsync: (id: string) => Promise<void>;
}
export declare type RepositoryGroup<X extends DTOsMap> = {
    [key in keyof X]: Repository<string>;
};
export declare type PassedObjects<X extends DTOsMap, I = {}> = {
    [key in keyof X]: DTO;
};
interface Ctor<TArgs = {}, TObj = {}> {
    new (args: TArgs): TObj;
}
export declare type DTO = {
    toStorage: Object & {
        id?: string;
    };
    fromStorage: Object;
};
export declare type DTOsMap = {
    [key: string]: DTO;
};
export declare type ToStore<E extends keyof DTOsMap> = DTOsMap[E]["toStorage"];
export declare type FromStore<E extends keyof DTOsMap> = DTOsMap[E]["fromStorage"];
export interface IOProvider<X = {}> {
    /** find one entity object, throws exception if not found */
    findAsync: <E extends Extract<keyof DTOsMap, string>>(args: {
        entity: E;
        id: string;
    }) => Promise<FromStore<E>>;
    /** get a set of entity objects */
    getAsync: <E extends Extract<keyof DTOsMap, string>>(args: {
        entity: E;
        parentId?: string;
        filters?: FilterGroup<FromStore<E>>;
    }) => Promise<FromStore<E>[]>;
    saveAsync: <E extends Extract<keyof DTOsMap, string>>(args: {
        entity: E;
        obj: ToStore<E>;
        mode: "insert" | "update";
    }) => Promise<FromStore<E>>;
    deleteAsync: <E extends Extract<keyof DTOsMap, string>>(args: {
        entity: E;
        id: string;
    }) => Promise<void>;
    extensions: X;
}
/**
 *
 * @param ioProviderClass
 * @param repos The individual repositories: tables, users...
 */
export declare function generate<C, X, O extends DTOsMap>(repos: O, ioProviderClass: Ctor<C, IOProvider<X>>): new (config: C) => RepositoryGroup<O>;
export {};
