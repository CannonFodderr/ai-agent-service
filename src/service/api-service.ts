import axios, { Axios, AxiosRequestConfig } from "axios"
import createLogger from "fodderlogger/dist"

const logger = createLogger('api-service')
export class ApiService {
    private client: Axios
    constructor (baseURL: string) {
        this.client = axios.create({ baseURL })
    }
    async get (url: string) {
        return await this.client.get(url)
    }
    async post (url: string, data: any, config?: AxiosRequestConfig) {
        return await this.client.post(url, data, config)
    }
}




export default function createApiService (baseUrl: string) {
    logger.info(`API service initialized: ${baseUrl}`)
    return new ApiService(baseUrl)
}