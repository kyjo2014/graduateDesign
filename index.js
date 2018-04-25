const express = require('express')
const axios = require('axios')
const Seq = require('sequelize')
const cheerio = require('cheerio')
const chalk = require('chalk')
const Url = require('url')
const log4js = require('log4js')
const {normalize, schema} = require('normalizr');

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
            appenders: [
                'default'
            ],
            level: 'INFO'
        }
    }

})
const logger = log4js.getLogger('default');

const User_Agent = [
    "Mozilla/5.0 (iPod; U; CPU iPhone OS 4_3_2 like Mac OS X; zh-cn) AppleWebKit/533." +
            "17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5",
    "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_2 like Mac OS X; zh-cn) AppleWebKit/53" +
            "3.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5",
    "MQQBrowser/25 (Linux; U; 2.3.3; zh-cn; HTC Desire S Build/GRI40;480*800)",
    "Mozilla/5.0 (Linux; U; Android 2.3.3; zh-cn; HTC_DesireS_S510e Build/GRI40) Appl" +
            "eWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
    "Mozilla/5.0 (SymbianOS/9.3; U; Series60/3.2 NokiaE75-1 /110.48.125 Profile/MIDP-" +
            "2.1 Configuration/CLDC-1.1 ) AppleWebKit/413 (KHTML, like Gecko) Safari/413",
    "Mozilla/5.0 (iPad; U; CPU OS 4_3_3 like Mac OS X; zh-cn) AppleWebKit/533.17.9 (K" +
            "HTML, like Gecko) Mobile/8J2",
    "Mozilla/5.0 (Windows NT 5.2) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0." +
            "742.122 Safari/534.30",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/535.1 (KHTML, like Ge" +
            "cko) Chrome/14.0.835.202 Safari/535.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/534.51.22 (KHTML, lik" +
            "e Gecko) Version/5.1.1 Safari/534.51.22",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML," +
            " like Gecko) Version/5.1 Mobile/9A5313e Safari/7534.48.3",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML," +
            " like Gecko) Version/5.1 Mobile/9A5313e Safari/7534.48.3",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML," +
            " like Gecko) Version/5.1 Mobile/9A5313e Safari/7534.48.3",
    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.8" +
            "35.202 Safari/535.1",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9" +
            ".0; SAMSUNG; OMNIA7)",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; XBLWP7; ZuneWP7)",
    "Mozilla/5.0 (Windows NT 5.2) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0." +
            "742.122 Safari/534.30",
    "Mozilla/5.0 (Windows NT 5.1; rv:5.0) Gecko/20100101 Firefox/5.0",
    "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.2; Trident/4.0; .NET CLR 1.1.432" +
            "2; .NET CLR 2.0.50727; .NET4.0E; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NE" +
            "T4.0C)",
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.2; .NET CLR 1.1.4322; .NET CLR 2" +
            ".0.50727; .NET4.0E; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET4.0C)",
    "Mozilla/4.0 (compatible; MSIE 60; Windows NT 5.1; SV1; .NET CLR 2.0.50727)",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR " +
            "2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C" +
            "; .NET4.0E)",
    "Opera/9.80 (Windows NT 5.1; U; zh-cn) Presto/2.9.168 Version/11.50",
    "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)",
    "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; .NET CLR 2.0.507" +
            "27; .NET CLR 3.0.04506.648; .NET CLR 3.5.21022; .NET4.0E; .NET CLR 3.0.4506.2152" +
            "; .NET CLR 3.5.30729; .NET4.0C)",
    "Mozilla/5.0 (Windows; U; Windows NT 5.1; zh-CN) AppleWebKit/533.21.1 (KHTML, lik" +
            "e Gecko) Version/5.0.5 Safari/533.21.1",
    "Mozilla/5.0 (Windows; U; Windows NT 5.1; ) AppleWebKit/534.12 (KHTML, like Gecko" +
            ") Maxthon/3.0 Safari/534.12",
    "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727; TheW" +
            "orld)"
]

const sequelize = new Seq('ershouche', 'root', 'lth111111122', {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    timestamps: false
})

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
        // databaseUse()
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
const Car = require('./models/car')(sequelize, Seq)
function databaseUse() {
    const Car = require('./models/car')(sequelize, Seq)
    Car.create({
        brand: '广汽本田',
        unique_id: 'che78308655',
        version: '本田 飞度两厢 2014款 1.5 自动 LX舒适版',
        first_licence: new Date(),
        mailage: 30000,
        new_price: 88800.00000000001,
        current_price: 74500,
        from: 1,
        area: 'beijing',
        color: '其它',
        transfer_times: 0,
        add_date: 1521106542776,
        fix_record: `前保险杠,后保险杠,左后门,左前门,右后车门裙边,右后车门裙边, 左后门,左前门`,
        url: 'https://www.xin.com/49wg548kea/che78308655.html'
    })
    Car
        .findAll()
        .then(cars => {
            log(cars)
        })
}

