import { DTOsMap } from "./repository";
export declare const Repository: new (config: {
    baseUrl: string;
}, dtoNames: never[]) => import("./repository").RepositoryGroup<DTOsMap>;
