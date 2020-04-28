import { DTOsMap } from "./repository";
export declare const Repository: new (config: {
    baseUrl: string;
}) => import("./repository").RepositoryGroup<DTOsMap>;
