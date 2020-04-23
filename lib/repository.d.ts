export interface Repository<E extends keyof DTOsMap> extends RepositoryEditable<E> {
    deleteAsync: (id: string) => Promise<void>;
}
export interface RepositoryGroup<X = {}> {
    projects: Repository<"projects">;
    tables: Repository<"tables">;
    analyses: Repository<"analyses">;
    columns: RepositoryEditable<"columns">;
    results: RepositoryReadonly<"results">;
    extensions: X;
}
declare type DTOsMap = Hypothesize.Entities.Map;
declare type ToStore<E extends keyof DTOsMap> = DTOsMap[E]["toStorage"];
declare type FromStore<E extends keyof DTOsMap> = DTOsMap[E]["fromStorage"];
interface RepositoryReadonly<E extends keyof DTOsMap> {
    /** find one entity object with a specific id, throws exception if not found */
    findAsync(id: string): Promise<FromStore<E>>;
    /** get entity objects with optional parent and additional filters ... */
    getAsync(args: {
        parentId: string;
        filters?: Hypothesize.Data.FilterGroup<FromStore<E>>;
    }): Promise<FromStore<E>[]>;
}
interface RepositoryEditable<E extends keyof DTOsMap> extends RepositoryReadonly<E> {
    saveAsync: (obj: ToStore<E>) => Promise<FromStore<E>>;
}
interface IOProvider<X = {}> {
    /** find one entity object, throws exception if not found */
    findAsync: <E extends keyof DTOsMap>(args: {
        entity: E;
        id: string;
    }) => Promise<FromStore<E>>;
    /** get a set of entity objects */
    getAsync: <E extends keyof DTOsMap>(args: {
        entity: E;
        parentId?: string;
        filters?: Hypothesize.Data.FilterGroup<FromStore<E>>;
    }) => Promise<FromStore<E>[]>;
    saveAsync: <E extends keyof DTOsMap>(args: {
        entity: E;
        obj: ToStore<E>;
        mode: "insert" | "update";
    }) => Promise<FromStore<E>>;
    deleteAsync: <E extends keyof DTOsMap>(args: {
        entity: E;
        id: string;
    }) => Promise<void>;
    extensions: X;
}
export declare function generate<C, X>(ioProviderClass: Hypothesize.Ctor<C, IOProvider<X>>): new (config: C) => RepositoryGroup<X>;
export {};
