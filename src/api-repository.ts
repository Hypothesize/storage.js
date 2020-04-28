import { getAsync, postAsync, putAsync, deleteAsync, checkStatusCode, GetRequest } from "./web"
import { String__ } from "./light_stdlib"
import * as shortid from "shortid"
import { generate as generate, FilterGroup, Filter, Filters, DTOsMap, Primitive, Obj } from "./repository"

import { EntityParents } from "./constants"

export const Repository = <D extends DTOsMap>() => generate<{ baseUrl: string }, {}, D>(class {
	readonly _baseUrl: string
	constructor(args: { baseUrl: string }) {
		this._baseUrl = args.baseUrl
		console.log(`API repository base url: ${this._baseUrl}`)
	}
	async findAsync<E extends Extract<keyof DTOsMap, string>>(args: { entity: E, id: string }): Promise<DTOsMap[E]["fromStorage"]> {
		const entityPluralName = new String__(args.entity).plural()
		return getAsync({ uri: `${this._baseUrl}/${entityPluralName}/${args.id}/` })
			.then(res => {
				checkStatusCode(res, `Error finding ${args.entity} with id ${args.id} data`)
				return JSON.parse(res.body) as DTOsMap[E]["fromStorage"]
			})
	}
	async getAsync<E extends Extract<keyof DTOsMap, string>>(args: { entity: E, parentId?: string, filters?: FilterGroup<DTOsMap[E]["fromStorage"]> }): Promise<DTOsMap[E]["fromStorage"][]> {
		console.log(`API repository getAsync(entity=${args.entity}, parent id=${JSON.stringify(args.parentId)}, filters=${JSON.stringify(args.filters)})`)

		const parentEntity = EntityParents["user"]
		const pluralParent = parentEntity !== "" ? new String__(parentEntity).plural() : ""
		const effectiveParentId = parentEntity !== "" ? args.parentId : ""
		const pluralEntity = new String__(args.entity).plural()

		const request: GetRequest = {
			uri: [this._baseUrl, pluralParent, effectiveParentId, pluralEntity].filter(x => x !== "").join("/"),
			query: args.filters ? { filter: JSON.stringify(args.filters) } : undefined
		}
		console.log(`API repository getAsync(); request: ${JSON.stringify(request)}`)

		return getAsync(request).then((res: any) => {
			checkStatusCode(res, `Error retrieving data`)
			return JSON.parse(res.body) as DTOsMap[E]["fromStorage"][]
		})
	}
	async saveAsync<E extends Extract<keyof DTOsMap, string>>(args: { entity: E, obj: DTOsMap[E]["toStorage"], mode: "insert" | "update" }): Promise<DTOsMap[E]["fromStorage"]> {
		const entityPluralName = new String__(args.entity).plural()

		if (args.mode === "insert") {
			return postAsync({
				uri: `${this._baseUrl}/api/${entityPluralName}/`,
				data: { type: "json", body: args.obj as Obj }
			}).then(res => {
				checkStatusCode(res, `Error inserting ${entityPluralName} data`)
				return JSON.parse(res.body) as DTOsMap[E]["fromStorage"]
			})
		}
		else {
			return putAsync({
				uri: `${this._baseUrl}/api/${entityPluralName}/`,
				data: { type: "json", body: args.obj as Obj }
			}).then(res => {
				checkStatusCode(res, `Error updating ${entityPluralName} data`)
				return JSON.parse(res.body) as DTOsMap[E]["fromStorage"]
			})
		}
	}
	async deleteAsync<E extends Extract<keyof DTOsMap, string>>(args: { entity: E, id: any }): Promise<void> {
		const entityPluralName = new String__(args.entity).plural()
		const res = await deleteAsync({ uri: `${this._baseUrl}/${entityPluralName}/${args.id}` })
		checkStatusCode(res, `Error deleting ${entityPluralName} data`)
	}

	protected getPresignedS3UrlAsync(key?: string) {
		return getAsync({
			uri: `${this._baseUrl}/presigned_s3_url`,
			query: key ? { key } : undefined
		}).then(res => res.body)
	}

	extensions = {
		// /** Store raw data in S3 and returns a promise of the URL of the stored object
		// * @param data Data to be stored
		// * @param key Key used to identify the stored data
		// * @param string The URL where the data will be available, for instance the CloudFront base URL
		// */
		// storeRawAsync: async (data: ArrayBuffer | Obj, key?: string, prefix?: string): Promise<string> => {
		// 	const _key = key ?? shortid.generate()
		// 	try {
		// 		await putAsync({
		// 			uri: await this.getPresignedS3UrlAsync(_key),
		// 			data: {
		// 				type: "text",
		// 				body: data instanceof ArrayBuffer
		// 					? arrayBufferToBase64(data)
		// 					: JSON.stringify(data)
		// 			}
		// 		})
		// 	}
		// 	catch (err) {
		// 		throw new Error(`Error uploading data: ${err}`)
		// 	}

		// 	return `${prefix}/${_key}`
		// },

		// /** Retrieve raw data from S3 (via cloudfront)
		//  * @param url S3 (Cloudfront) URL of the data to retreive
		//  */
		// getRawAsync: async (url: string): Promise<any> => {
		// 	try {
		// 		const resultMsg = await getAsync({ uri: url })
		// 		return JSON.parse(resultMsg.body)
		// 	}
		// 	catch (err) {
		// 		throw new Error(`Error getting or parsing raw data at URL "${url}`)
		// 	}
		// }
	}
})

function arrayBufferToBase64(buffer: ArrayBuffer) {
	var binary = '';
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}