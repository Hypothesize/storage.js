import { DTOsMap } from "./repository";
export declare const Repository: (dtosMap: DTOsMap) => new (config: {
    baseUrl: string;
}) => import("./repository").RepositoryGroup<DTOsMap>;
