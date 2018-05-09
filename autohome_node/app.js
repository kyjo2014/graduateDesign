const express = require('express')
const axios = require('axios')
const Seq = require('sequelize')
const cheerio = require('cheerio')
const chalk = require('chalk')
const Url = require('url')
const log4js = require('log4js')

const puppeteer = require('puppeteer-cn')
const fs = require('fs')
const path = require('path')
const fetchBrand = require('./carea')
const { normalize, schema } = require('normalizr')
const { database, user, password } = require('./config/db.js')

const User_Agent = require('./config/UA.js')
const { waitOption, clickOption } = require('./config/puppeteerPreset')
const app = express()
log4js.configure({
  appenders: {
    default: {
      level: 'INFO',
      type: 'file',
      filename: './log/default.log'
    }
  },
  categories: {
    default: {
      appenders: ['default'],
      level: 'INFO'
    }
  }
})
const logger = log4js.getLogger('default')
const sequelize = new Seq(database, user, password, {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  timestamps: false,
  logging: () => {}
})
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
    // databaseUse()
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })
const Comment = require('./models/comment')(sequelize, Seq)
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
  const index = lastHeight + 1
  await page.focus('body')
  await page.click(`body`, {
    button: 'left',
    delay: 50
  })
  await page.evaluate(`window.scroll(0,${height})`)
  return height
}
/**
 * @description 多次假操作
 * @param {any} page
 */
async function fakeMovingMulit(page) {
  let lastHeight = 100
  for (let i = 0, len = 4 + Math.random() * 10; i < len; i++) {
    lastHeight = await fakeMoving(page, i)
    await timeout()
  }
}
let brandData = []
/**
 * @description 初始化url数据
 */
async function init() {
  const carUrls = path.join(__dirname, 'carUrls.json')
  const lastFinish = path.join(__dirname, 'situation.json')
  if (fs.existsSync(carUrls)) {
    console.log('carUrls exists')
   
    brandData = JSON.parse(fs.readFileSync(carUrls))
    console.log(urlMapped(brandData))
  } else {
    brandData = await fetchBrand()
  }
  if (fs.existsSync(lastFinish)) {
  }
}

function urlMapped(carea) {
  try {
    return [].concat.apply(
      [],
      carea.map(brand => {
        if (brand.hasOwnProperty('sub')) {
          return brand.sub.map(serise => {
            return serise.bbs || null
          }).filter((url) => {
            if (/www\.che168\.com/.test(url) || !url) {
              return false
            } else {
              return true
            }
            
          })
        }
        return []
      })
    )
  } catch (err) {
    console.log('carea error', carea, err)
  }
}

function getBrandUrl() {
  return brandData.shift()
}

/**
 * @description 错误次数计算
 * @returns
 */
function errCul() {
  let times = 0
  return {
    getTime: function() {
      return times
    },
    addTime: function() {
      times++
    }
  }
}
/**
 * @description
 */
function situationRecord() {}

/**
 * @description 启动puppeteer
 * @param {any}
 */
async function run() {
  if (!run.errCul) {
    run.errCul = errCul()
  }
  const browser = await puppeteer.launch({
    headless: true,
    timeout: 0,
    args: [
      `--user-agent="Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"`
    ]
  })
  try {
    while (brandData.length) {
      const curBrand = getBrandUrl()
      while (curBrand.sub.length) {
        const curBrandSub = curBrand.sub.shift()
        const page = await browser.newPage()
        await page.goto(`https:${curBrandSub.bbs}`)
        await page.click('.carea .tab li:nth-child(6) a', {
          button: 'left',
          delay: 50
        })
        await page.goto(`https:${curBrandSub.bbs.split('#')[0]}?type=101`)
        let curCarComments = await goToComment(browser, page) //
        for (let i = 0, len = curCarComments.length; i < len; i++) {
          let { forumName, url, question, answers } = curCarComments[i]
        }
      }
      fs.writeFileSync(
        path.join(__dirname, 'carUrls.json'),
        JSON.stringify(brandData)
      )
    }
    await browser.close()
  } catch (error) {
    let errCul = run.errCul
    if (errCul) {
      if (errCul.getTime() < 2) {
        await browser.close()
        await timeout()
        logger.error(`browser error`, error)
        init()
      }
    }
    console.log(`browser error`, error)
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
/**
 * @description 跳转到下一评论页
 * @param {any} params
 */
async function goToNextCommentPage(page, index) {
  try {
    await page.click(`.pagearea a:nth-of-type(${index})`, clickOption)
    await Promise.all([page.waitForNavigation(waitOption), timeout(2000)])
  } catch (error) {}
}
/**
 * @description 跳转到评论页获取当页的评论
 * @param {any} browser
 * @param {any} page
 * @returns 当前页所有评论
 */
async function goToComment(browser, page) {
  let allCommentUrl = []
  let pageContent = null
  try {
    pageContent = page.content()
    allCommentUrl = await page.evaluate(
      `Array.from(document.querySelectorAll('#subcontent .a_topic')).map((item)=>{
          return item.href
        })`
    )

    const forumName = await page.evaluate(
      `
      document.querySelector('.cbinfo h1').title
      `
    )

    const allCommentContent = await getCommentFromUrls(
      allCommentUrl,
      forumName,
      browser
    )
    const pagesLen = (await page.$$(`.pagearea a`)).length
    for (let i = 0, len = pagesLen; i < len; i++) {
      await goToNextCommentPage(page, i)
      let curPageUrls = await page.evaluate(
        `Array.from(document.querySelectorAll('#subcontent .a_topic')).map((item)=>{
          return item.href
        })`
      )

      await getCommentFromUrls(curPageUrls, forumName, browser)
    }
    page.close()
    return allCommentContent
  } catch (error) {
    console.error('goTocommentError', error, pageContent)
  }
}

/**
 * @description 获取所有Url对应的评论
 * @param {any} urls
 * @param {any} forumName
 * @param {any} browser
 * @returns
 */
async function getCommentFromUrls(urls, forumName, browser) {
  const allCommentUrl = urls
  let allCommentContent = []
  let pageContent = null
  try {
    for (let i = 0; i < allCommentUrl.length; i++) {
      let curCarPage = await browser.newPage()
      await curCarPage.goto(allCommentUrl[i])
      pageContent = await curCarPage.content()
      await fakeMovingMulit(curCarPage)

      let curPageComment = await curCarPage.evaluate(`Array.from(document.querySelectorAll('.rconten div[xname="content"]')).map((item)=>{
        return item.textContent
      })`)
      allCommentContent.push({
        forumName,
        url: allCommentContent[i],
        question: curPageComment[0],
        answers: curPageComment.slice(1)
      })
      await Comment.create({
        __url: allCommentUrl[i],
        question_title: curPageComment[0],
        question_detail: curPageComment[0],
        question_forum: forumName,
        question_answer: JSON.stringify(curPageComment.slice(1))
      })
      console.log(`finish${curPageComment[0]}`)
      fs.writeFileSync(
        path.join(__dirname, 'situation.json'),
        JSON.stringify({
          curForumName: forumName,
          curUrl: allCommentUrl[i]
        })
      )
      curCarPage.close()
    }
  } catch (error) {
    console.log(`getCommentFromUrls`, allCommentUrl[i], pageContent, error)
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
async function getCarComment(browser) {
  const page = await browser.newPage()
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

async function startScrapy() {
  await init()
  await run()
}
startScrapy()
