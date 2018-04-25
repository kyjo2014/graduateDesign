const express = require('express')
const axios = require('axios')
const Seq = require('sequelize')
const cheerio = require('cheerio')
const chalk = require('chalk')
const Url = require('url')
const log4js = require('log4js')
const iconv = require('iconv-lite')
const puppeteer = require('puppeteer-cn')
const { normalize, schema } = require('normalizr')

const app = express()
const User_Agent = [
  'Mozilla/5.0 (iPod; U; CPU iPhone OS 4_3_2 like Mac OS X; zh-cn) AppleWebKit/533.' +
    '17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5',
  'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_2 like Mac OS X; zh-cn) AppleWebKit/53' +
    '3.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5',
  'MQQBrowser/25 (Linux; U; 2.3.3; zh-cn; HTC Desire S Build/GRI40;480*800)',
  'Mozilla/5.0 (Linux; U; Android 2.3.3; zh-cn; HTC_DesireS_S510e Build/GRI40) Appl' +
    'eWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
  'Mozilla/5.0 (SymbianOS/9.3; U; Series60/3.2 NokiaE75-1 /110.48.125 Profile/MIDP-' +
    '2.1 Configuration/CLDC-1.1 ) AppleWebKit/413 (KHTML, like Gecko) Safari/413',
  'Mozilla/5.0 (iPad; U; CPU OS 4_3_3 like Mac OS X; zh-cn) AppleWebKit/533.17.9 (K' +
    'HTML, like Gecko) Mobile/8J2',
  'Mozilla/5.0 (Windows NT 5.2) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.' +
    '742.122 Safari/534.30',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/535.1 (KHTML, like Ge' +
    'cko) Chrome/14.0.835.202 Safari/535.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/534.51.22 (KHTML, lik' +
    'e Gecko) Version/5.1.1 Safari/534.51.22',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML,' +
    ' like Gecko) Version/5.1 Mobile/9A5313e Safari/7534.48.3',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML,' +
    ' like Gecko) Version/5.1 Mobile/9A5313e Safari/7534.48.3',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML,' +
    ' like Gecko) Version/5.1 Mobile/9A5313e Safari/7534.48.3',
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.8' +
    '35.202 Safari/535.1',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9' +
    '.0; SAMSUNG; OMNIA7)',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; XBLWP7; ZuneWP7)',
  'Mozilla/5.0 (Windows NT 5.2) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.' +
    '742.122 Safari/534.30',
  'Mozilla/5.0 (Windows NT 5.1; rv:5.0) Gecko/20100101 Firefox/5.0',
  'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.2; Trident/4.0; .NET CLR 1.1.432' +
    '2; .NET CLR 2.0.50727; .NET4.0E; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NE' +
    'T4.0C)',
  'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.2; .NET CLR 1.1.4322; .NET CLR 2' +
    '.0.50727; .NET4.0E; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET4.0C)',
  'Mozilla/4.0 (compatible; MSIE 60; Windows NT 5.1; SV1; .NET CLR 2.0.50727)',
  'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR ' +
    '2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C' +
    '; .NET4.0E)',
  'Opera/9.80 (Windows NT 5.1; U; zh-cn) Presto/2.9.168 Version/11.50',
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)',
  'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 2.0.507' +
    '27; .NET CLR 3.0.04506.648; .NET CLR 3.5.21022; .NET4.0E; .NET CLR 3.0.4506.2152' +
    '; .NET CLR 3.5.30729; .NET4.0C)',
  'Mozilla/5.0 (Windows; U; Windows NT 5.1; zh-CN) AppleWebKit/533.21.1 (KHTML, lik' +
    'e Gecko) Version/5.0.5 Safari/533.21.1',
  'Mozilla/5.0 (Windows; U; Windows NT 5.1; ) AppleWebKit/534.12 (KHTML, like Gecko' +
    ') Maxthon/3.0 Safari/534.12',
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727; TheW' +
    'orld)'
]
const fetchData = []
//配置axios
axios.defaults.responseType = 'arraybuffer'
axios.interceptors.request.use(
  function(config) {
    Object.assign(config.headers, {
      'User-Agent':
        User_Agent[Math.round(Math.random()) * (User_Agent.length - 1)]
    })
    return config
  },
  function(err) {
    console.log(err)
  }
)
/**
 * @description 爬取品牌&车型
 */
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
  return fetchData
}
// fetchBrand()
/**
 * @description 创造timeout
 * @param {any} time
 * @returns
 */
function timeout(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time || Math.random() * 6000)
  })
}
/**
 * @description 模拟用户操作
 * @param {any} page
 */
