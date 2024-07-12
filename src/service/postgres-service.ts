import createLogger from 'fodderlogger/dist'
import { Client, ClientConfig } from 'pg'
import { Vector3 } from '../types/vector.types'
const logger = createLogger('postgres-service', { debug: true })
let service: undefined | PostgresService

export class PostgresService {
    private client: Client
    constructor (pgConfig: ClientConfig) {
        this.client = new Client(pgConfig)
        this.initService()
    }
    async initService () {
        try {
            logger.debug(`Initializing PostgreSQL...`)
            this.addClientListeners()
            this.connect()
        } catch (error) {
            logger.error(`Error initializing PostgreSQL: ${error}`)
        }
    }
    addClientListeners () {
        this.client.on("error", (err) => logger.error(`PostgreSQL: ${err}`))
        this.client.on("end", () => logger.warn("PostgreSQL connection ended"))
        this.client.on("notice", (msg) => logger.info(`PostgreSQL: ${msg}`))
        this.client.on("notification", (msg) => logger.info(`PostgreSQL: ${msg}`))
        logger.success(`PostgreSQL listeners added`)
    }
    async connect () {
        try {
            await this.client.connect()
            logger.success(`Connected to PostgreSQL, Selected db is: ${this.client.database}`)
        } catch (error) {
            logger.error(`Error connecting to PostgreSQL: ${error}`)
        }
    }
    async disconnect () {
        try {
            await this.client.end()
            logger.success('Disconnected from PostgreSQL')
        } catch (error) {
            logger.error(`Error disconnecting from PostgreSQL: ${error}`)
        }
    }
    async getOrCreateDatabase (dbName: string) {
        const res = await this.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbName}'`);
        if(!res) {
            logger.error(`Error getting database ${dbName}: ${res}`)
            return false
        }
        if (res.rowCount === 0) {
            logger.warn(`${dbName} database not found, creating it.`);
            const createdDb = await this.query(`CREATE DATABASE "${dbName}";`);
            console.log({ createdDb })
            logger.success(`created database ${dbName}`);
            return true
        } else {
            logger.info(`${dbName} database exists.`);
            return true
        }
        
    }
    async dropDatabase(dbName: string) {
        const query = `DROP DATABASE IF EXISTS ${dbName};`;
        const result = await this.query(query);
        return result;
    }
    async checkIfSchemaExists(schemaName: string) {
        const query = `
            SELECT EXISTS (
               SELECT 1
               FROM   pg_namespace
               WHERE  nspname = '${schemaName}'
            );
        `;
        const result = await this.query(query);
        if(!result || !result.rows) {
            logger.error(`Error checking if schema ${schemaName} exists: ${result}`)
            return
        }
        return result.rows[0].exists;
    }
    async createSchema(schemaName: string) {
        const query = `
            CREATE SCHEMA IF NOT EXISTS ${schemaName};
        `;
        const res = await this.query(query);
        if(!res) {
            return false
        }
        console.log({ res: res.rows })
        logger.success(`Schema ${schemaName} created`);
        return true
    }
    async checkIfTableExists(tableName: string, schema: string) {
        const query = `
            SELECT EXISTS (
               SELECT 1
               FROM   information_schema.tables 
               WHERE  table_schema = 'public'
               AND    table_name = '${tableName}'
            );
        `;
        const op = await this.query(query);
        if(!op || !op.rows) {
            logger.error(`Error checking if table ${tableName} exists: ${op}`)
            return
        }
        return op.rows[0].exists;
    }
    async createTableIfNotExists(tableName: string) {
        const query = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
                column1 datatype1,
                column2 datatype2,
                ...
            );
        `;
        const op = await this.query(query);
        logger.debug({ op })
        if(!op) {
            logger.error(`Error creating table ${tableName}`)
            return false
        }
        logger.success(`Table ${tableName} created if it didn't exist`);
        return true
    }
    async activatePgVectorExtension () {
        const str = 'CREATE EXTENSION vector;'
        return await this.query(str)
    }
    async createOrAlterEmbeddingTable (tableName: string = 'items', vectorType: 2 | 3 = 3, existingTable: boolean = false) {
        const command = existingTable ? 'ALTER' : 'CREATE'
        const str = `${command} TABLE ${tableName} (id bigserial PRIMARY KEY, embedding vector(${vectorType}));`
        return await this.query(str)
    }
    async insertVectors (vectors: Vector3[]) {
        const vectorStr = vectors.map(v => `('[${v[0]},${v[1]},${v[2]}]')`)
        const str = `INSERT INTO items (embedding) VALUES ${vectorStr}`
        return await this.query(str)
    }
    async updateVector (id: number, vector: Vector3) {
        const str = `UPDATE items SET embedding = '${vector}' WHERE id = ${id};`
        return await this.query(str)
    }
    async deleteVector (id: number) {
        const str = `DELETE FROM items WHERE id = ${id};`
        return await this.query(str)
    }
    async queryEmbeddingSimilarity (data: string, limit: number = 1) {
        const str = `SELECT * FROM items ORDER BY embedding <-> '${data}' LIMIT ${limit};`
        return await this.query(str)
    }
    async query (queryString: string) {
        try {
            logger.debug(`Querying PostgreSQL: ${queryString}`)
            const result = await this.client.query(queryString)
            if(!result || !result.rows) {
                logger.error(`Error querying PostgreSQL: ${result}`)
                return null
            }
            logger.debug({ result: result.rows })
            return result
        } catch (error) {
            logger.error(`Error querying PostgreSQL: ${error}`)
            return null
        }
    }
}

export default function createPostgresService(config: ClientConfig) {
    if(!service) {
        service = new PostgresService(config)
    }
    return service
}