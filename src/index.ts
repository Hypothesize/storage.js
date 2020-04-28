import { RepositoryGroup } from './repository'
export * from './repository'
export { Repository as ApiRepository } from './api-repository'

export let PgRepository: RepositoryGroup<any>

if (typeof module !== 'undefined' && module.exports) {
	PgRepository = require('./pg-repository')
} else {
	PgRepository = {}
}