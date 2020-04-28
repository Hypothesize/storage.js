import { DTOsMap } from "./repository";
export declare const Repository: new <O extends DTOsMap>(config: string, dtosMap: O) => import("./repository").RepositoryGroup<O>;
export declare const testSuite: () => void;
