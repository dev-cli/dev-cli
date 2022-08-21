const request = require('@dev-cli/request')

async function getTemplate(){
    return request.get('/project/template')
}


module.exports = {
    getTemplate
}