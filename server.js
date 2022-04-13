require('dotenv').config()
const os = require('os')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const express = require('express')
const crypto = require("crypto")
const caching = require('./core/caching.js')

const app = express()
const serverLocal = '127.0.0.1'
const serverIp = process.env?.SERVER_PUBLIC == 1 ? '0.0.0.0' : serverLocal
const serverPort = Number(process.env?.SERVER_PORT || 3000)
const validateServerPath = crypto.randomBytes(64).toString('hex')
const validateServer = crypto.randomBytes(32).toString('hex')

app.use(express.json())
app.use('/script', express.static('node_modules/axios/dist'))
app.use('/script', express.static('node_modules/jquery/dist'))
app.use('/cache', express.static('cache', {
    setHeaders: function (res, path) {
        res.set({
            'Cache-Control': 'private, max-age=0, must-revalidate',
        })
    }
}))
app.use('/live', express.static('cache', {
    setHeaders: function (res, path) {
        res.set({
            'Refresh': 2,
            'Cache-Control': 'private, max-age=0, must-revalidate',
        })
    }
}))
app.use(express.static('public'))

app.get('/', (req, res) => {
    const loadPath = path.resolve('core/www/dashboard.html')

    let setHeaders = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'text/html',
        'ETag': false
    }

    res.set(setHeaders).sendFile(loadPath)
})

app.get('/cache', (req, res) => {
    let setHeaders = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    res.set(setHeaders).send(caching.getState())
})

app.post('/cache', (req, res) => {
    let setHeaders = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }
    const team = req.body?.team
    const slot = req.body?.slot
    const value = req.body?.value

    caching.push(team, slot, value).then(() => {
        caching.save().finally(() => {
            res.set(setHeaders).send()
        })
    }).catch(() => {
        res.status(400).set(setHeaders).send()
    })
})

app.get('/lookup/champs', (req, res) => {
    const loadPath = path.resolve('core/data/champs.json')

    let setHeaders = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    res.set(setHeaders).sendFile(loadPath)
})

app.get('/lookup/spells', (req, res) => {
    const loadPath = path.resolve('core/data/spells.json')

    let setHeaders = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    res.set(setHeaders).sendFile(loadPath)
})

app.get('/lookup/names', (req, res) => {
    const loadNameRed = path.resolve('cache/red/name.txt')
    const loadNameBlue = path.resolve('cache/blue/name.txt')
    const loadNameMatch = path.resolve('cache/match.txt')

    const nameBlue = fs.readFileSync(loadNameBlue, 'utf8')
    const nameRed = fs.readFileSync(loadNameRed, 'utf8')
    const nameMatch = fs.readFileSync(loadNameMatch, 'utf8')

    let setHeaders = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    res.set(setHeaders).send({
        red: nameRed,
        blue: nameBlue,
        match: nameMatch
    })
})

app.post('/action/name', (req, res) => {
    const srcRed = path.resolve('cache/red/name.txt')
    const srcBlue = path.resolve('cache/blue/name.txt')
    const srcMatch = path.resolve('cache/match.txt')

    const slot = req.body?.slot
    const value = req.body?.value
    const src = slot == 'blue' ? srcBlue : (slot == 'red' ? srcRed : (slot == 'match' ? srcMatch : null))

    if (!slot || !src) {
        return res.status(400).send({ name: value })
    }

    fs.writeFileSync(src, value, err => {
        if (!err) return
        console.error(err)
    })

    let setHeaders = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    res.set(setHeaders).send({
        name: value
    })
})

app.post('/action/reset', (req, res) => {
    caching.build(true).then(callback => {
        if (callback.errors.length > 0) {
            return res.status(400).send()
        }

        let setHeaders = {
            'Cache-Control': 'no-cache, must-revalidate',
            'Content-Type': 'application/json',
            'ETag': false
        }

        res.set(setHeaders).send(caching.getState())
    })
})

app.post('/action/swap', (req, res) => {
    const loadNameRed = path.resolve('cache/red/name.txt')
    const loadNameBlue = path.resolve('cache/blue/name.txt')

    const nameBlue = fs.readFileSync(loadNameBlue, 'utf8')
    const nameRed = fs.readFileSync(loadNameRed, 'utf8')

    fs.writeFileSync(loadNameRed, nameBlue, err => {
        if (!err) return
        console.error(err)
    })
    fs.writeFileSync(loadNameBlue, nameRed, err => {
        if (!err) return
        console.error(err)
    })

    let setHeaders = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    res.set(setHeaders).send({
        red: nameBlue,
        blue: nameRed
    })
})

app.post(`/${validateServerPath}`, (req, res) => {
    res.send(validateServer)
})

let statusBool = false
caching.build().then(() => {
    console.log("Build the cache from core/data/cache.json")
    app.listen(serverPort, serverIp, () => {
        const host = `http://${serverLocal}:${serverPort}`
        console.log(`Local host: ${host}`)

        const getIpTable = os.networkInterfaces()
        for (const [key, packet] of Object.entries(getIpTable)) {
            packet.forEach(row => {
                const ip = row.family == 'IPv6' ? `[${row.address}]` : row.address
                if (ip == serverLocal) return

                const host = `http://${ip}:${serverPort}`
                const self = `${host}/${validateServerPath}`

                axios({
                    method: 'POST',
                    url: self
                }).then(res => {
                    if (res.data == validateServer) {
                        console.log(`Public host: ${host}`)
                    }
                }).catch(err => null)
            })
        }
        
        statusBool = true
    })
}).catch(err => {
    throw new Error('Could not start server')
})

const status = () => {
    return statusBool
}

module.exports = {app, status, caching}