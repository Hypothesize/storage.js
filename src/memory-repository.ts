import { Dictionary, Array__ } from "./stdlib"
import { generate } from "./repository"
import { parseTablesAsync } from "./tables-parser"
import { parseValue } from "./value-parser"
import { getColumnType, getMeasurementLevels } from "./column-parser"
import * as shortid from "shortid"
import { DataTable, ROW_NUM_COL_NAME } from "./data-table"
import { RawIoProvider } from "./raw-io-provider"
import { EntityParents } from "./constants"
import { webConfig } from "./config"

const entityStore: Dictionary<Entities.DTO.Stored> = new Dictionary<Entities.DTO.Stored>()

export const Repository = generate(class {
	private ioProvider: RawIoProvider

	constructor() {
		this.ioProvider = new RawIoProvider()
	}

	async findAsync<E extends keyof Entities.DTOsMap>(args: { entity: E, id: string, parentId: string }): Promise<Entities.DTOsMap[E]["extended"]> {
		const result = entityStore.get(args.id)
		if (result === undefined) {
			throw new Error(`Could not find the ${args.entity} with id ${args.id}`)
		}
		else if (typeof result !== "object") {
			throw new Error(`The ${args.entity} with id ${args.id} received from the server is '${typeof args.entity}', should have been an object`)
		}
		else {
			return result as Entities.DTOsMap[E]["extended"]
		}
	}

	async getAsync<E extends keyof Entities.DTOsMap>(args: { entity: E, parentId: string, filters?: Data.FilterGroup<Entities.DTOsMap[E]["extended"]> }): Promise<Entities.DTOsMap[E]["extended"][]> {
		const parentEntity = EntityParents[args.entity]
		const entities = entityStore.entries().filter(e => e[1]["objectType"] === args.entity && e[1][`${parentEntity}Id`] === args.parentId).map(e => e[1])
		return entities as Entities.DTO.Extended[]
	}

	async saveAsync<E extends keyof Entities.DTOsMap>(args: { entity: E, obj: Entities.DTOsMap[E]["stored"], method: "insert" | "update" }): Promise<Entities.DTOsMap[E]["extended"]> {
		entityStore.set(args.obj.id, {
			objectType: args.entity,
			...args.obj
		})
		return entityStore.get(args.obj.id) as Entities.DTO.Extended
	}

	async deleteAsync<E extends keyof Entities.DTOsMap>(args: { entity: E, id: string }): Promise<void> {
		entityStore[args.id] = undefined
	}

	extensions = {
		addTables: async (projectId: Entities.Project["id"], rawData: any, dataFileName?: string): Promise<Entities.Table[]> => {

			// We create parsed tables from the raw data
			const parsingResult = await parseTablesAsync(rawData, dataFileName ? dataFileName : "Unknown")
			if(parsingResult.warning){
				console.log(parsingResult.warning)
			}
			// We store the raw data in memory, to be later transfered to the server
			this.ioProvider.storeContentAsync({ parsedTables: parsingResult.tables, fileName: dataFileName }, "memory", true, "originalData")

			return new Promise<Entities.Table.DTO.Extended[]>(async (resolve, reject) => {
				try {
					const tablePromises = parsingResult.tables.map(async parsedTable => {
						const dataTable = new DataTable(parsedTable.rows)
						const tableId = shortid.generate()

						// Those 2 objects will be filled by one iteration through the table columns.
						const parsedCols: Obj<Data.ParsedValue[], string> = {}
						const effectiveCols: Obj<Data.ParsedValue["effective"][], string> = {}

						// For each column, we fill an array of parsed values (used to define the measurement level) and an array of effective values (to be saved on S3)
						dataTable.columnVectors.entries().filter(vector => vector[0] !== ROW_NUM_COL_NAME).forEach((vector) => {
							let parsedColumn
							try {
								parsedColumn = vector[1].map(datum => parseValue(datum)).getArray()
							}
							catch(e){
								throw new Error(webConfig.displayStrings.ERROR_PARSING_GENERAL)
							}

							const effectiveColumn = parsedColumn.map(v => v.effective)
							parsedCols[vector[0]] = parsedColumn
							effectiveCols[vector[0]] = effectiveColumn
						})

						/** 1. Storing the table parsed data in memory */
						const storageRef = await this.ioProvider.storeContentAsync(effectiveCols, "memory", true)
						const table: Entities.Table = {
							...entityDefaults.table,
							id: tableId,
							name: parsedTable.name,
							parsedDataUrl: storageRef,
							projectId: projectId,
							dataFileName: dataFileName,
							numColumns: dataTable.columnVectors.length - 1, // rowId doesn't count
							numRows: dataTable.length
						}

						/** 2. Storing the table metadata in memory */
						const insertedTable = await this.saveAsync({ entity: "table", obj: table, method: "insert" })

						/** 3. Storing the columns metadata in memory */
						await Promise.all(Object.keys(parsedCols).map((key, index) =>
							new Promise<Entities.Column>(resolveColumn => {
								const colType = getColumnType(parsedCols[key])
								const measureLevels = getMeasurementLevels(colType)

								const newColumn: Entities.Column.DTO.Stored = {
									id: shortid.generate(),
									name: key,
									tableId: tableId,
									storageUrl: ``, // Columns are not stored individually on S3 anymore
									measureLevels: new Array__(measureLevels).getStringifiedArray(),
									columnType: colType,
									displayIndex: index
								}

								this.saveAsync({ entity: "column", obj: newColumn, method: "insert" }).then(async column => {
									resolveColumn(newColumn)
								})
							})
						))
						return insertedTable
					})

					const savedTables = await Promise.all(tablePromises)
					resolve(savedTables)
				}
				catch (err) {
					reject(err)
				}

			})
		}
	}


})