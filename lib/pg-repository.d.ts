import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: string, dtoNames: Extract<keyof O, string>[]) => import("./repository").RepositoryGroup<O>;
export declare const testSuite: () => void;
