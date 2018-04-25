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
        User_Agent[Math.round(Math.random()) * (User_Agent.length - 1)],
      'Accept-Encoding': `gzip,
      deflate,
      br`,
      'Accept-Language': `zh-CN,zh;q=0.9`
    })
    return config
  },
  function(err) {
    console.log(err)
  }
)

axios