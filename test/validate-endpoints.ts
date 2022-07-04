import axios from "axios"
import * as caching from "../src/cache"

type requestServer = { url: string, status: number }

import('../server').then(server => {
    return new Promise<requestServer[]>(async resEndpoint => {

        await new Promise<boolean>(resolve => {
            let iterations: number = 0
            setTimeout(() => {
                if (iterations > 10) {
                    throw new Error("Could not instanciate server within 10 seconds")
                }

                if (server.statusBool) {
                    resolve(true)
                }

                iterations += 1
            }, 1000)
        })

        let openReq: number = 1;
        let endpointStatus: requestServer[] = []
        let endpoints: string[] = [
            `${server.serverUrl}`,
            `${server.serverUrl}/cache`,
            `${server.serverUrl}/lookup/champs`,
            `${server.serverUrl}/lookup/spells`,
            `${server.serverUrl}/lookup/names`,
        ]

        Object.entries(caching.teamsStructure).forEach(([cacheTeam, cacheData]) => {
            Object.keys(cacheData).forEach(cacheKey => {
                const buildUrl = `${server.serverUrl}/cache/${cacheTeam}/${cacheKey}`
                endpoints.push(buildUrl + caching.useMedia)
            })
        })

        // ===================================================

        endpoints.forEach(async url => {
            openReq += 1

            const urlResponse = await axios.get(url)
            endpointStatus.push({
                url: urlResponse.request.path,
                status: urlResponse.status,
            })

            openReq -= 1
            if (openReq == 0) {
                resEndpoint(endpointStatus)
            }
        })

        // ===================================================

        openReq -= 1
        if (openReq == 0) {
            resEndpoint(endpointStatus)
        }
    })
}).then(testFinal => {
    console.table(testFinal)
    testFinal.forEach(val => {
        if (val.status != 200) {
            process.exit(1)
        }
    })
    process.exit(0)
}).catch(serverError => {
    console.error('~ Server failed authentication ~', serverError)
    process.exit(1)
})