const getAllCity = require('./getAllcity')

const app = express()
const log = console.log

const BASE_URL = `https://www.xin.com/`
let cur_city = null
let cur_page = 44

async function getCarUrl(lurl) {
    let {data: pageResp} = await axios.get(lurl.join(''), {
        headers: {
            'User-Agent': User_Agent[Math.round(Math.random()) * (User_Agent.length - 1)]
        }
    })
    let $ = cheerio.load(pageResp)
    let cars = Array
        .from($('.pad a'))
        .map((elem, index) => {
            return elem.attribs.href
        })
    for (let i = 0; i < cars.length - 1; i++) {
        let delay_time = (Math.random() * 6) * 3000
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                axios.get(`https:${cars[i]}`, {
                    headers: {
                        'User-Agent': User_Agent[Math.round(Math.random()) * (User_Agent.length - 1)]
                    }
                }).then(async(resp) => {
                    const {data} = resp
                    const $ = cheerio.load(data)
                    const car = {
                        brand: trimString($('.cd_m_i_pz').find('dl').eq(1).find('dd').eq(0).find('.cd_m_innerlink1').text()),
                        unique_id: cars[i]
                            .split('/')[4]
                            .slice(0, -5),
                        version: trimString($('.cd_m_h_zjf').text()),
                        first_licence: new Date([
                            new String(execNumber(trimString($('.cd_m_info_desc li').eq(0).find('.cd_m_desc_key').text()))).slice(0, 4),
                            new String(execNumber(trimString($('.cd_m_info_desc li').eq(0).find('.cd_m_desc_key').text()))).slice(4)
                        ].join('.')),
                        mailage: priceToInt(execNumber(trimString($('.cd_m_info_desc li').eq(1).find('.cd_m_desc_val').text()))),
                        new_price: priceToInt(execNumber(trimString($('.cd_m_cursor .new-noline').text()))),
                        current_price: priceToInt(execNumber(trimString($('.cd_m_info_price .cd_m_info_jg').text()))),
                        from: 1,
                        area: lurl[1],
                        color: trimString($('.cd_m_i_pz').find('dl').eq(1).find('dd').eq(2).find('.cd_m_innerlink1').text()),
                        transfer_times: 0,
                        add_date: strToDate(trimString($('.cd_m_vpre_txt').text())),
                        fix_record: await get_chake_report(cars[i].split('/')[4].slice(3, -5), `https:${cars[i]}`),
                        url: `https:${cars[i]}`
                    }
                    Car
                        .create(car)
                        .then((res) => {
                            console.log(res)
                            resolve()
                        }, (reject) => {
                            resolve()
                        })

                })

            }, delay_time)
        })
        if (i % 10 == 0) {
            logger.info(`finish: city${lurl[1]} page${lurl[2].slice(1)} car${i} `)
        }
        
    }

}

function trimString(str) {
    return /\S+.+/.exec(str)[0]
}

function execNumber(str) {
    return parseFloat(str.replace(/[^0-9.]/ig, ""))
}

function priceToInt(price) {
    return price * 10000
}

function strToDate(str) {
    try {
        return new Date(/\d{4}.?\d{2}.?\d{0,2}/.exec(str))
    } catch (error) {
        log(chalk.red("日期格式错误"))
    } finally {
        return Date.now()
    }

}

async function getPage(lurl) {
    const MAX_PAGE = 50
    let begin_page = 0
    if (cur_page) {
        begin_page = cur_page
        cur_page = 0
    }
    for (let i = begin_page; i < MAX_PAGE; i++) {
        let url = [].concat(lurl, `/i${i}`)
        cur_page = i
        await getCarUrl(url)
    }
}

async function getCity(cityList) {
    for (let i = 0; i < cityList.length - 1; i++) {
        const url = [BASE_URL, cityList[i]]
        cur_city = cityList[i]
        await getPage(url)
    }

}

async function get_chake_report(carId, referer) {
    const Url = `http://www.xin.com/apis/ajax_report/get_chake_report/?carid=${carId}`
    let result = await axios.get(Url, {
        headers: {
            referer,
            'User-Agent': User_Agent[Math.round(Math.random()) * (User_Agent.length - 1)]
        }
    }).then((resp) => {
        const {data} = resp
        if (data['data'] && data['data']['flaw_pic_list']) {
            return (Array.prototype.concat.apply([], Object.values(data['data']['flaw_pic_list']).map((flawList) => {
                return flawList.map((flaw) => {
                    const {u2_name} = flaw
                    return u2_name
                })
            }))).join(',')
        } else {
            return ''
        }

    })
    return result
}
async function tasks() {
    let citys = await getAllCity()
    await getCity(citys)
}
tasks()

app.get('/', (req, res, next) => {
    res.send([{name: '当前城市',value: cur_city},{name: '当前页数',value: cur_page}])
})

class Spider {
    constructor(...args) {}

}

app.listen(9200)