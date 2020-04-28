import { DTOsMap } from "./repository";
export declare const Repository: <D extends DTOsMap>() => new (config: {
    baseUrl: string;
}, dtoNames: Extract<keyof D, string>[]) => import("./repository").RepositoryGroup<D>;
