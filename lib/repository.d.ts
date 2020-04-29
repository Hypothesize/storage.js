declare type DTO = {
    toStorage: Object & {
        id?: string;
    };
    fromStorage: Object;
};
declare type DTOsMap = {
    [key: string]: DTO;
};
interface IOProvider<X = {}, D extends DTOsMap = DTOsMap> {
    /** find one entity object, throws exception if not found */
    findAsync: <E extends Extract<keyof D, string>>(args: {
        entity: E;
        id: string;
    }) => Promise<D[E]["fromStorage"]>;
    /** get a set of entity objects */
    getAsync: <E extends Extract<keyof D, string>>(args: {
        entity: E;
        parentId?: string;
        filters?: FilterGroup<D[E]["fromStorage"]>;
    }) => Promise<D[E]["fromStorage"][]>;
    saveAsync: <E extends Extract<keyof D, string>>(args: {
        entity: E;
        obj: D[E]["toStorage"];
        mode: "insert" | "update";
    }) => Promise<D[E]["fromStorage"]>;
    deleteAsync: <E extends Extract<keyof D, string>>(args: {
        entity: E;
        id: string;
    }) => Promise<void>;
    extensions: X;
}
declare namespace Filters {
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
declare type Filter<T extends Obj<Primitive> = Obj<Primitive>> = (Filters.Categorical<T> | Filters.Ordinal<T> | Filters.Textual<T> | Filters.Statistical<T>);
interface FilterGroup<T extends Obj = Obj> {
    /** combinator default is "and" */
    combinator?: "or" | "and";
    filters: (Filter<T> | FilterGroup<T>)[];
}
export interface RepositoryReadonly<D extends DTOsMap, E extends keyof D> {
    /** find one entity object with a specific id, throws exception if not found */
    findAsync(id: string): Promise<D[E]["fromStorage"]>;
    /** get entity objects with optional parent and additional filters ... */
    getAsync(args: {
        parentId: string;
        filters?: FilterGroup<D[E]["fromStorage"]>;
    }): Promise<D[E]["fromStorage"][]>;
}
export interface RepositoryEditable<D extends DTOsMap, E extends keyof D> extends RepositoryReadonly<D, E> {
    saveAsync: (obj: D[E]["toStorage"]) => Promise<D[E]["fromStorage"]>;
}
export interface Repository<D extends DTOsMap, E extends keyof DTOsMap> extends RepositoryEditable<D, E> {
    deleteAsync: (id: string) => Promise<void>;
}
export declare type RepositoryGroup<X extends DTOsMap> = {
    [key in keyof X]: Repository<X, Extract<keyof X, string>>;
};
/**
 *
 * @param ioProviderClass
 * @param repos The individual repositories: tables, users...
 */
export declare function generate<X, D extends DTOsMap>(ioProviderClass: Ctor<object, IOProvider<X, D>>): new (config: object, dtoNames: Extract<keyof D, string>[]) => RepositoryGroup<D>;
export {};
