import env from './env'

import fs from 'fs'
import path from 'path'
import axios from 'axios'
import Jimp from 'jimp'

const srcData: string = path.resolve('core/data')
const srcChamp: string = path.resolve('' + env('CHAMP_ICON_LOOKUP'))
const srcBanner: string = path.resolve('' + env('CHAMP_BANNER_LOOKUP'))
const srcSpell: string = path.resolve('' + env('SPELL_ICON_LOOKUP'))

fs.mkdirSync(srcData, { recursive: true })
fs.mkdirSync(srcChamp, { recursive: true })
fs.mkdirSync(srcBanner, { recursive: true })
fs.mkdirSync(srcSpell, { recursive: true })

const saveCacheImage = function (loadPath: string, savePath: string) {
    Jimp.read(loadPath, (err, img) => {
        if (err) {
            console.error(err)
            return
        }

        img.write(savePath)
    })
}

let apiVersion: string = ('' + env('DRAGON_API_VERSION', '@LATEST'))
let apiVersionUrl: string = 'http://ddragon.leagueoflegends.com/api/versions.json'

axios.get(apiVersionUrl).then(versionList => {
    if (!versionList || !versionList?.data) {
        throw new Error(`Could not validate api verison`)
    } else if (apiVersion == '@LATEST') {
        apiVersion = versionList.data[0]
    } else if (!versionList.data.includes(apiVersion)) {
        throw new Error(`Could not validate api verison`)
    }

    const apiChamp: string = ('' + env('DRAGON_API_CHAMP'))?.replace('%V', apiVersion)
    const apiChampIcon: string = ('' + env('DRAGON_API_CHAMP_ICON'))?.replace('%V', apiVersion)
    const apiChampBanner: string = ('' + env('DRAGON_API_CHAMP_BANNER'))?.replace('%V', apiVersion)
    const apiSpell: string = ('' + env('DRAGON_API_SPELL'))?.replace('%V', apiVersion)
    const apiSpellIcon: string = ('' + env('DRAGON_API_SPELL_ICON'))?.replace('%V', apiVersion)

    axios.get(apiChamp).then(res => {
        if (!res?.data?.data) return
        const champs: string[] = Object.keys(res.data.data)
        const saveSrc: string = path.resolve(srcData, 'champs.json')
        const saveBody: string = JSON.stringify(champs)
        fs.writeFile(saveSrc, saveBody, err => { if (!err) return; console.error(err) })
        champs.forEach(val => {
            if (!val) return
            const saveChamp = path.resolve(srcChamp, val + '.png')
            saveCacheImage(apiChampIcon.replace('%N', val), saveChamp)

            const saveBanner = path.resolve(srcBanner, val + '.png')
            saveCacheImage(apiChampBanner.replace('%N', val), saveBanner)
            console.log(`Downloaded ${val}`)
        })
    }).catch(err => {
        console.error('Champ > ', err, ' < Champ', apiChamp)
    })

    axios.get(apiSpell).then(res => {
        if (!res?.data?.data) return
        const spells = Object.keys(res.data.data)
            .filter(f => !f.toLowerCase().includes('placeholder') && !f.toLowerCase().includes('_mark'))
        const saveSrc = path.resolve(srcData, 'spells.json')
        const saveBody = JSON.stringify(spells)
        fs.writeFile(saveSrc, saveBody, err => { if (!err) return; console.error(err) })
        spells.forEach(val => {
            if (!val) return
            const saveSpell = path.resolve(srcSpell, val + '.png')
            saveCacheImage(apiSpellIcon.replace('%N', val), saveSpell)
            console.log(`Downloaded ${val}`)
        })
    }).catch(err => {
        console.error('Spell > ', err, ' < Spell', apiSpell)
    })

}).catch(err => {
    console.error('Version > ', err, ' < Version', apiVersionUrl)
})