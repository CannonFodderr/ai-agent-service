export type Config = {
    "ENV": any,
    "SERVER_HTTP_PORT": any,
    "OLLAMA_HOST": any,
    "OLLAMA_PORT": any
}

// LIST OF ENV KEYS
export type CONFIG_KEY = "ENV" 
| "SERVER_HTTP_PORT"
| "OLLAMA_HOST"
| "OLLAMA_PORT"

export type CONFIG_KEY_TYPE = { key: CONFIG_KEY, type: any }