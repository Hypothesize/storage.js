import { Hypothesize } from "./repository";
export declare const Repository: new (config: string) => import("./repository").RepositoryGroup<{
    authenticateAsync: (credentials: {
        email: string;
        pwd: string;
    }) => Promise<Hypothesize.Entities.User.FromStorage>;
    registerAsync: (args: Hypothesize.Entities.User.ForStorage & {
        password: string;
    }) => Promise<Hypothesize.Entities.User.FromStorage>;
    unregisterAsync: (id: string) => Promise<void>;
    findUserAsync: (userid: string) => Promise<Hypothesize.Entities.User.FromStorage>;
    updateUserAsync: (obj: Hypothesize.Entities.User.ForStorage) => Promise<Hypothesize.Entities.User.FromStorage>;
    insertResultsAsync: (results: Hypothesize.Entities.Result.ForStorage[]) => Promise<never>;
    deleteResultsAsync: (analysisId: string) => Promise<void>;
}>;
export declare const testSuite: () => void;
