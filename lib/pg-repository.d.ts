import { DTOsMap } from "./repository";
export declare const Repository: <D extends DTOsMap>() => new (config: string, dtoNames: Extract<keyof D, string>[]) => import("./repository").RepositoryGroup<D>;
export declare const testSuite: () => void;
