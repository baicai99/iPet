import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')

const args = process.argv.slice(2)

const getArgValue = (flag) => {
    const index = args.findIndex(arg => arg === flag)
    if (index === -1) return null
    return args[index + 1] || null
}

const versionArg = getArgValue('--version') || getArgValue('-v')
const versionCodeArg = getArgValue('--version-code')

const frontPackagePath = path.join(repoRoot, 'iPet-uniapp', 'package.json')
const backPackagePath = path.join(repoRoot, 'iPet-BackEnd', 'package.json')
const manifestPath = path.join(repoRoot, 'iPet-uniapp', 'src', 'manifest.json')

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))
const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

const updatePackageVersion = (filePath, version) => {
    const data = readJson(filePath)
    data.version = version
    writeJson(filePath, data)
}

const updateManifestVersions = (version, versionCode) => {
    let content = fs.readFileSync(manifestPath, 'utf8')
    const versionNamePattern = /("versionName"\s*:\s*")[^"]*(")/
    if (!versionNamePattern.test(content)) {
        throw new Error('manifest.json missing "versionName" field')
    }
    content = content.replace(versionNamePattern, `$1${version}$2`)

    if (versionCode) {
        const versionCodePattern = /("versionCode"\s*:\s*")[^"]*(")/
        if (!versionCodePattern.test(content)) {
            throw new Error('manifest.json missing "versionCode" field')
        }
        content = content.replace(versionCodePattern, `$1${versionCode}$2`)
    }

    fs.writeFileSync(manifestPath, content, 'utf8')
}

const frontPackage = readJson(frontPackagePath)
const version = versionArg || frontPackage.version

if (!version) {
    throw new Error('Version is required. Provide --version or set iPet-uniapp/package.json version.')
}

updatePackageVersion(frontPackagePath, version)
updatePackageVersion(backPackagePath, version)
updateManifestVersions(version, versionCodeArg)

console.log('[sync-version] Updated versions:')
console.log(`- iPet-uniapp/package.json -> ${version}`)
console.log(`- iPet-BackEnd/package.json -> ${version}`)
console.log(`- iPet-uniapp/src/manifest.json -> versionName=${version}${versionCodeArg ? `, versionCode=${versionCodeArg}` : ''}`)
