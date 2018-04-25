const fs = require('fs')
const path = require('path')

const CITY_SLIM_DIR = path.join(__dirname, 'assets', 'slim.txt')

module.exports = function () {
    return new Promise((resolve, reject) => {
        fs.readFile(CITY_SLIM_DIR, {
            encoding: 'utf8'
        }, (err, data) => {
            if (err) {
                reject(err)
                return;
            }
            let formated = data
                .toString()
                .split('\r\n')
            formated = formated.map((city) => {
                return city
                    .split(/\s+/)[1]
                    .toLowerCase()
            })
            resolve(formated)
        })
    })
}
