import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: {
    baseUrl: string;
}, dtosMap: O) => import("./repository").RepositoryGroup<O>;
