import { DTOsMap } from "./repository";
export declare const Repository: new <X extends DTOsMap>(config: {
    baseUrl: string;
}, dtoNames: Extract<keyof X, string>[]) => import("./repository").RepositoryGroup<X>;
