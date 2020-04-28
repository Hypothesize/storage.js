import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: string, dtoNames: (keyof O)[]) => import("./repository").RepositoryGroup<O>;
export declare const testSuite: () => void;
