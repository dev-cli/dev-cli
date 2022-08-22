const axios = require('axios')

const baseURL = process.env.DEV_CLI_BASE_URL ? process.env.DEV_CLI_BASE_URL : 'http://localhost:7001'
const request = axios.create({
    baseURL,
    timepout: 60
})

request.interceptors.response.use(res => {
    return res.data
})

module.exports = request

