import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: {
    baseUrl: string;
}, dtoNames: (keyof O)[]) => import("./repository").RepositoryGroup<O>;
