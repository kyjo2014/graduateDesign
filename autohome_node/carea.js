
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const iconv = require('iconv-lite')
const User_Agent = require('./config/UA.js')
const fetchData = []
//配置axios
axios.defaults.responseType = 'arraybuffer'
axios.interceptors.request.use(
  function (config) {
    Object.assign(config.headers, {
      'User-Agent': User_Agent[Math.round(Math.random()) * (User_Agent.length - 1)]
    })
    return config
  },
  function (err) {
    console.log(err)
  }
)
async function fetchBrand() {
  let pageUrls = []
  let count = 0
  let countSuccess = 0
  const baseUrl = 'http://www.autohome.com.cn/grade/carhtml/'
  const BrandFirstLetter = [
    'A',
    'B',
    'C',
    'D',
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'W',
    'X',
    'Y',
    'Z'
  ]
  BrandFirstLetter.forEach(letter => {
    count++
    pageUrls.push(`${baseUrl}${letter}.html`)
  })
  for (let i = 0, len = pageUrls.length; i < len; i++) {
    await new Promise((resolve, reject) => {
      axios.get(pageUrls[i]).then(
        res => {
          let body = iconv.decode(res.data, 'gb2312')
          let $ = cheerio.load(body)
          let brands = $('dl')
          for (var i = 0; i < brands.length; i++) {
            let curBrands = brands.eq(i)
            var obj = {
              name: curBrands.find('dt div a').text(),
              sub: []
            }
            fetchData.push(obj)
            let series = curBrands.find('li')
            for (var j = 0; j < series.length; j++) {
              let curSeries = series.eq(j)
              var obj = {
                name: curSeries.find('h4 a').text(),
                sub: [],
                url: curSeries.find('h4 a').attr('href'),
                bbs: curSeries
                  .find('div')
                  .eq(-1)
                  .find('a')
                  .eq(-2)
                  .attr('href')
              }
              fetchData[fetchData.length - 1].sub.push(obj)
            }
          }

          resolve()
        },
        err => {
          if (err) {
            console.log(err)
            console.log('抓取该页面失败，重新抓取该页面..')
          }
        }
      )
    })
    }
  fs.writeFileSync(path.join(__dirname,'carUrls.json'),JSON.stringify(fetchData))  
  return fetchData
}
module.exports = fetchBrand