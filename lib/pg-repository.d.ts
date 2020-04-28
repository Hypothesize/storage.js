import { DTOsMap } from "./repository";
export declare const Repository: (dtosMap: DTOsMap) => new (config: string) => import("./repository").RepositoryGroup<DTOsMap>;
export declare const testSuite: () => void;
