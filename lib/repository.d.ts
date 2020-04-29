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
