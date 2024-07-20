import getConfig from "../config"

const config = getConfig()

export function isDebugMode () {
    return !!config?.DEBUG_MODE
}