import os, { hostname, totalmem } from 'os'
export function getOsInfo () {
    return {
        memory: {
            total: os.totalmem(),
            used: os.totalmem() - os.freemem(),
            free: os.freemem()
        },
        cpus: os.cpus().length,
        machine: os.machine(),
        uptime: os.uptime(),
        hostname: os.hostname()
    }
}