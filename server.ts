import env from './src/env'
import os from 'os'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import express from 'express'
import crypto from "crypto"
import * as caching from './src/cache'

const app = express()

const serverLocal: string = '127.0.0.1'
const serverIp: string = env('SERVER_PUBLIC', '127.0.0.1') == 1 ? '0.0.0.0' : serverLocal

export const validateServer: string = crypto.randomBytes(32).toString('hex')
export const validateServerPath: string = crypto.randomBytes(64).toString('hex')

export let statusBool: boolean = false
export let serverUrl: string = `http://${serverLocal}`;
export const serverPort = Number(env('SERVER_PORT', 3000))

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
    const loadPath: string = path.resolve('core/www/dashboard.html')

    let setHeaders: object = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'text/html',
        'ETag': false
    }

    res.set(setHeaders).sendFile(loadPath)
})

app.get('/cache', (req, res) => {
    let setHeaders: object = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    res.set(setHeaders).send(caching.getState())
})

app.post('/cache', (req, res) => {
    let setHeaders: object = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    const team: string = req.body?.team
    const slot: string = req.body?.slot
    const value: string = req.body?.value

    caching.push(team, slot, value).then(() => {
        caching.save().finally(() => {
            res.set(setHeaders).send()
        })
    }).catch(() => {
        res.status(400).set(setHeaders).send()
    })
})

app.get('/lookup/champs', (req, res) => {
    const loadPath: string = path.resolve('core/data/champs.json')

    let setHeaders: object = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    res.set(setHeaders).sendFile(loadPath)
})

app.get('/lookup/spells', (req, res) => {
    const loadPath: string = path.resolve('core/data/spells.json')

    let setHeaders: object = {
        'Cache-Control': 'no-cache, must-revalidate',
        'Content-Type': 'application/json',
        'ETag': false
    }

    res.set(setHeaders).sendFile(loadPath)
})

app.get('/lookup/names', (req, res) => {
    const loadNameRed: string = path.resolve('cache/red/name.txt')
    const loadNameBlue: string = path.resolve('cache/blue/name.txt')
    const loadNameMatch: string = path.resolve('cache/match.txt')

    const nameBlue: string = fs.readFileSync(loadNameBlue, 'utf8')
    const nameRed: string = fs.readFileSync(loadNameRed, 'utf8')
    const nameMatch: string = fs.readFileSync(loadNameMatch, 'utf8')

    let setHeaders: object = {
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
    const srcRed: string = path.resolve('cache/red/name.txt')
    const srcBlue: string = path.resolve('cache/blue/name.txt')
    const srcMatch: string = path.resolve('cache/match.txt')

    const slot: string = req.body?.slot
    const value: string = req.body?.value
    const src: string = slot == 'blue' ? srcBlue : (slot == 'red' ? srcRed : (slot == 'match' ? srcMatch : ''))

    if (!slot || !src) {
        return res.status(400).send({ name: value })
    }

    fs.writeFileSync(src, value)

    let setHeaders: object = {
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
        if (Object.values(callback.errors).length > 0) {
            return res.status(400).send()
        }

        let setHeaders: object = {
            'Cache-Control': 'no-cache, must-revalidate',
            'Content-Type': 'application/json',
            'ETag': false
        }

        res.set(setHeaders).send(caching.getState())
    })
})

app.post('/action/swap', (req, res) => {
    const loadNameRed: string = path.resolve('cache/red/name.txt')
    const loadNameBlue: string = path.resolve('cache/blue/name.txt')

    const nameBlue: string = fs.readFileSync(loadNameBlue, 'utf8')
    const nameRed: string = fs.readFileSync(loadNameRed, 'utf8')

    fs.writeFileSync(loadNameRed, nameBlue)
    fs.writeFileSync(loadNameBlue, nameRed)

    let setHeaders: object = {
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

caching.build(false).then(err => {
    app.listen(serverPort, serverIp, () => {
        const host: string = `http://${serverLocal}:${serverPort}`
        console.log(`Local host: ${host}`)

        const getIpTable = os.networkInterfaces()
        Object.values(getIpTable).forEach(list => {
            if (!list) {
                return
            }

            Object.values(list).forEach(listItem => {
                if (!listItem || listItem.internal) {
                    return
                }

                const ip: string = listItem.family == 'IPv6' ? `[${listItem.address}]` : listItem.address
                const host: string = `http://${ip}:${serverPort}`
                const self: string = `${host}/${validateServerPath}`

                axios({
                    method: 'POST',
                    url: self
                }).then(res => {
                    if (res.data == validateServer) {
                        console.log(`Public host: ${host}`)
                        serverUrl = host
                    }
                }).catch(() => { })
            })
        })

        statusBool = true
    })
}).catch(() => {
    statusBool = false
    console.log('Failed to start server')
})