require('dotenv').config()
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const Jimp = require('jimp')

const srcData = path.resolve('core/data')
const srcChamp = path.resolve(process.env?.CHAMP_ICON_LOOKUP)
const srcBanner = path.resolve(process.env?.CHAMP_BANNER_LOOKUP)
const srcSpell = path.resolve(process.env?.SPELL_ICON_LOOKUP)

fs.mkdirSync(srcData, { recursive: true })
fs.mkdirSync(srcChamp, { recursive: true })
fs.mkdirSync(srcBanner, { recursive: true })
fs.mkdirSync(srcSpell, { recursive: true })

const apiVersion = process.env?.DRAGON_API_VERSION || '12.6.1'
const apiChamp = process.env?.DRAGON_API_CHAMP?.replace('%V', apiVersion)
const apiChampIcon = process.env?.DRAGON_API_CHAMP_ICON?.replace('%V', apiVersion)
const apiChampBanner = process.env?.DRAGON_API_CHAMP_BANNER?.replace('%V', apiVersion)
const apiSpell = process.env?.DRAGON_API_SPELL?.replace('%V', apiVersion)
const apiSpellIcon = process.env?.DRAGON_API_SPELL_ICON?.replace('%V', apiVersion)

const saveCacheImage = function (loadPath, savePath) {
    Jimp.read(loadPath, (err, img) => {
        if (err) {
            errors.push(err)
            return
        }

        img.write(savePath)
    })
}

axios.get(apiChamp).then(res => {
    if (!res?.data?.data) return
    const champs = Object.keys(res.data.data)
    const saveSrc = path.resolve(srcData, 'champs.json')
    const saveBody = JSON.stringify(champs)
    fs.writeFile(saveSrc, saveBody, err => { if (!err) return; console.error(err) })
    champs.forEach(val => {
        if (!val) return
        const saveChamp = path.resolve(srcChamp, val + '.png')
        saveCacheImage(apiChampIcon.replace('%N', val), saveChamp)

        const saveBanner = path.resolve(srcBanner, val + '.png')
        saveCacheImage(apiChampBanner.replace('%N', val), saveBanner)
        console.log(`Downloaded ${val}`)
    })
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
})