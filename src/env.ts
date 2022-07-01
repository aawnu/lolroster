import dotenv from "dotenv"
import path from "path"
import fs from "fs"

const envPath = path.resolve(__dirname, '../.env')
const envLoad = fs.readFileSync(envPath, 'utf8')
const envData = dotenv.parse(envLoad)

export default (name: string, fallback?: string | number): string | number | null | boolean => {
    return envData?.[name] ?? (fallback ?? null)
}