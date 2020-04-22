import * as Http from "./web"
import * as AWS from 'aws-sdk'
import { String__ as String } from "./stdlib"
import * as shortid from "shortid"
import { generate as generateRepoGroup } from "./repository"
import { parseTablesAsync } from "./tables-parser"
import { entityParents } from "./constants"

type Project = Entities.Project.DTO
type Table = Entities.Table.ForStorage
type DTOsMap = Entities.DTOsMap

export class Repository extends generateRepoGroup(class {
	readonly _baseUrl: string
	constructor(args: { baseUrl: string }) {
		this._baseUrl = args.baseUrl
		console.log(`API repository base url: ${this._baseUrl}`)
	}
	async findAsync<E extends keyof DTOsMap>(args: { entity: E, id: string, parentId: string }): Promise<DTOsMap[E]["fromStorage"]> {
		const entityPluralName = new String(args.entity).plural()
		return Http
			.getAsync({ uri: `${this._baseUrl}/${entityPluralName}/${args.id}/` })
			.then(res => {
				Http.checkStatusCode(res, `Error finding ${args.entity} with id ${args.id} data`)
				return JSON.parse(res.body) as Entities.DTOsMap[E]["fromStorage"]
			})
	}
	async getAsync<E extends keyof DTOsMap>(args: { entity: E, parentId: string, filters?: Data.FilterGroup<Entities.DTOsMap[E]["fromStorage"]> }): Promise<DTOsMap[E]["fromStorage"][]> {
		console.log(`API repository getAsync(entity=${args.entity}, parent id=${JSON.stringify(args.parentId)}, filters=${JSON.stringify(args.filters)})`)

		const parentEntity = entityParents["user"]
		const pluralParent = parentEntity !== "" ? new String(parentEntity).plural() : ""
		const effectiveParentId = parentEntity !== "" ? args.parentId : ""
		const pluralEntity = new String(args.entity).plural()

		const request: Http.GetRequest = {
			uri: [this._baseUrl, pluralParent, effectiveParentId, pluralEntity].filter(x => x !== "").join("/"),
			query: args.filters ? { filter: JSON.stringify(args.filters) } : undefined
		}
		console.log(`API repository getAsync(); request: ${JSON.stringify(request)}`)

		return Http.getAsync(request).then((res: any) => {
			Http.checkStatusCode(res, `Error retrieving data`)
			return JSON.parse(res.body) as Entities.DTOsMap[E]["fromStorage"][]
		})
	}
	async saveAsync<E extends keyof Entities.DTOsMap>(args: { entity: E, obj: Entities.DTOsMap[E]["toStorage"], mode: "insert" | "update" }): Promise<Entities.DTOsMap[E]["fromStorage"]> {
		const entityPluralName = new String(args.entity).plural()

		if (args.mode === "insert") {
			return Http
				.postAsync({
					uri: `${this._baseUrl}/api/${entityPluralName}/`,
					data: { type: "json", body: args.obj as Obj }
				}).then(res => {
					Http.checkStatusCode(res, `Error inserting ${entityPluralName} data`)
					return JSON.parse(res.body) as Entities.DTOsMap[E]["fromStorage"]
				})
		}
		else {
			return Http
				.putAsync({
					uri: `${this._baseUrl}/api/${entityPluralName}/`,
					data: { type: "json", body: args.obj as Obj }
				}).then(res => {
					Http.checkStatusCode(res, `Error updating ${entityPluralName} data`)
					return JSON.parse(res.body) as Entities.DTOsMap[E]["fromStorage"]
				})
		}
	}
	async deleteAsync<E extends keyof Entities.DTOsMap>(args: { entity: E, id: any }): Promise<void> {
		const entityPluralName = new String(args.entity).plural()
		const res = await Http.deleteAsync({ uri: `${this._baseUrl}/${entityPluralName}/${args.id}` })
		Http.checkStatusCode(res, `Error deleting ${entityPluralName} data`)
	}

	protected getPresignedS3UrlAsync(key?: string) {
		return Http.getAsync({
			uri: `${this._baseUrl}/presigned_s3_url`,
			query: key ? { key } : undefined
		}).then(res => res.body)
	}

	extensions = {
		addTablesAsync: async (projectId: Project["id"], rawData: any, dataFileName?: string): Promise<Table[]> => {
			const parsedTables = await parseTablesAsync(rawData, dataFileName ? dataFileName : "Unknown")

			return Http
				.postAsync({
					uri: `${this._baseUrl}/projects/${projectId}/tables/?data_file_name=${dataFileName}`,
					data: { type: "json", body: { tables: parsedTables } }
				} as Http.PostRequest)
				.then(res => {
					Http.checkStatusCode(res, `Error inserting tables`)
					return JSON.parse(res.body) as Table[]
				})
		},
		/** Store raw data in S3 and returns a promise of the URL of the stored object
		* @param data Data to be stored
		* @param key Key used to identify the stored data
		*/
		storeRawAsync: async (data: ArrayBuffer | Obj, key?: string): Promise<string> => {
			const _key = key ?? shortid.generate()
			try {
				await Http.putAsync({
					uri: await this.getPresignedS3UrlAsync(_key),
					data: {
						type: "text",
						body: data instanceof ArrayBuffer
							? new Buffer(data).toString('base64')
							: JSON.stringify(data)
					}
				})
			}
			catch (err) {
				throw new Error(`Error uploading data: ${err}`)
			}

			return `${process.env.S3_CLOUDFRONT_URL}/${_key}`
		},

		/** Retrieve raw data from S3 (via cloudfront)
		 * @param url S3 (Cloudfront) URL of the data to retreive
		 */
		getRawAsync: async (url: string): Promise<any> => {
			try {
				const resultMsg = await Http.getAsync({ uri: url })
				return JSON.parse(resultMsg.body)
			}
			catch (err) {
				throw new Error(`Error getting or parsing raw data at URL "${url}`)
			}
		}
	}
}) {

}
