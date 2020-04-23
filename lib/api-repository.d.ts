declare type Obj<TValue = any, TKey extends string = string> = {
    [key in TKey]: TValue;
};
declare const Repository_base: new (config: {
    baseUrl: string;
}) => import("./repository").RepositoryGroup<{
    /** Store raw data in S3 and returns a promise of the URL of the stored object
    * @param data Data to be stored
    * @param key Key used to identify the stored data
    * @param string The URL where the data will be available, for instance the CloudFront base URL
    */
    storeRawAsync: (data: ArrayBuffer | Obj<any, string>, key?: string, prefix?: string) => Promise<string>;
    /** Retrieve raw data from S3 (via cloudfront)
     * @param url S3 (Cloudfront) URL of the data to retreive
     */
    getRawAsync: (url: string) => Promise<any>;
}>;
export declare class Repository extends Repository_base {
}
export {};
