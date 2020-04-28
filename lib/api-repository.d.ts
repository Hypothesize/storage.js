import { DTOsMap } from "./repository";
export declare const Repository: new (config: {
    baseUrl: string;
}, dtoNames: string[]) => import("./repository").RepositoryGroup<DTOsMap>;
