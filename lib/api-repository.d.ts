import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: {
    baseUrl: string;
}, dtoNames: Extract<keyof O, string>[]) => import("./repository").RepositoryGroup<O>;
