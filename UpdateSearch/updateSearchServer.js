const { connection } = require('./servStuff')
    , express = require('express')
    , bodyParser = require('body-parser')
    , cors = require('cors')
    , massive = require('massive')
    , fs = require('fs')
    , numWords = require('num-words')
    , _ = require('lodash');
const { round } = require('lodash');

const app = new express()
app.use(bodyParser.json())
app.use(cors())

String.prototype.toProperCase = function (opt_lowerCaseTheRest) {
    return (opt_lowerCaseTheRest ? this.toLowerCase() : this)
        .replace(/(^|[\s\xA0])[^\s\xA0]/g, function (s) { return s.toUpperCase(); });
};

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function updateSearch(endpoint) {
    const db = app.get('db')
        , chapterName = numWords(endpoint)

    if (endpoint === 1 || endpoint === 5 || endpoint === 14) {
        fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`, "utf-8", (err, data) => {
            if (err) console.log(err);
            let basicDataObject = cleanHTML(data, endpoint)
            ,   promiseArray = []

            for (key in basicDataObject) {
                promiseArray.push(db.basic(key, basicDataObject[key], endpoint).then())
            }
            
            Promise.all(promiseArray).then(_ => {
                console.log(`Successfully Wrote Chapter ${endpoint}.`);
                if (endpoint !== 15) {
                    updateSearch(endpoint + 1)
                } else {
                    console.log('ALL DONE')
                }
            })
        })
    } else {
        fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`, "utf-8", (err, data) => {
            fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}-advanced/chapter-${chapterName}-advanced.component.html`, "utf-8", (adverr, advData) => {
                if (err) console.log(err);
                let advDataObject = cleanHTML(advData, endpoint)
                ,   basicDataObject = cleanHTML(data, endpoint)
                ,   promiseArray = []

                for (key in basicDataObject) {
                    promiseArray.push(db.basic(key, basicDataObject[key], endpoint).then())
                }
                for (key in advDataObject) {
                    promiseArray.push(db.advanced(key, advDataObject[key], endpoint).then())
                }

                // Promise.all(finalCompare).then(finalIdArray => {
                //     if (endpoint === 12) {
                //         updateGreatLibrarySpells()
                //     }

                Promise.all(promiseArray).then(_ => {
                    console.log(`Successfully Wrote Chapter ${endpoint}.`);
                    if (endpoint !== 15) {
                        updateSearch(endpoint + 1)
                    } else {
                        console.log('ALL DONE')
                    }
                })
            })
        })
    }
}

function cleanHTML(data) {
    html = data.replace(/ _ngcontent-c2=""/g, '').replace(/\n||\t||\r/g, '');
    newhtml = html.split(/anchor"|anchor'|anchor /)
    let dataObject = {}

    for (i = 0; i <= newhtml.length - 1; i++) {
        //find the id
        if (newhtml[i].includes('id=')) {
            let id = newhtml[i].match(/id='(.*?)'|id="(.*?)"/gm)

            // sometimes the id doesn't have quotation marks so this is checking
            if (id && id[0]) {
                id = id[0].substring(4)
                id = id.substring(0, id.length - 1)
            } else {
                id = newhtml[i].match(/id=(.*?) /gm)[0].substring(3).trim()
            }

            // strip final bits of HTML
            let section = newhtml[i].replace(/(\r\n|\n|\r)/gm, '').replace(/\s\s+/g, ' ').match(/<h.*?>(.*?)<\/h|<p.*?>(.*?)<\/p/g)
            // this will also catch images with ids but it will result in section being null so this is just tell it to ignore those
            if (section) {
                section = section[0].replace(/<strong.*?>|<\/strong>|<a.*?>|<\/a>/g, '')
                section = section.split('>')[1].split('<')[0]

                dataObject[id] = section
            }
        }
    }

    return dataObject
}

function updateGreatLibrarySpells() {
    const db = app.get('db')

    fs.readFile(`../bonfireSRD/src/app/chapters/chapter-twelve/chapter-twelve.component.html`, "utf-8", (err, data) => {
        if (err) { console.log(err) }

        // Update Spells
        let spellArray = []
        let spellList = data.split('SPELL DESCRIPTIONS')[1].split('<h3>')

        for (i = 1; i < spellList.length; i++) {
            let spell = spellList[i].split("strong class='orangeHeader'").map((val, index) => {
                if (val.includes("POSITIVE") || val.includes("NEGATIVE")) {
                    // breaks up the effect sections
                    val = val.split('</p>').map(innerVal => {
                        // strip HTML, line breaks, and remove multiple spaces from those sections
                        return innerVal.replace(/<(?:.|\n)*?>|<|>|\r\n|\n|\r/gm, '').replace(/\s\s+/g, ' ').trim().replace(/POSITIVE |NEGATIVE /g, '')
                    })
                } else {
                    // strip HTML, line breaks, and remove multiple spaces
                    val = val.replace(/<(?:.|\n)*?>|<|>|\r\n|\n|\r/gm, '').replace(/\s\s+/g, ' ').trim().replace(/BASE COST |COMPONENTS |DURATION |RADIUS /g, '')

                    if (index === 1) {
                        val = val.replace('ORDERS ', '').split(' | ')
                    }
                }

                return val
            })

            spellArray.push(spell)
        }

        db.query('select name, id from glspells').then(checkList => {
            db.query('select * from glorders').then(orderList => {
                insertOrUpdateSpell(spellArray, checkList, 0, db, orderList)
            })
        })
    })
}

function insertOrUpdateSpell(spellList, checkList, index, db, orderList) {
    let spell = spellList[index]
    let checkListVersion = checkList.find(obj => obj.name === spell[0])

    if (index === spellList.length - 1) {
        console.log('spells updated')
    } else if (checkListVersion) {
        console.log(spell[0])
        db.query('update glspells set name = $1, base_cost = $2, components = $3, duration = $4, aoe = $5 where name = $1', [spell[0], spell[2], spell[3], spell[4], spell[5], spell[6]]).then(_ => {
            insertSpellOrders({ spellList, checkList, index, db, orderList, spell }, spell[1], checkListVersion.id, 0)
        })
    } else {
        console.log(spell[0])
        db.query('insert into glspells (name, base_cost, components, duration, aoe) values ($1, $2, $3, $4, $5); select id from glspells where name = $1', [spell[0], spell[2], spell[3], spell[4], spell[5], spell[6]]).then(newSpell => {
            insertSpellOrders({ spellList, checkList, index, db, orderList, spell }, spell[1], newSpell[0].id, 0)
        })
    }
}

function insertSpellOrders(spellListObj, spellOrders, spellId, index) {
    if (index === spellOrders.length) {
        spellListObj.db.query('select Count(id) from glspellpositive where spellid = $1', [spellId]).then(effectLength => {
            insertSpellEffects(spellListObj, spellId, 'positive', 0, +effectLength[0].count)
        })
    } else {
        let { db, orderList } = spellListObj
        db.query('select * from glspellorders where spellid = $1', [spellId]).then(currentOrderListForSpell => {
            let idArray = spellOrders.map(val => orderList.find(obj => obj.name === val).id)
            if (!currentOrderListForSpell.find(obj => obj.orderid === idArray[index])) {
                db.query('insert into glspellorders (spellid, orderid) values ($1, $2)', [spellId, idArray[index]]).then(_ => {
                    insertSpellOrders(spellListObj, spellOrders, spellId, ++index)
                })
            } else {
                insertSpellOrders(spellListObj, spellOrders, spellId, ++index)
            }
        })
    }
}

function insertSpellEffects(spellListObj, spellId, effectType, effectIndex, effectLength) {

    let spellEffect = effectType === 'positive' ? spellListObj.spell[6] : spellListObj.spell[7]

    if (effectLength > spellEffect.length) {
        spellListObj.db.query(`delete from glspell${effectType} where spellid = $1 and index > $2`, [spellId, spellEffect.length - 1]).then(_ => {
            insertSpellEffects(spellListObj, spellId, effectType, effectIndex, effectIndex)
        })
    } else if (effectLength <= effectIndex && effectIndex <= spellEffect.length - 1 && spellEffect[effectIndex] !== '') {
        spellListObj.db.query(`insert into glspell${effectType} (spellid, index, effect) values ($1, $2, $3)`, [spellId, effectIndex, spellEffect[effectIndex]]).then(_ => {
            insertSpellEffects(spellListObj, spellId, effectType, ++effectIndex, effectLength)
        })
    } else if (effectIndex <= spellEffect.length - 1 && spellEffect[effectIndex] !== '') {
        if (effectLength === 0) {
            insertSpellEffects(spellListObj, spellId, effectType, ++effectIndex, ++effectLength)
        } else {
            spellListObj.db.query(`update glspell${effectType} set effect = $3 where spellid = $1 and index = $2`, [spellId, effectIndex, spellEffect[effectIndex]]).then(_ => {
                insertSpellEffects(spellListObj, spellId, effectType, ++effectIndex, effectLength)
            })
        }
    } else {
        if (effectType === 'positive') {
            spellListObj.db.query('select Count(id) from glspellnegative where spellid = $1', [spellId]).then(negEffectLength => {
                insertSpellEffects(spellListObj, spellId, 'negative', 0, +negEffectLength[0].count)
            })
        } else {
            let { spellList, checkList, index, db, orderList } = spellListObj
            insertOrUpdateSpell(spellList, checkList, ++index, db, orderList)
        }
    }
}

async function updateQuickNav(endpoint) {
    const db = app.get('db')
        , chapterName = numWords(endpoint)

    let html = "";

    fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}-advanced/chapter-${chapterName}-advanced.component.html`, "utf-8", (err, data) => {
        // fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`, "utf-8", (err, data) => {
        if (err) { console.log(err) }
        html = data.replace(/ _ngcontent-c2=""/g, '');
        newhtml = html.split(/anchor"|anchor'|anchor /)
        let quickNav = ''

        for (i = 0; i <= newhtml.length - 1; i++) {
            //find the id
            if (newhtml[i].includes('id=')) {
                let id = newhtml[i].match(/id='(.*?)'|id="(.*?)"/gm)

                // sometimes the id doesn't have quotation marks so this is checking
                if (id && id[0]) {
                    id = id[0].substring(4)
                    id = id.substring(0, id.length - 1)
                } else {
                    id = newhtml[i].match(/id=(.*?) /gm)[0].substring(3).trim()
                }

                // strip final bits of HTML
                let section = newhtml[i].replace(/(\r\n|\n|\r)/gm, '').match(/<h.*?>(.*?)<\/h|<p.*?>(.*?)<\/p|<img.*?>/g)

                if (newhtml[i].indexOf('<h3>') !== -1) {
                    quickNav = quickNav + `{linkid: 'hg', body: '${section[0].replace(/<h.*?>|<\/h/g, '').toUpperCase()}', jump: '${id}'}, `
                } else if (newhtml[i].indexOf('<h1>') !== -1) {
                    quickNav = quickNav + `{linkid: 'h', body: '${section[0].replace(/<h.*?>|<\/h/g, '').toUpperCase()}', jump: '${id}'}, `
                }
            }
        }

        fs.writeFile(`../quicknav.txt`, quickNav, (err) => {
            if (err) console.log(err);
            console.log(`Successfully Created QuickNav for Chapter ${endpoint}.`);
        });
    });
}

function formatNewSections() {
    let formattedArray = []

    fs.readFile(`./formatter.txt`, "utf-8", (err, data) => {

        data.split('|').forEach(val => {
            let newId = makeid(10)
            if (val.substring(0, 1) === 's') {
                formattedArray.push(`<div class='anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <h3>${val.substring(1).toUpperCase()}</h3>
                    </div>`)
                //AND Base Drain & Base Range
            } else if (val.substring(0, 5) === 'Drain') {
                formattedArray.push(
                    `<div class='paragraphShell anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p><strong class='orangeHeader'>${val.substring(0, 5).toUpperCase()}</strong>${val.substring(5)}</p>
                    </div>`)
            } else if (val.substring(0, 9) === 'Tradition') {
                formattedArray.push(
                    `<div class='paragraphShell anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p><strong class='orangeHeader'>${val.substring(0, 9).toUpperCase()}</strong>${val.substring(9)}</p>
                    </div>`)
            } else if (val.substring(0, 10) === 'Base Drain') {
                formattedArray.push(
                    `<div class='paragraphShell anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p><strong class='orangeHeader'>${val.substring(0, 10).toUpperCase()}</strong>${val.substring(10)}</p>
                    </div>`)
            } else if (val.substring(0, 10) === 'Base Range') {
                formattedArray.push(
                    `<div class='paragraphShell anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p><strong class='orangeHeader'>${val.substring(0, 10).toUpperCase()}</strong>${val.substring(10)}</p>
                    </div>`)
            } else if (val.substring(0, 8) === 'Interval') {
                formattedArray.push(
                    `<div class='paragraphShell anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p><strong class='orangeHeader'>${val.substring(0, 8).toUpperCase()}</strong>${val.substring(8)}</p>
                    </div>`)
            } else if (val.substring(0, 6) === 'Effect') {
                formattedArray.push(
                    `<div class='paragraphShell anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p><strong class='orangeHeader'>${val.substring(0, 6).toUpperCase()}</strong>${val.substring(6)}</p>
                    </div>`)
            } else if (val.substring(0, 5) === 'Stack') {
                formattedArray.push(
                    `<div class='paragraphShell marginBottom anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p><strong class='orangeHeader'>${val.substring(0, 5).toUpperCase()}</strong>${val.substring(5)}</p>
                    </div>`)
            } else if (val.substring(0, 10) === 'Components') {
                formattedArray.push(
                    `<div class='paragraphShell anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p><strong class='orangeHeader'>${val.substring(0, 10).toUpperCase()}</strong>${val.substring(10)}</p>
                    </div>`)
            } else if (val.substring(0, 1) === 'p') {
                formattedArray.push(`<div class='paragraphShell anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p>${val.substring(1)}</p>
                    </div>`)
            } else if (val.substring(0, 1) === 'l') {
                formattedArray.push(`<div class='paragraphShell anchor marginBottom'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                        <p>${val.substring(1)}</p>
                    </div>`)
            } else if (val.substring(0, 1) === 'h') {
                formattedArray.push(`<div class="anchor">
                        <div id="${val.substring(1, 15).replace(/[\W_]+/g, "")}header" class="anchorTag"></div>
                        <h1>${val.substring(1).toUpperCase()}</h1>
                        <div class="underline"></div>
                    </div>`)
            } else if (val.substring(0, 1) === 'm') {
                formattedArray.push(`<div class="anchor marginBottom">
                        <div id="${val.substring(1, 15).replace(/[\W_]+/g, "")}" class="anchorTag"></div>
                        <h1>${val.substring(1).toProperCase(true)}</h1>
                    </div>`)
            } else if (val.substring(0, 1) === 'b') {
                formattedArray.push(`<strong class='orangeHeader'>${val.substring(1).toUpperCase()}</strong>`)
            } else if (val.substring(0, 1) === 'q') {
                pairedInfo = val.split(',')
                formattedArray.push(`<div class="chartShell pairedShell anchor">
                <div id="${newId}" class="anchorTag"></div>
                <h3>${pairedInfo[0].substring(1)}</h3>
                <h3> ${pairedInfo[1]}</h3>
            </div>`)
            } else {
                console.log('something when wrong: ', val)
            }

        })
        fs.writeFile(`../formated.html`, formattedArray.join(''), (err) => {
            // fs.writeFile(`./chapter-${chapterName}.component.html`, html, (err) => {
            if (err) console.log(err);
            console.log(`All Done.`);
        });
    })
}

function rollDice(diceString) {
    if (typeof (diceString) === 'number') {
        return +Math.floor(Math.random() * Math.floor(diceString)) + 1
    } else {
        diceExpressionArray = []
        let expressionValue = ""

        diceString.replace(/\s/g, '').split('').forEach((val, i, array) => {
            if (val === '-' || val === '+') {
                diceExpressionArray.push(expressionValue)
                if (i !== array.length - 1) {
                    diceExpressionArray.push(val)
                }
                expressionValue = ""
            }
            if (!isNaN(+val) || val === 'd' || val === "!") {
                expressionValue = expressionValue + val;
            }

            if (i === array.length - 1 && expressionValue !== '') {
                diceExpressionArray.push(expressionValue);
            }
        })

        for (let index = 0; index < diceExpressionArray.length; index++) {
            let val = diceExpressionArray[index];

            if (val.includes('d')) {
                let exploding = val.includes('!')

                val = val.split('d')
                let subtotal = 0
                for (let i = 0; i <= val[0]; i++) {
                    if (exploding) {
                        val[1] = val[1].substring(0, val[1].length - 1)

                        holdingTotal = rollDice(+val[1])
                        subtotal += rollDice(+val[1])
                    } else {
                        subtotal += rollDice(+val[1])
                    }
                }

                diceExpressionArray[index] = subtotal
            }
        }

        return eval(diceExpressionArray.join(""))
    }
}

function calculateAverageOfDice(diceString) {
    let totalValue = 0
    diceString
        .replace(/!| /g, '')
        .split('+')
        .forEach(val => {
            if (val.includes('d')) {
                val = val.split('d')
                val[0] = val[0] ? +val[0] : 1
                console.log(val)
                totalValue += round((val[0] + (+val[1] * val[0])) / 2)
            } else {
                totalValue += +val
            }
        })
    return totalValue
}

function formatPHB(i, html) {
    let chapterName = numWords(i)
        , endHtml = '    </div><script src="js/script.js"></script></body></html>'
        , route = `../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}-advanced/chapter-${chapterName}-advanced.component.html`;

    if (i === 0) {
        route = './UpdateSearch/htmlbase.html'
    } else if (i === 1 || i === 5 || i === 14) {
        route = `../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`
    }

    fs.readFile(route, "utf-8", (err, data) => {
        if (err) { console.log(err) }
        if (i > 0) {
            html = html + cleanUniqueHtml(data)
        } else {
            html = html + data
        }
        if (i === 15) {
            html = html + endHtml
            fs.writeFile(`./bonfirePHB.html`, html, (err) => {
                if (err) console.log(err);
                console.log(`Successfully Compiled PHB.`);
            });
        } else {
            console.log('compiling chapter ' + ++i)
            formatPHB(i, html)
        }
    })
}

function cleanUniqueHtml(data) {
    let html = data.replace(/ _ngcontent-c2=""/g, '').replace(/\n|\r|\t/g, '').replace(/\s\s+/g, ' ').split(/<div class=/)
        , cleanHtml = ''
        , trackingList = false
        , trackingSidebar = false
        , trackingFirstRow = false
        , oddRow = true
        , sideTitle = null
        , sideTitleRow = 0;

    for (i = html.length - 1; i >= 0; i--) {
        if (html[i].includes('chapterTitle')) {
            cleanHtml = cleanHtml + html[i].split('</div>')[1].replace(/\<h1 class="chapterTitle">(.*?)\<\/h1>/gs, '<h5>$1</h5>').trim();
            i = 0
        }
    }

    for (i = 0; i <= html.length - 1; i++) {
        if (html[i].includes('tableTitle')) {
            trackingFirstRow = true
            cleanHtml = cleanHtml + `<table style="width:${html[i].replace(/.*width: "(.*?)".*/g, '$1')};border-collapse: collapse;margin-bottom:10px"><tr><th colspan="PLACEHOLDER" style="background: #990000;text-align: left;color: whitesmoke;">` + html[i].replace(/.*<h1.*>(.*?)<\/h1>/g, '$1') + '</th></tr>'
        } else if (html[i].includes('headerTop')) {
            sideTitle = html[i].replace(/.*<h1 class="headerSide">(.*?)<\/h1>.*/g, '$1')
            cleanHtml = cleanHtml + '<tr><td colspan="PLACEHOLDER" style="background: #222;color: whitesmoke;text-align: center;">' + html[i].replace(/.*<h1 class="headerTop">(.*?)<\/h1>.*/g, '$1') + '</td></tr>'
        } else if (html[i].includes('tableValue')) {
            let tableRow = '<tr style="text-align: center;">'
                , row = html[i].split('</p>');

            if (html[i].includes('kitBottomLine')) {
                bottomLine = html[i].match(/kitBottomItem'>(.*?)<\/p>/gs)
                cleanHtml = cleanHtml + '<tr style="background: #222;color: whitesmoke;text-align: center;">'
                bottomLine.forEach((val, i) => {
                    if (i === 0) {
                        cleanHtml = cleanHtml + '<td colspan="2">' + val.replace(/kitBottomItem'>(.*?)<\/p>/g, '$1') + '</td>'
                    } else {
                        cleanHtml = cleanHtml + '<td>' + val.replace(/kitBottomItem'>(.*?)<\/p>/g, '$1') + '</td>'
                    }
                })
                cleanHtml = cleanHtml + '</tr>'
            } else if (html[i].includes('SkillDescriptionTitle')) {
                cleanHtml = cleanHtml + `<table style="border-collapse: collapse;margin-bottom:10px;width:325px">`
            } else if (trackingFirstRow && sideTitle) {
                cleanHtml = cleanHtml + `<tr style="background: #222;color: whitesmoke;text-align: center;"><th rowspan="PLACEHOLDER">${sideTitle}</th></tr>`
                cleanHtml = cleanHtml.replace(/colspan="PLACEHOLDER"/gs, `colspan="${row.length}"`)
                tableRow = '<tr style="background: #5c5c5c;color: whitesmoke;text-align: center;">'
                trackingFirstRow = false
                oddRow = false
            } else if (trackingFirstRow) {
                cleanHtml = cleanHtml.replace(/colspan="PLACEHOLDER"/gs, `colspan="${row.length - 1}"`)
                tableRow = '<tr style="background: #222;color: whitesmoke;text-align: center;">'
                trackingFirstRow = false
                oddRow = false
            } else {
                if (oddRow) {
                    tableRow = '<tr style="text-align: center;background: #ababab;">'
                }
                oddRow = !oddRow
            }

            if (html[i].includes('Athletics') || html[i].includes('Lore') || html[i].includes('Streetwise') || html[i].includes('Survival') || html[i].includes('Tactics') || html[i].includes('Trades')) {
                row.forEach((val, i, array) => {
                    if (i !== array.length - 1) {
                        sideTitleRow += sideTitleRow
                        tableRow = tableRow + '<td style="background: #222;text-align: left;color: whitesmoke;text-align: center;">' + val.replace(/.*TableIndividual.*>(.*?)/g, '$1') + '</td>'
                    } else {
                        tableRow = tableRow + '</tr>'
                    }
                })
            } else if (html[i].includes('Swords') || html[i].includes('Sidearms') || html[i].includes('Axes') || html[i].includes('Trauma') || html[i].includes('Polearms') && !html[i].includes('>15</p>')) {
                tableRow = tableRow + '<td colspan="8" style="background: rgb(100, 100, 100);text-align: left;color: whitesmoke;text-align: center;">' + html[i].replace(/.*TableIndividual.*>(.*?)<\/p>.*/g, '$1') + '</td></tr>'
            } else if (html[i].includes('Thrown</p>') || html[i].includes('Firearms') || html[i].includes('Mechanical')) {
                tableRow = tableRow + '<td colspan="7" style="background: rgb(100, 100, 100);text-align: left;color: whitesmoke;text-align: center;">' + html[i].replace(/.*TableIndividual.*>(.*?)<\/p>.*/g, '$1') + '</td></tr>'
            } else if (!html[i].includes('kitBottomLine')) {
                row.forEach((val, i, array) => {
                    if (i !== array.length - 1) {
                        sideTitleRow += sideTitleRow
                        if (val.includes('Skill Name') || val.includes('Base Cost') || val.includes('Stats')) {
                            tableRow = tableRow + '<td style="background: #990000;text-align: left;color: whitesmoke;text-align: center;">' + val.replace(/.*TableIndividual.*>(.*?)/g, '$1') + '</td>'
                        } else {
                            tableRow = tableRow + '<td>' + val.replace(/.*TableIndividual'>(.*?)/g, '$1') + '</td>'
                        }
                    } else {
                        tableRow = tableRow + '</tr>'
                    }
                })
            }
            if (html[i].includes("Rank 1")) {
                tableRow = '<table style="border-collapse: collapse;margin-bottom:10px">' + tableRow
            }
            if (html[i].includes('</div> </div> </div> </div> </div>')) {
                cleanHtml = cleanHtml.replace(/rowspan="PLACEHOLDER"/gs, `rowspan="${sideTitleRow}"`)
                tableRow = tableRow + '</table>'
                sideTitle = null
                if (html[i].includes('</div> </div> </div> </div> </div> </div>') && trackingSidebar) {
                    tableRow = tableRow + '</table>'
                }
            }
            cleanHtml = cleanHtml + tableRow
        } else if (html[i].includes('h1') && !html[i].includes('{{trait | titlecase}}')) {
            index = html[i].match(/(\<h1>).*?(\<\/h1>)/gs);
            if (index) {
                cleanHtml = cleanHtml + index[0];
                if (html[i].match(/🜂 Advanced Rule/g)) {
                    cleanHtml = cleanHtml + '<p>🜂 Advanced Rule</p>'
                }
            }
        } else if (html[i].includes('h1') && html[i].includes('{{trait | titlecase}}')) {
            trackingSidebar = false;
            sideTitle = null
            cleanHtml = cleanHtml + '<p>You can find it in Chapter 9 on the Bonfire SRD</p></td></tr></table>'
        } else if (html[i].includes('h3')) {
            cleanHtml = cleanHtml + html[i].match(/(\<h3.*>).*?(\<\/h3>)/gs)[0];
        } else if (html[i].includes('🜂')) {
            if (!trackingList) {
                trackingList = true
                cleanHtml = cleanHtml + '<ul>' + html[i].match(/(\<p>).*?(\<\/p>)/gs)[0].trim().replace(/p>/gs, 'li>');
            } else if (trackingList && html[i + 1].includes('🜂')) {
                cleanHtml = cleanHtml + html[i].match(/(\<p>).*?(\<\/p>)/gs)[0].trim().replace(/p>/gs, 'li>');
            } else {
                trackingList = false
                cleanHtml = cleanHtml + html[i].match(/(\<p>).*?(\<\/p>)/gs)[0].trim().replace(/p>/gs, 'li>') + '</ul>';
                if (html[i].includes('</div> </div> </div>') && trackingSidebar) {
                    trackingSidebar = false;
                    sideTitle = null
                    cleanHtml = cleanHtml + '</td></tr></table>'
                }
            }
        } else if (html[i].includes('<p>')) {
            if (html[i].includes('marginBottom')) {
                cleanHtml = cleanHtml + html[i].match(/(\<p>).*?(\<\/p>)/gs)[0].replace(/<p>/gs, '<p style="margin:0px 0px 10px;">').trim();
            } else {
                cleanHtml = cleanHtml + html[i].match(/<p>.*?<\/p>/gs)[0].replace(/<p>/gs, '<p style="margin:0px;">').trim();
            }
            if (html[i].includes('</div> </div>') && trackingSidebar) {
                trackingSidebar = false;
                sideTitle = null
                cleanHtml = cleanHtml + '</td></tr></table>'
            }
        } else if (html[i].includes('chartShell')) {
            let chart = html[i].split('<div>')
            if (html[i + 1].includes('chartShell')) {
                if (chart[2] && !chart[2].includes('Servant') && !chart[2].includes('Socialite')) {
                    cleanHtml = cleanHtml + `<p style="margin:0px;"><strong>${chart[1].split('</')[0]}: ${chart[2].split('</')[0]}</strong></p>`
                } else if (chart[2]) {
                    cleanHtml = cleanHtml + `<p style="margin:0px;"><strong>${chart[1].split('</')[0]}<p style="margin:0px;"><strong>${chart[2].split('</')[0]}</strong></p>`
                } else {
                    cleanHtml = cleanHtml + `<p style="margin:0px;"><strong>${chart[1].split('</')[0]}</strong></p>`
                }
            } else {
                if (chart[2]) {
                    cleanHtml = cleanHtml + `<p style="margin:0px 0px 10px;"><strong>${chart[1].split('</')[0]}: ${chart[2].split('</')[0]}</strong></p>`
                } else {
                    cleanHtml = cleanHtml + `<p style="margin:0px 0px 10px;"><strong>${chart[1].split('</')[0]}</strong></p>`
                }
            }
            if (html[i].includes('</div> </div> </div>') && trackingSidebar) {
                trackingSidebar = false;
                sideTitle = null
                cleanHtml = cleanHtml + '</td></tr></table>'
            }
        } else if (html[i].includes('<h2')) {
            trackingSidebar = true;
            cleanHtml = cleanHtml + '<table style="border: 3px solid #b45f06;padding: 10px;margin:0px 0px 5px"><tr><th>'
            cleanHtml = cleanHtml + html[i].match(/(\<h2).*?(\<\/h2>)/gs)[0].trim();
            cleanHtml = cleanHtml + '</th></tr><tr><td>'
        } else if (html[i].includes('sidebarShell')) {
            trackingSidebar = true;
            cleanHtml = cleanHtml + '<table style="border: 3px solid #b45f06;padding: 10px;margin:0px 0px 5px"><tr><th></th></tr><tr><td>'
        } else if (html[i].includes('img')) {
            cleanHtml = cleanHtml + html[i].match(/<img(.*?)>/gs)[0].replace(/<img(.*?)>/gs, '<h1>$1</h1>');
        } else {
            // console.log(html[i])
        }
        cleanHtml = cleanHtml.replace(/<a routerLink='.*'>(.*?)<\/a>/g, '<strong>$1</strong>')
    }
    return cleanHtml
}


massive(connection).then(dbI => {
    app.set('db', dbI)
    app.listen(4343, _ => {
        updateSearch(1)
        // updateQuickNav(9)
        // formatNewSections()
        // console.log(calculateAverageOfDice("1 + 4d20!+ 3!"))
        // formatPHB(0, '')
        console.log(`The night lays like a lullaby on the earth 4343`)
    })
})