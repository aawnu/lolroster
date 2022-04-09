require('dotenv').config()
const fs = require('fs')
const path = require('path')
const Jimp = require('jimp')

let errors = []

const srcCache = path.resolve('cache')
const srcData = path.resolve('core/data')

const supportMediaTypes = ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
const savePng = '.png'
const saveTxt = '.txt'

const saveSrc = path.resolve(srcData, 'cache.json')
const cacheMem = fs.existsSync(saveSrc) ? fs.readFileSync(saveSrc, 'utf8') : ''
const cacheMemData = cacheMem.length >= 2 ? JSON.parse(cacheMem) : {}
const cacheRaw = {
    blue: {
        ban1: '',
        ban2: '',
        ban3: '',
        ban4: '',
        ban5: '',
        champ1: '',
        champ1spell1: '',
        champ1spell2: '',
        champ2: '',
        champ2spell1: '',
        champ2spell2: '',
        champ3: '',
        champ3spell1: '',
        champ3spell2: '',
        champ4: '',
        champ4spell1: '',
        champ4spell2: '',
        champ5: '',
        champ5spell1: '',
        champ5spell2: '',
    },
    red: {
        ban1: '',
        ban2: '',
        ban3: '',
        ban4: '',
        ban5: '',
        champ1: '',
        champ1spell1: '',
        champ1spell2: '',
        champ2: '',
        champ2spell1: '',
        champ2spell2: '',
        champ3: '',
        champ3spell1: '',
        champ3spell2: '',
        champ4: '',
        champ4spell1: '',
        champ4spell2: '',
        champ5: '',
        champ5spell1: '',
        champ5spell2: '',
    }
}
const cacheData = {}
Object.assign(cacheData, cacheRaw, cacheMemData);

const saveBody = JSON.stringify(cacheData)
fs.writeFile(saveSrc, saveBody, err => {
    if (err) errors.push(err)
})

const defaultChamp = path.resolve(process.env?.CHAMP_ICON_FALLBACK)
const defaultBanner = path.resolve(process.env?.CHAMP_BANNER_FALLBACK)
const defaultSpell = path.resolve(process.env?.SPELL_ICON_FALLBACK)

const lookupFile = function (iPath, iName) {
    for (const ext of supportMediaTypes) {
        const lookup = path.resolve(iPath, iName + ext);
        if (fs.existsSync(lookup)) {
            return lookup
        }
    }
}

const saveCacheImage = function (loadPath, savePath) {
    Jimp.read(loadPath, (err, img) => {
        if (err) {
            errors.push(err)
            return
        }
        img.write(savePath)
    })
}

const saveCacheText = function (savePath, saveBody) {
    fs.writeFile(savePath, saveBody, err => {
        if (err) console.error(err)
    })
}

const push = (team, slot, slotItem) => new Promise((resolve, reject) => {
    if (typeof cacheRaw?.[team]?.[slot] != 'string') reject(false)

    cacheData[team][slot] = slotItem

    const slotType = slot.match(/^(ban|champ)[1-5](spell)?[1-2]?/)
    const saveSpot = path.resolve(srcCache, team, slot + savePng)

    let lookup = {
        champ: path.resolve(process.env?.CHAMP_ICON_LOOKUP),
        banner: path.resolve(process.env?.CHAMP_BANNER_LOOKUP),
        spell: path.resolve(process.env?.SPELL_ICON_LOOKUP)
    }

    let saveText = false
    let image = null

    if (slotType[1] == 'champ' && slotType[2] == 'spell') {
        image = lookupFile(
            lookup.spell,
            slotItem
        ) || defaultSpell
    } else if (!slotType[2]) {
        saveText = true
        image = lookupFile(
            lookup.champ,
            slotItem
        ) || defaultChamp
    }

    if (!image) reject(false)
    if (saveText) saveCacheText(`cache/${team}/${slot}${saveTxt}`, slotItem)
    saveCacheImage(image, saveSpot)

    if (slotType[1] == 'champ' && !slotType[2]) {
        image = lookupFile(
            lookup.banner,
            slotItem
        ) || defaultBanner
        if (!!image) {
            const saveSpot = path.resolve(srcCache, team, slot + 'banner' + savePng)
            saveCacheImage(image, saveSpot)
        }
    }

    resolve(true)
})

const build = (clean = false) => new Promise((resolve, reject) => {
    let errors = []

    const saveMatchName = path.resolve(srcCache, 'match' + saveTxt)
    if (!fs.existsSync(saveMatchName)) {
        saveCacheText(saveMatchName, 'BLUEvsRED')
    }

    for (const [team, teamData] of Object.entries(cacheData)) {
        const saveSpotName = path.resolve(srcCache, team, 'name' + saveTxt)
        if (!fs.existsSync(saveSpotName)) {
            saveCacheText(saveSpotName, team.toUpperCase())
        }

        for (const [spot, spotItem] of Object.entries(teamData)) {
            const item = !clean ? spotItem : ''
            push(team, spot, item).catch(err => {
                errors.push(err)
            })
        }
    }

    save(errors.length == 0).finally(() => {
        resolve({ errors: errors })
    })
})

const save = (is = true) => new Promise((resolve, reject) => {
    if (!is) resolve(false)

    fs.writeFile(saveSrc, JSON.stringify(cacheData), err => {
        if (err) reject(err)
        resolve(true)
    })
})

const getState = function () {
    return cacheData
}

const getRaw = function () {
    return cacheRaw
}

module.exports = {
    getState,
    getRaw,
    push,
    build,
    save
}