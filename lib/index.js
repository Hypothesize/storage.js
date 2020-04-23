"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = require("./repository");
const api_repository_1 = require("./api-repository");
const pg_repository_1 = require("./pg-repository");
exports.Greeter = (name) => `Hello ${name}`;
exports.repository = repository_1.generate;
exports.ApiRepository = api_repository_1.Repository;
exports.PgRepository = pg_repository_1.Repository;
