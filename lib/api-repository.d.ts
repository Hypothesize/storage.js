import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: {
    baseUrl: string;
}, dtoNames: string[]) => import("./repository").RepositoryGroup<O>;
