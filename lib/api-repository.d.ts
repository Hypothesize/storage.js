declare const Repository_base: new (config: {
    baseUrl: string;
}) => import("./repository").RepositoryGroup<{}>;
export declare class Repository extends Repository_base {
}
export {};
