import env from './env'

import fs from 'fs'
import path from 'path'
import Jimp from 'jimp'

export enum cacheTypesMedia {
    'png' = '.png',
    'jpg' = '.jpg',
    'jpeg' = '.jpg',
    'gif' = '.gif',
    'bmp' = '.bmp',
}

export enum cacheTypesText {
    'txt' = '.txt',
}

export type LolTeamLayout = { [key: string]: string }

export type LolTeams = { [key: string]: LolTeamLayout }

export let teamsStructure: LolTeams = {
    red: {
        ban1: '', champ1: '', champ1spell1: '', champ1spell2: '',
        ban2: '', champ2: '', champ2spell1: '', champ2spell2: '',
        ban3: '', champ3: '', champ3spell1: '', champ3spell2: '',
        ban4: '', champ4: '', champ4spell1: '', champ4spell2: '',
        ban5: '', champ5: '', champ5spell1: '', champ5spell2: '',
    },
    blue: {
        ban1: '', champ1: '', champ1spell1: '', champ1spell2: '',
        ban2: '', champ2: '', champ2spell1: '', champ2spell2: '',
        ban3: '', champ3: '', champ3spell1: '', champ3spell2: '',
        ban4: '', champ4: '', champ4spell1: '', champ4spell2: '',
        ban5: '', champ5: '', champ5spell1: '', champ5spell2: '',
    }
}

export let teams: LolTeams = teamsStructure

const srcCache = path.resolve(__dirname, '../cache')
const srcData = path.resolve(__dirname, '../core/data')

const supportMediaTypes = ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
const savePng = '.png'
const saveTxt = '.txt'

export const useMedia = savePng
export const useText = saveTxt

const saveSrc = path.resolve(srcData, 'cache.json')
const cacheMem = fs.existsSync(saveSrc) ? fs.readFileSync(saveSrc, 'utf8') : ''
const cacheMemData = cacheMem.length >= 2 ? JSON.parse(cacheMem) : {}
Object.assign(teams, cacheMemData);

const saveBody = JSON.stringify(teams)
fs.writeFileSync(saveSrc, saveBody)

const defaultChamp = path.resolve('' + env('CHAMP_ICON_FALLBACK'))
const defaultBanner = path.resolve('' + env('CHAMP_BANNER_FALLBACK'))
const defaultSpell = path.resolve('' + env('SPELL_ICON_FALLBACK'))

const lookupFile = function (iPath: string, iName: string): string | void {
    for (const ext of supportMediaTypes) {
        const lookup = path.resolve(iPath, iName + ext);
        if (fs.existsSync(lookup)) {
            return lookup
        }
    }
}

const saveCacheImage = (loadPath: string, savePath: string): void => {
    Jimp.read(loadPath, (err, img) => {
        if (err) {
            console.error(err)
            return
        }
        img.write(savePath)
    })
}

const saveCacheText = (savePath: string, saveBody: string) => {
    fs.writeFile(savePath, saveBody, err => {
        if (err) console.error(err)
    })
}

export const push = (team: string, slot: string, slotItem: string) => {
    return new Promise<boolean>((resolve, reject) => {
        if (!(team in teams)) {
            reject(false)
        } else if (!(slot in teams[team])) {
            reject(false)
        }

        teams[team][slot] = slotItem

        const slotType: string[] | null = slot.match(/^(ban|champ)[1-5](spell)?[1-2]?/)
        const saveSpot: string = path.resolve(srcCache, team, slot + savePng)

        let lookup = {
            champ: path.resolve('' + env('CHAMP_ICON_LOOKUP')),
            banner: path.resolve('' + env('CHAMP_BANNER_LOOKUP')),
            spell: path.resolve('' + ('SPELL_ICON_LOOKUP'))
        }

        let saveText: boolean = false
        let image: string = ''

        if (slotType?.[1] == 'champ' && slotType?.[2] == 'spell') {
            image = lookupFile(
                lookup.spell,
                slotItem
            ) || defaultSpell
        } else if (!slotType?.[2]) {
            saveText = true
            image = lookupFile(
                lookup.champ,
                slotItem
            ) || defaultChamp
        }

        if (!image) reject(false)
        if (saveText) saveCacheText(`cache/${team}/${slot}${saveTxt}`, slotItem)
        saveCacheImage(image, saveSpot)

        if (slotType?.[1] == 'champ' && !slotType?.[2]) {
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
}

export const build = (clean: boolean = false) => {
    return new Promise<{ errors: string[] }>(async resolve => {
        let errors: string[] = []

        const saveMatchName = path.resolve(srcCache, 'match' + saveTxt)
        if (!fs.existsSync(saveMatchName)) {
            saveCacheText(saveMatchName, 'BLUEvsRED')
        }

        for (const [team, teamData] of Object.entries(teams)) {
            const saveSpotName = path.resolve(srcCache, team, 'name' + saveTxt)
            if (!fs.existsSync(saveSpotName)) {
                saveCacheText(saveSpotName, team.toUpperCase())
            }

            for (const [spot, spotItem] of Object.entries(teamData)) {
                const item = <string>(!clean ? spotItem : '')
                push(team, spot, item).catch(err => {
                    console.error(err)
                })
            }
        }

        await save(errors.length === 0)
        resolve({ errors: errors })
    })
}

export const save = (is: boolean = true) => {
    return new Promise<boolean>((resolve, reject) => {
        if (!is) resolve(false)

        fs.writeFile(saveSrc, JSON.stringify(teams), err => {
            if (err) reject(err)
            resolve(true)
        })
    })
}

export const getState = () => {
    return teams
}

export const getRaw = () => {
    return teamsStructure
}
