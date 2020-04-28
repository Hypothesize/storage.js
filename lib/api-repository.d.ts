import { DTOsMap } from "./repository";
export declare const Repository: new (config: {
    baseUrl: string;
}, dtosMap: DTOsMap) => import("./repository").RepositoryGroup<DTOsMap>;