async function fakeMoving(page, lastHeight = 100) {
  const height = lastHeight + Math.random() * 10000
  await page.evaluate(`
    window.dispatchEvent(new UIEvent('focus'));  
  `)
  await page.evaluate(`
    window.dispatchEvent(new UIEvent('click'));  
  `)
  await page.evaluate(`window.scroll(0,${height})`)
  return height
}
/**
 * @description 多次假操作
 * @param {any} page 
 */
  async function fakeMovingMulit(page) {
  let lastHeight = 100
  for (let i = 0, len = 10 + Math.random() * 10; i < len; i++) {
    lastHeight = await fakeMoving(page, lastHeight)
    await timeout()
  }
}
/**
 * @description 启动puppeteer
 * @param {any} params
 */
async function run(params) {
  const browser = await puppeteer.launch({
    headless: true,
    timeout: 0
  })
  let brandData = await fetchBrand()
  for (let i = 0; i < 1 /*brandData.length*/; i++) {
    const curBrand = brandData[i]
    for (let j = 0; j < 1 /*curBrand.sub.length*/; j++) {
      const page = await browser.newPage()
      await page.goto(`https:${curBrand.sub[j].bbs}`)
      await page.evaluate(
        `document.querySelectorAll('.carea .tab a')[6].click()`
      )
      await page.goto(`https:${curBrand.sub[j].bbs.split('#')[0]}?type=101`)
      let curCarComment = await goToComment(browser, page)
      console.log(curCarComment)
    }
  }
}
// let cssMap = await createCSSMap(page)
// let carConfig = await getCarConfig(page)
// await getCarComment(browser)
// await getBaseNum()
/**
 * @description 跳转到质量区
 * @param {any} page
 */
async function gotoQuality(page) {}

async function goToComment(broswer, page) {
  // let commentLen = await page.evaluate(
  //   `document.querySelectorAll('#subcontent .a_topic').length`
  // )
  let allCommentUrl = []
  // for (let i = 0; i < commentLen; i++) {
  allCommentUrl = await page.evaluate(
    `Array.from(document.querySelectorAll('#subcontent .a_topic')).map((item)=>{
        return item.href
      })`
  )
  // }
  // console.log(allComment)
  let allCommentContent = []
  for (let i = 0; i < allCommentUrl.length; i++) {
    let curCarPage = await broswer.newPage()
    await curCarPage.goto(allCommentUrl[i])
    await timeout(2000)
    await fakeMovingMulit(page)
    await timeout()
    let curPageComment = await curCarPage.evaluate(`Array.from(document.querySelectorAll('.rconten div[xname="content"]')).map((item)=>{
      return item.textContent
    })`)
    allCommentContent.push({
      question: curPageComment[0],
      answers: curPageComment.slice(1)
    })
    curCarPage.close()
  }
  return allCommentContent
}
/**
 * @description 创建css映射
 */
async function createCSSMap(page) {
  const createCSSMapOrd = `
  Array.from(document.querySelectorAll('span '))
    .map((spanElm)=>{
      return {
        key: spanElm.className,
        value: window.hs_fuckyou(
          spanElm,':before'
        ).getPropertyValue('content')
      } 
  }).filter((toObj)=>{
    const nameL = toObj.key.split('_')
    if(nameL.length !== 3){
      return false
    }
    return true
  })
  `
  let allSpan = await page.evaluate(createCSSMapOrd)
  const CSSMapped = new Map()
  allSpan.forEach(item => {
    let { key, value } = item
    value = value.substring()
    CSSMapped.set(key, value)
  })
  return CSSMapped
}

/**
 * @description 获得车型参数
 * @param {any} page
 * @returns
 */
async function getCarConfig(page) {
  const carConfigOrd = `
    window.config
  `
  const carOptionOrd = `
    window.option
  `
  let baseConfig = await page.evaluate(carConfigOrd)
  let optionConfig = await page.evaluate(carConfigOrd)
  return {
    base: baseConfig,
    option: optionConfig
  }
}

/**
 * @description 获取车型论坛评论
 * @param {any} page
 */
async function getCarComment(broswer) {
  const page = await broswer.newPage()
  let QualityFeedback =
    'https://club.autohome.com.cn/bbs/forum-c-3170-1.html' + '?type=101'
  // let AskEveryOne = `https://zhidao.autohome.com.cn/summary/${(carID = 3710)}-4-1-${(page = 1)}.html`
  let getCommentUrlOrd = `
  Array.from(document.querySelectorAll('.carea .a_topic')).map((item)=>{
    return item.href
  })
  `
  await page.goto(QualityFeedback)
  await timeout(2000)
  let quailtyComment = await page.evaluate(getCommentUrlOrd)
}
run()
