import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: string, dtosMap: DTOsMap) => import("./repository").RepositoryGroup<O>;
export declare const testSuite: () => void;
