import createLogger from 'fodderlogger/dist'
import { Client, ClientConfig } from 'pg'

const logger = createLogger('postgres-service')
let service: undefined | PostgresService
export class PostgresService {
    private client: Client
    constructor (pgConfig: ClientConfig) {
        this.client = new Client(pgConfig)
    }
    async initService () {
        try {
            logger.info(`Initializing PostgreSQL...`)
            this.addClientListeners()
            const dbAvailable = await this.getOrCreateDatabase('test')
            console.log({ dbAvailable })
            if(!dbAvailable) {
                logger.error(`Database not available`)
            }
            const schemaAvailable = await this.createSchema('test-schema')
            console.log({ schemaAvailable })
            if(!schemaAvailable) {
                logger.error(`Schema not available`)
            }
            const tableAvailable = await this.createTableIfNotExists('test-table')
            console.log({ tableAvailable })
            if(!tableAvailable) {
                logger.error(`Table not available`)
            }
            logger.success(`PostgreSQL initialized`)
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
    }
    async connect () {
        try {
            await this.client.connect()
            logger.success('Connected to PostgreSQL')
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
    async query (queryString: string) {
        try {
            const result = await this.client.query(queryString)
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