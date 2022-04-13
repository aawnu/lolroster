require('dotenv').config()
const { default: axios } = require('axios');

const localhost = `http://127.0.0.1:${process.env?.PORT || 3000}`

const iterate = [
    '/',
    '/cache',
    '/lookup/champs',
    '/lookup/spells',
    '/lookup/names'
]

const test = new Promise((resolve, reject) => {
    try {
        const server = require('../server.js')
        let loop = null;
        let loopI = 0
        loop = setInterval(() => {
            if (server.status()) {
                clearInterval(loop)
                setTimeout(() => {
                    resolve(server)
                }, 333)
            }
            if (loopI > 10) {
                reject(false)
            }
            loopI += 1
        }, 100)
    } catch (e) {
        reject(e)
    }
})

let isDone = 1

test.then(res => {
    iterate.forEach(url => {
        isDone++
        axios.get(`${localhost}${url}`).then(res => {
            isDone--
            if (res.status >= 300) throw new Error(`${url} responded with ${res.status}`)
            console.log(isDone, url, res.status)
        }).catch(err => {
            throw new Error(err)
        })
    })

    for (const [spot, spotData] of Object.entries(res.caching.getRaw())) {
        for (const item of Object.keys(spotData)) {
            isDone++
            axios.get(`${localhost}/cache/${spot}/${item}.png`).then(res => {
                isDone--
                if (res.status >= 300 && res.status != 304) throw new Error(`${url} responded with ${res.status}`)
                console.log(isDone, `/cache/${spot}/${item}.png`, res.status)
            }).catch(err => {
                throw new Error(err)
            })
        }
    }

    isDone--
}).catch(err => {
    throw new Error(err)
})

let iterateMax = 100
setInterval(() => {
    if (isDone > 0) {
        if (iterateMax <= 0) {
            throw new Error("Could not resolve in 10 seconds")
        }
        iterateMax--
        return
    }
    process.exit(0)
}, 100)