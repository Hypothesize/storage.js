import { generate } from "./repository"
import { Repository as generateApiRepository } from "./api-repository"
import { Repository as generatePgRepository } from "./pg-repository"

export const Greeter = (name: string) => `Hello ${name}`
export const repository = generate
export const ApiRepository = generateApiRepository
export const PgRepository = generatePgRepository