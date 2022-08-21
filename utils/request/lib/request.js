const axios = require('axios')

const baseURL = process.env.DEV_CLI_BASE_URL ? process.env.DEV_CLI_BASE_URL : 'https://5804g5z580.goho.co11111s'
const request = axios.create({
    baseURL,
    timepout: 60
})

request.interceptors.response.use(res => {
    return res.data
})

module.exports = request

