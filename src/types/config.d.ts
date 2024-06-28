type Config = {
    "ENV": any,
    "SERVER_HTTP_PORT": any,
    "OLLAMA_HOST": any,
    "OLLAMA_PORT": any
}

// LIST OF ENV KEYS
type CONFIG_KEY = "ENV" 
| "SERVER_HTTP_PORT"
| "OLLAMA_HOST"
| "OLLAMA_PORT"

type CONFIG_KEY_TYPE = { key: CONFIG_KEY, type: any }