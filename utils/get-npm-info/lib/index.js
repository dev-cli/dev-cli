'use strict';
const axios = require('axios')
// const semver = require('semver')


let request

function initRequest(registry) {
    const url = registry || getDetaultRegistry()
    request = axios.create({
        baseURL: url
    })
}

async function getNpmInfo(pkgName, registry) {
    if (!pkgName) return null
    initRequest(registry)
    const res = await request.get(pkgName)
    if (res.status === 200) {
        return res.data
    }
}

// async function getNpmVersions(pkgName, registry) {
//     const data = await getNpmInfo(pkgName, registry)
//     if (data) {
//         return Object.keys(data.versions)
//     }
//     return []
// }
// function getSemverVersions(currentVersion, versions) {
//     return versions.filter(version => semver.satisfies(version, `>${currentVersion}`)).sort((a, b) => semver.gt(b, a)?1:-1)
// }
// async function getSemverVersion(pkgName, currentVersion, registry) {
//     const versions = await getNpmVersions(pkgName, registry)
//     const newVersion = getSemverVersions(currentVersion, versions)
//     if(newVersion && newVersion.length > 0){
//         return newVersion[0]
//     }
//     return null
// }
async function getSemverVersion(pkgName, currentVersion, registry) {
    const info = await getNpmInfo(pkgName, registry)
    if(info['dist-tags'] && info['dist-tags'].latest){
        return info['dist-tags'].latest
    }
    return null
} 
function getDetaultRegistry(isOriginal = false) {
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

module.exports = {
    getNpmInfo,
    // getNpmVersions,
    // getSemverVersion,
    getSemverVersion
}