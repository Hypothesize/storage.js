import * as Http from "./web"
import { DTOsMap, FilterGroup, Filter, Filters, Primitive, Obj } from "./types"
import { generate, RepositoryGroup } from "./repository"

export const PgRepository = <Map extends DTOsMap>(entityParents: { [key in keyof Map]: string }) => {
	return generate<{}, Map>(class {
		readonly _baseUrl: string
		that = this

		constructor(args: { baseUrl: string }) {
			this._baseUrl = args.baseUrl
		}

		async findAsync<E extends keyof DTOsMap>(args: { entity: E, id: string, parentId: string }): Promise<DTOsMap[E]["fromStorage"]> {
			return Http
				.getAsync({ uri: `${this._baseUrl}/api/${args.entity}/${args.id}/` })
				.then(res => {
					Http.checkStatusCode(res, `Error finding ${args.entity} with id ${args.id} data`)
					return JSON.parse(res.body) as DTOsMap[E]["fromStorage"]
				})
		}
		async getAsync<E extends keyof DTOsMap>(args: { entity: E, parentId?: string, filters?: FilterGroup<DTOsMap[E]["fromStorage"]> }): Promise<DTOsMap[E]["fromStorage"][]> {

			const parentEntity = entityParents[args.entity]
			const effectiveParentId = parentEntity !== "" ? args.parentId : ""

			const request: Http.GetRequest = {
				uri: [`${this._baseUrl}/api`, parentEntity, effectiveParentId, args.entity].filter(x => x !== "").join("/"),
				query: args.filters ? { filter: JSON.stringify(args.filters) } : undefined
			}

			return Http.getAsync(request).then((res: any) => {
				Http.checkStatusCode(res, `Error retrieving data`)
				return JSON.parse(res.body) as DTOsMap[E]["fromStorage"][]
			})
		}
		async saveAsync<E extends keyof DTOsMap>(args: {
			entity: E,
			obj: DTOsMap[E]["toStorage"][],
			mode: "insert" | "update"
		}): Promise<DTOsMap[E]["fromStorage"][]> {
			if (args.mode === "insert") {
				return Http
					.postAsync({
						uri: `${this._baseUrl}/api/${args.entity}/`,
						data: { type: "json", body: args.obj as Obj }
					}).then(res => {
						Http.checkStatusCode(res, `Error inserting ${args.entity} data`)
						return JSON.parse(res.body)
					})
			}
			else {
				return Http
					.putAsync({
						uri: `${this._baseUrl}/api/${args.entity}/`,
						data: { type: "json", body: args.obj as Obj }
					}).then(res => {
						Http.checkStatusCode(res, `Error updating ${args.entity} data`)
						return JSON.parse(res.body)
					})
			}
		}

		async deleteAsync<E extends keyof DTOsMap>(args: { entity: E, id: any }): Promise<void> {
			const res = await Http.deleteAsync({ uri: `${this._baseUrl}/api/${args.entity}/${args.id}` })
			Http.checkStatusCode(res, `Error deleting ${args.entity} data`)
		}

		async deleteManyAsync<E extends keyof DTOsMap>(args: { entity: E, ids: string[] }): Promise<void> {
			throw new Error("Not implemented")
		}

		protected getPresignedS3UrlAsync(key?: string) {
			return Http.getAsync({
				uri: `${this._baseUrl}/presigned_s3_url`,
				query: key ? { key } : undefined
			}).then(res => res.body)
		}

		extensions = {}
	})
}