type ModelName = string
export type LlmServiceConfig = {
    LLM_BASE_URL: string
}

export type OllamaModelConfig = {
    model: ModelName
}

export type OllamaFormats = "json"

export type OllamaGenerateRequestPayload = {
    model: ModelName
    prompt: string,
    images?: string[] // base64 encoded,
    stream: boolean,
    system?: string,
    format?: OllamaFormats
}
export type OllamaEmbeddingRequestPayload = {
    model: ModelName,
    prompt: string,
    options?: { [key: string]: any },
    keepAlive?: number
}
export type OllamaModelDetails = {
    parent_model: string,
    format: string,
    family: string,
    families: string[],
    parameter_size: string,
    quantization_level: string
}

export type OllamaModel = {
    name: ModelName,
    model: string,
    modified_at: string,
    size: number,
    digest: string,
    details: OllamaModelDetails,
    expires_at: string
}