type LlmServiceConfig = {
    LLM_BASE_URL: string
}

type LlmModel = "llama3"
type ModelConfig = {
    model: Model
}

type OllamaFormats = "json"

type OllamaGenerateRequestPayload = {
    model: Model
    prompt: string,
    images?: string[] // base64 encoded,
    stream: boolean,
    system?: string,
    format?: OllamaFormats
}