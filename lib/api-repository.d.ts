import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: {
    baseUrl: string;
}, dtosMap: DTOsMap) => import("./repository").RepositoryGroup<O>;
