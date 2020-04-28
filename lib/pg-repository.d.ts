import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: string, dtoNames: string[]) => import("./repository").RepositoryGroup<O>;
export declare const testSuite: () => void;
