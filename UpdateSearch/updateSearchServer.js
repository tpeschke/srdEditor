const { connection } = require('./servStuff')
    , express = require('express')
    , bodyParser = require('body-parser')
    , cors = require('cors')
    , massive = require('massive')
    , fs = require('fs')
    , numWords = require('num-words')
    , _ = require('lodash');
const { round, add, split } = require('lodash')
    , { tables, multipliers } = require('./table.js')
    , beastVitalityList = require('../object')
    , string = require('../string.js');

const app = new express()
app.use(bodyParser.json())
app.use(cors())

String.prototype.toProperCase = function () {
    return this.toLowerCase()
        .replace(/(^|[\s\xA0])[^\s\xA0]/g, function (s) { return s.toUpperCase(); });
};

String.prototype.toFirstCased = function () {
    const words = this.toLowerCase().split(" ");
    for (let i = 0; i < words.length; i++) {
        if (words[i]) {
            if (words[i][0] === '(') {
                words[i] = words[i][0] + words[i][1].toUpperCase() + words[i].substr(2);
            } else {
                words[i] = words[i][0].toUpperCase() + words[i].substr(1);
            }
        }
    }
    return words.join(' ')
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function titleCase(str) {
    str = str.toLowerCase();
    str = str.split(' ');

    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }

    // Step 4. Return the output
    return str.join(' '); // ["I'm", "A", "Little", "Tea", "Pot"].join(' ') => "I'm A Little Tea Pot"
}

async function updateSearch(endpoint) {
    let sectionAndChapter = endpoint.split('.')

    if (+sectionAndChapter[1] === 1 && +sectionAndChapter[0] === 1) {
        console.log('cleaning db')
        const db = app.get('db')
        await db.cleanUpDB()
    }

    if (+sectionAndChapter[0] === 1) {
        updateRulesReferenceSearch(+sectionAndChapter[1])
    } else {
        updateCharacterCreationSearch(+sectionAndChapter[1])
    }
}

function updateRulesReferenceSearch(endpoint) {
    const db = app.get('db')
    let chapterName = numWords(endpoint)

    if (endpoint === 3 || endpoint === 5 || endpoint === 7) {
        fs.readFile(`../bonfireSRD/src/app/rules-reference/chapter-${chapterName}/rr-${chapterName}-deluxe/rr-${chapterName}-deluxe.component.html`, "utf-8", (adverr, advData) => {
            fs.readFile(`../bonfireSRD/src/app/rules-reference/chapter-${chapterName}/rr-${chapterName}/rr-${chapterName}.component.html`, "utf-8", (err, data) => {
                if (err) console.log(err);
                let advDataObject = cleanHTML(advData, endpoint)
                    , basicDataObject = cleanHTML(data, endpoint)
                    , promiseArray = []


                for (key in basicDataObject) {
                    promiseArray.push(db.basic(key, basicDataObject[key], endpoint, 1).then())
                }
                for (key in advDataObject) {
                    promiseArray.push(db.advanced(key, advDataObject[key], endpoint, 1).then())
                }

                Promise.all(promiseArray).then(_ => {
                    console.log(`Successfully Updated Rules-Reference Chapter ${endpoint}'s Search`);
                    if (endpoint !== 7) {
                        updateSearch('1.' + (endpoint + 1))
                    } else {
                        console.log('Rules Reference All Done')
                        updateSearch('2.1')
                    }
                })
            })
        })
    } else {
        fs.readFile(`../bonfireSRD/src/app/rules-reference/chapter-${chapterName}/rr-${chapterName}/rr-${chapterName}.component.html`, "utf-8", (err, data) => {
            if (err) console.log(err);
            let basicDataObject = cleanHTML(data, endpoint)
                , promiseArray = []

            for (key in basicDataObject) {
                promiseArray.push(db.basic(key, basicDataObject[key], endpoint, 1).then())
            }

            Promise.all(promiseArray).then(_ => {
                console.log(`Successfully Updated Rules-Reference Chapter ${endpoint}'s Search`);
                if (endpoint !== 7) {
                    updateSearch('1.' + (endpoint + 1))
                } else {
                    console.log('Rules Reference All Done')
                    updateSearch('2.1')
                }
            })
        })

    }
}

function updateCharacterCreationSearch(endpoint) {
    const db = app.get('db')
    let chapterName = numWords(endpoint)

    if (endpoint === 2 || endpoint === 3) {
        fs.readFile(`../bonfireSRD/src/app/character-creation/chapter-${chapterName}/cc-${chapterName}-deluxe/cc-${chapterName}-deluxe.component.html`, "utf-8", (err, advData) => {
            fs.readFile(`../bonfireSRD/src/app/character-creation/chapter-${chapterName}/cc-${chapterName}/cc-${chapterName}.component.html`, "utf-8", (err, data) => {
                if (err) console.log(err);
                let advDataObject = cleanHTML(advData, endpoint)
                    , basicDataObject = cleanHTML(data, endpoint)
                    , promiseArray = []

                for (key in basicDataObject) {
                    promiseArray.push(db.basic(key, basicDataObject[key], endpoint, 2).then())
                }
                for (key in advDataObject) {
                    promiseArray.push(db.advanced(key, advDataObject[key], endpoint, 2).then())
                }

                Promise.all(promiseArray).then(_ => {
                    console.log(`Successfully Updated Character Creation Chapter ${endpoint}'s Search`);
                    if (endpoint !== 7) {
                        updateSearch('2.' + (endpoint + 1))
                    } else {
                        console.log('Character Creation All Done')
                    }
                })
            })
        })
    } else {
        fs.readFile(`../bonfireSRD/src/app/character-creation/chapter-${chapterName}/cc-${chapterName}/cc-${chapterName}.component.html`, "utf-8", (err, data) => {
            if (err) console.log(err);
            let basicDataObject = cleanHTML(data, endpoint)
                , promiseArray = []

            for (key in basicDataObject) {
                promiseArray.push(db.basic(key, basicDataObject[key], endpoint, 2).then())
            }

            Promise.all(promiseArray).then(_ => {
                console.log(`Successfully Updated Character Creation Chapter ${endpoint}'s Search`);
                if (endpoint !== 7) {
                    updateSearch('2.' + (endpoint + 1))
                } else {
                    console.log('Character Creation All Done')
                }
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
                section = section[0].replace(/<strong.*?>|<\/strong>|<a.*?>|<\/a>/g, '').replace(/class='orangeHeader'/g, ' style="color:#B45F06;"')
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

function updateQuickNav(endpoint) {
    let sectionAndChapter = endpoint.split('.')
    if (+sectionAndChapter[0] === 1) {
        updateQuickNavForRulesReference(+sectionAndChapter[1])
    } else {
        updateQuickNavForCharacterCreation(+sectionAndChapter[1])
    }
}

async function updateQuickNavForRulesReference(endpoint) {
    const db = app.get('db')
        , chapterName = numWords(endpoint)

    let html = "";

    fs.readFile(`../bonfireSRD/src/app/rules-reference/chapter-${chapterName}/rr-${chapterName}/rr-${chapterName}.component.html`, "utf-8", (err, data) => {
        // fs.readFile(`../bonfireSRD/src/app/chapters/rr-${chapterName}/rr-${chapterName}.component.html`, "utf-8", (err, data) => {
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


                if (newhtml[i].indexOf('<h2>') !== -1) {
                    quickNav = quickNav + `, {linkid: 'hg', body: '${section[0].replace(/<h.*?>|<\/h/g, '')}', jump: '${id}'}`
                } else if (newhtml[i].indexOf('<h1>') !== -1) {
                    quickNav = quickNav + `, {linkid: 'h', body: '${section[0].replace(/<h.*?>|<\/h/g, '')}', jump: '${id}'}`
                }
            }
        }

        fs.writeFile(`./quicknav-${chapterName}.txt`, quickNav, (err) => {
            if (err) console.log(err);
            console.log(`Successfully Created QuickNav for Chapter ${endpoint}.`);
        });
    });
}

async function updateQuickNavForCharacterCreation(endpoint) {
    const db = app.get('db')
        , chapterName = numWords(endpoint)

    let html = "";

    fs.readFile(`../bonfireSRD/src/app/character-creation/chapter-${chapterName}/cc-${chapterName}/cc-${chapterName}.component.html`, "utf-8", (err, data) => {
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


                if (newhtml[i].indexOf('<h2>') !== -1) {
                    quickNav = quickNav + `${quickNav === "" ? "" : ', '}{linkid: 'hg', body: '${section[0].replace(/<h.*?>|<\/h/g, '')}', jump: '${id}'}`
                } else if (newhtml[i].indexOf('<h1>') !== -1) {
                    quickNav = quickNav + `${quickNav === "" ? "" : ', '}{linkid: 'h', body: '${section[0].replace(/<h.*?>|<\/h/g, '')}', jump: '${id}'}`
                }
            }
        }

        fs.writeFile(`./quicknav-${chapterName}.txt`, quickNav, (err) => {
            if (err) console.log(err);
            console.log(`Successfully Created QuickNav for Chapter ${endpoint}.`);
        });
    });
}

function formatNewSections() {
    let formattedArray = []
        , sidebar = false
        , numberedList = false
        , disclist = false

    fs.readFile(`./formatter.txt`, "utf-8", (err, data) => {

        data.split('|').forEach(val => {
            let newId = makeid(10)

            if (val.substring(0, 1) === '1') {
                formattedArray.push(`<div class="anchor">
                    <div id="${val.substring(1, 15).replace(/[\W_]+/g, "")}header" class="anchorTag"></div>
                    <h1>${val.substring(1).toProperCase()}</h1>
                    <div class="underline"></div>
                </div>`)
            } else if (val.substring(0, 1) === '2') {
                formattedArray.push(`<div class="anchor">
                    <div id="${val.substring(1, 15).replace(/[\W_]+/g, "")}header${newId}" class="anchorTag"></div>
                    <h2>${val.substring(1).toProperCase()}</h2>
                    <div class="underline-sub"></div>
                </div>`)
            } else if (val.substring(0, 1) === '3') {
                formattedArray.push(`<div class="anchor">
                    <div id="${val.substring(1, 15).replace(/[\W_]+/g, "")}header${newId}" class="anchorTag"></div>
                    <h3>${val.substring(1).toProperCase()}</h3>
                </div>`)
            } else if (val.substring(0, 1) === '4') {
                formattedArray.push(`<div class="anchor">
                    <div id="${val.substring(1, 15).replace(/[\W_]+/g, "")}header" class="anchorTag"></div>
                    <h4>${val.substring(1).toProperCase()}</h4>
                </div>`)
            } else if (val.substring(0, 1) === '5') {
                formattedArray.push(`<div class="anchor">
                    <div id="${val.substring(1, 15).replace(/[\W_]+/g, "")}header" class="anchorTag"></div>
                    <h5>${val.substring(1).toProperCase()}</h5>
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
            } else if (val.substring(0, 1) === 'i') {
                formattedArray.push(`<div class='paragraphShell anchor'>
                            <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                            <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                            <p class="italic">${val.substring(1)}</p>
                        </div>`)
            } else if (val.substring(0, 1) === 'f') {
                formattedArray.push(`<div class='paragraphShell anchor marginBottom'>
                            <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
                            <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
                            <p class="italic">${val.substring(1)}</p>
                        </div>`)
            } else if (val.substring(0, 1) === 'b') {
                formattedArray.push(`<strong>${val.substring(1)}</strong>`)
            } else if (val.substring(0, 1) === '*') {
                formattedArray.push(`<strong class='optional'>*</strong>`)
            } else if (val.substring(0, 1) === 'x') {
                if (sidebar) {
                    formattedArray.push(`</div>`)
                    sidebar = false;
                } else {
                    formattedArray.push(`<div class='sidebarShell marginBottom'>`)
                    sidebar = true;
                }
            } else if (val.substring(0, 1) === 'n') {
                if (numberedList) {
                    formattedArray.push(`</ol>`)
                    numberedList = false;
                } else {
                    formattedArray.push(`<ol class='marginBottom'>`)
                    numberedList = true;
                }
            } else if (val.substring(0, 1) === 'u') {
                if (disclist) {
                    formattedArray.push(`</ul>`)
                    disclist = false;
                } else {
                    formattedArray.push(`<ul class='marginBottom'>`)
                    disclist = true;
                }
            } else if (val.substring(0, 1) === 'o') {
                formattedArray.push(`<li>${val.substring(1)}</li>`)
            } else {
                if (val !== '') {
                    console.log('something when wrong: ', val)
                }
            }
            //AND Base Drain & Base Range
            // if (val.substring(0, 5).toLowerCase() === 'drain') {
            //     formattedArray.push(
            //         `<div class='paragraphShell anchor'>
            //             <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //             <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //             <p><strong class='orangeHeader'>${titleCase(val.substring(0, 5))}</strong>${val.substring(5)}</p>
            //         </div>`)
            // } else if (val.substring(0, 9).toLowerCase() === 'tradition') {
            //     formattedArray.push(
            //         `<div class='paragraphShell anchor'>
            //             <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //             <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //             <p><strong class='orangeHeader'>${titleCase(val.substring(0, 9))}</strong>${val.substring(9)}</p>
            //         </div>`)
            // } else if (val.substring(0, 10).toLowerCase() === 'base drain') {
            //     formattedArray.push(
            //         `<div class='paragraphShell anchor'>
            //             <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //             <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //             <p><strong class='orangeHeader'>${titleCase(val.substring(0, 10))}</strong>${val.substring(10)}</p>
            //         </div>`)
            // } else if (val.substring(0, 10).toLowerCase() === 'base range') {
            //     formattedArray.push(
            //         `<div class='paragraphShell anchor'>
            //             <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //             <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //             <p><strong class='orangeHeader'>${titleCase(val.substring(0, 10))}</strong>${val.substring(10)}</p>
            //         </div>`)
            // } else if (val.substring(0, 8).toLowerCase() === 'interval') {
            //     formattedArray.push(
            //         `<div class='paragraphShell anchor'>
            //             <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //             <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //             <p><strong class='orangeHeader'>${titleCase(val.substring(0, 8))}</strong>${val.substring(8)}</p>
            //         </div>`)
            // } else if (val.substring(0, 6).toLowerCase() === 'effect') {
            //     formattedArray.push(
            //         `<div class='paragraphShell anchor'>
            //             <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //             <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //             <p><strong class='orangeHeader'>${titleCase(val.substring(0, 6))}</strong>${val.substring(6)}</p>
            //         </div>`)
            // } else if (val.substring(0, 5).toLowerCase() === 'stack') {
            //     formattedArray.push(
            //         `<div class='paragraphShell marginBottom anchor'>
            //             <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //             <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //             <p><strong class='orangeHeader'>${titleCase(val.substring(0, 5))}</strong>${val.substring(5)}</p>
            //         </div>`)
            // } else if (val.substring(0, 10).toLowerCase() === 'components') {
            //     formattedArray.push(
            //         `<div class='paragraphShell anchor'>
            //             <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //             <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //             <p><strong class='orangeHeader'>${titleCase(val.substring(0, 10))}</strong>${val.substring(10)}</p>
            //         </div>`)
            // } else if (val.substring(0, 1) === 'p') {
            //     formattedArray.push(`<div class='paragraphShell anchor'>
            //                     <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //                     <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //                     <p>${val.substring(1)}</p>
            //                 </div>`)
            // } else if (val.substring(0, 1) === 'l') {
            //     formattedArray.push(`<div class='paragraphShell anchor marginBottom'>
            //                     <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}' class='anchorTag'></div>
            //                     <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}${newId}'"></app-bm-chapter-icon>
            //                     <p>${val.substring(1)}</p>
            //                 </div>`)
            // } else {
            //     if (val !== '') {
            //         console.log('something when wrong: ', val)
            //     }
            // }
        })
        fs.writeFile(`./formated.html`, formattedArray.join(''), (err) => {
            // fs.writeFile(`./chapter-${chapterName}.component.html`, html, (err) => {
            if (err) console.log(err);
            console.log(`All Done.`);
        });
    })
}

function rollDice(diceString) {
    if (typeof (diceString) === 'number') {
        return +Math.floor(Math.random() * Math.floor(diceString)) + 1
    } else if (!diceString) {
        return 0
    } else {
        diceExpressionArray = []
        let expressionValue = ""

        diceString.replace(/\s/g, '').split('').forEach((val, i, array) => {
            if (val === '-' || val === '+' || val === '*') {
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

function formatPHB(i, html, type) {
    let endHtml = '    </div><script src="js/script.js"></script></body></html>'
        , route = getRoute(i, type);

    fs.readFile(route, "utf-8", async (err, data) => {
        if (err) { console.log(err) }

        html = html + data

        if (i === 0) {
            html = html + await addScriptsAndBody(type === 'cc' ? 'CharacterCreationHandbook' : 'RulesReference')
        }
        if (i === 7) {
            html = html + endHtml
            html = html.replace(/h3/gs, 'h4')
                .replace(/h2/gs, 'h3')
                .replace(/h1/gs, 'h2')
                .replace(/h5/gs, 'h1')
                .replace(/Chapter \d+.(.*?) /gs, 'Chapter $1')
            fs.writeFile(`./${type === 'cc' ? 'CharacterCreationHandbook' : 'RulesReference'}.html`, html, (err) => {
                if (err) console.log(err);
                console.log(`Successfully Compiled ${type === 'cc' ? 'CharacterCreationHandbook' : 'RulesReference'}.`);

                if (type === 'rr') {
                    formatPHB(0, '', 'cc')
                }
            });
        } else {
            console.log('compiling chapter ' + ++i)
            formatPHB(i, html, type)
        }
    })
}

function getRoute(i, type) {
    let chapterName = numWords(i)
    let typeFull = type === 'cc' ? 'character-creation' : 'rules-reference'
    let route = `../bonfireSRD/src/app/${typeFull}/chapter-${chapterName}/${type}-${chapterName}/${type}-${chapterName}.component.html`

    if (type === 'rr') {
        if (i === 3 || i === 5 || i === 7) {
            route = `../bonfireSRD/src/app/${typeFull}/chapter-${chapterName}/${type}-${chapterName}-deluxe/${type}-${chapterName}-deluxe.component.html`
        }
    } else if (type === 'cc') {
        if (i === 2 || i === 3) {
            route = `../bonfireSRD/src/app/${typeFull}/chapter-${chapterName}/${type}-${chapterName}-deluxe/${type}-${chapterName}-deluxe.component.html`
        }
    }
    
    return route
}

function addScriptsAndBody(fileName) {
    return new Promise(resolve => {
        let body = `<script>fileName='${fileName}'</script><script src="processHtml.js"></script></head><body><button style="position: sticky;top: 0;width: 100%;height: 50px;background: green;color: white;"onclick="exportToObject('chapterShell');">Process HTML</button><div id="exportContent"></div><div id="oldContent">`
        let scripts = ''
        let kitRoute = '../bonfireSRD/src/app/character-creation/chapter-one/cc-one/kit.js'
        let equipmentRoute = '../bonfireSRD/src/app/character-creation/chapter-six/tables.js'

        fs.readFile(kitRoute, "utf-8", (err, kits) => {
            if (err) { console.log(err) }
            // scripts = scripts + `<script>kits=${kits.split('export default ')[1]}</script>`

            fs.readFile(equipmentRoute, "utf-8", (err, equipment) => {
                if (err) { console.log(err) }
                scripts = scripts + `<script>equipmentTables=${equipment.split('export default ')[1]}</script>`

                resolve(scripts + body)
            })
        })
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

    equipment = null
    for (i = 0; i <= html.length - 1; i++) {
        if (html[i].includes('tableTitle')) {
            trackingFirstRow = true
            if (html[i].includes('width: ')) {
                cleanHtml = cleanHtml + `<table style="width:${html[i].replace(/.*width: "(.*?)".*/g, '$1')};border-collapse: collapse;margin-bottom:10px"><tr><th colspan="PLACEHOLDER" style="background: #990000;text-align: left;color: whitesmoke;">` + html[i].replace(/.*<h1.*>(.*?)<\/h1>/g, '$1') + '</th></tr>'
            } else {
                cleanHtml = cleanHtml + `<table style="border-collapse: collapse;margin-bottom:10px"><tr><th colspan="PLACEHOLDER" style="background: #990000;text-align: left;color: whitesmoke;">` + html[i].replace(/.*<h1.*>(.*?)<\/h1>/g, '$1') + '</th></tr>'
            }
        } else if (html[i].includes('headerTop')) {
            sideTitle = html[i].replace(/.*<h1 class="headerSide">(.*?)<\/h1>.*/g, '$1')
            cleanHtml = cleanHtml + '<tr><td colspan="PLACEHOLDER" style="background: #222;color: whitesmoke;text-align: center;">' + html[i].replace(/.*<h1 class="headerTop">(.*?)<\/h1>.*/g, '$1') + '</td></tr>'
        } else if (html[i].includes('tableValue')) {
            let tableRow = '<tr style="text-align: center;">'
                , row = html[i].split('</p>');

            if (html[i].includes('*ngFor="let content of ')) {
                equipment = html[i].match(/tables.(.*?)">/g, '$1')[0].replace(/tables./g, "").replace(/">/g, "")
            }

            if (html[i].includes('kitBottomLine')) {
                bottomLine = html[i].match(/kitBottomItem'>(.*?)<\/p>/gs)
                cleanHtml = cleanHtml + '<tr style="background: #222;color: whitesmoke;text-align: center;margin:0px 0px 10px">'
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
            if (equipment) {
                tableRow = getEquipmentRows(equipment)
                equipment = null
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
                cleanHtml = cleanHtml + html[i].match(/(\<p>).*?(\<\/p>)/gs)[0].replace(/<p>/gs, '<p style="margin:0px 0px 10px;">').trim().replace(/class='orangeHeader'/gi, 'style="color:#B45F06;"');
            } else {
                cleanHtml = cleanHtml + html[i].match(/<p>.*?<\/p>/gs)[0].replace(/<p>/gs, '<p style="margin:0px;">').trim().replace(/class='orangeHeader'/gi, 'style="color:#B45F06;"');
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

function getEquipmentRows(table) {
    rows = ""
    tables[table].forEach((item, i) => {
        //<tr style="text-align: center;background: #ababab;">
        if (i % 2 === 0) {
            rows += '<tr style="text-align: center;">'
        } else {
            rows += '<tr style="text-align: center;background: #ababab;">'
        }

        rows += `<td>${item.name}</td>
        <td>${item.size}</td>
        <td>${item.price}</td>
        <td>${(item.price * (item.size ? multipliers.local[item.size] : multipliers.local.M)).toFixed(1)}</td>
        <td>${(item.price * (item.size ? multipliers.nearby[item.size] : multipliers.nearby.M)).toFixed(1)}</td>
        <td>${(item.price * (item.size ? multipliers.distant[item.size] : multipliers.distant.M)).toFixed(1)}</td>
        </tr>`
    })

    return rows + "</table"
}

function objectFromTable() {
    tableString = ''
    fs.readFile(`../bonfireSRD/src/app/chapters/chapter-eleven/chapter-eleven-advanced/chapter-eleven-advanced.component.html`, "utf-8", (adverr, advData) => {
        // advData = advData.replace(/ _ngcontent-c2=""/g, '').replace(/\n||\t||\r/g, '');
        advData.split('tableOverflowWindow').forEach(table => {
            if (table.includes('Local Market') && table.includes("<h1 class='tableTitle'>") && !table.includes("Kit")) {
                tableString += `'${table.match(/<h1 class='tableTitle'>(.*?)<\/h1>/)[1]}': [`
            }
            table.split("<div class='tableValue'>").forEach((content, index) => {
                if (index > 1) {
                    // console.log(content.match(/<p class='equipmentvalue TableIndividual'>(.*?)<\/p>/g))
                    if (content.match(/<p class='equipmentvalue TableIndividual'>(.*?)<\/p>/g)) {
                        tableString += `{ name: '${content.match(/<p class='equipmentvalue TableIndividual'>(.*?)<\/p>/g)[0].match(/<p class='equipmentvalue TableIndividual'>(.*?)<\/p>/)[1]}', size: '${content.match(/<p class='equipmentvalue TableIndividual'>(.*?)<\/p>/g)[1].match(/<p class='equipmentvalue TableIndividual'>(.*?)<\/p>/)[1]}', price: ${content.match(/<p class='equipmentvalue TableIndividual'>(.*?)<\/p>/g)[2].match(/<p class='equipmentvalue TableIndividual'>(.*?)<\/p>/)[1]} },`
                    }
                }
            })
            tableString += "],"
        })
        fs.writeFile(`./object.js`, tableString, (err) => {
            if (err) console.log(err);
            console.log(`All Done.`);
        });
    })
}

function beastVitalityUpgradeScript() {
    let upgradeScript = ""

    beastVitalityList.forEach(beastToUpdate => {
        let transformedVitality = transformVitality(beastToUpdate.vitality);
        upgradeScript += `update bbindividualbeast set vitality = '${transformedVitality}' where id = ${beastToUpdate.beastId};\n`
        fs.writeFile(`./sql.sql`, upgradeScript, (err) => {
            if (err) console.log(err);
            console.log(`All Done.`);
        });
    })
}

function tagsToUppercase(tags, string) {
    for (tag in tags) {
        let regex = new RegExp("(<" + tags[tag] + ">)([^<]+)(<\/" + tags[tag] + ">)", "g");
        string = string.replace(regex, function (match, g1, g2, g3) {
            return g1 + g2.toFirstCased() + g3;
        });
    }
    return string
}

function correctString() {
    let correctedHTML = tagsToUppercase(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong'], string)
    fs.writeFile(`./string.html`, correctedHTML, (err) => {
        if (err) console.log(err);
        console.log(`Done`);
    });
}

function getProbability(roundedValue, skillRank) {
    let dTwenty = 20
        , tieGoesTo = 1

    if (roundedValue > (dTwenty + skillRank)) {
        return 0
    } else {
        if (roundedValue > skillRank) {
            return 1 - ((((roundedValue - skillRank) * dTwenty) + (dTwenty * (dTwenty - tieGoesTo) / 2) - (roundedValue - skillRank - tieGoesTo) * (roundedValue - skillRank) / 2) / (dTwenty * dTwenty))
        } else {
            return (((skillRank - roundedValue) * dTwenty) + (dTwenty * (dTwenty + tieGoesTo) / 2) - (skillRank - roundedValue + tieGoesTo) * (skillRank - roundedValue) / 2) / (dTwenty * dTwenty)
        }
    }
}

function getProbabilityDescriptor(p) {
    if (p > .99) {
        return 'Auto'
    } else if (p > .8) {
        return 'Trivial'
    } else if (p > .7) {
        return 'Easy'
    } else if (p > .6) {
        return 'Ave'
    } else if (p > .45) {
        return 'Diffic'
    } else if (p > .25) {
        return 'Hard'
    } else if (p > .1) {
        return 'Challen'
    } else {
        return 'Impos'
    }
}

let tableArray = []
let rowArray = []

function createRowArray(index) {
    let roundedValues = [0, 3.83, 4.7, 5.64, 6.61, 7.59, 11.55, 15.39, 16.25, 17.20, 18.16, 19.14, 23.11]
    for (let i = 0; i < 21; i++) {
        rowArray.push(getProbabilityDescriptor(getProbability(roundedValues[index], i)))
    }
    tableArray.push(rowArray)
    rowArray = []
}

function createTableArray() {
    let diceValues = ['+0', '+d4!', '+d6!', '+d8!', '+d10!', '+d12!', '+d20!', '+d20!+d4!', '+d20!+d6!', '+d20!+d8!', '+d20!+d10!', '+d20!+d12!', '+2d20!']
    for (let i = 0; i < diceValues.length; i++) {
        rowArray.push(diceValues[i])
        createRowArray(i)
    }
    console.log(tableArray)
}

function createTableArray() {
    fs.readFile(`./formatter.txt`, "utf-8", (err, data) => {
        let tableString = 'insert into rmaterial (material, materialcategory, weight, multiplier)\n values'
        let i = 0

        let splitData = data.split('|')

        for (let i = 0; i < splitData.length; i += 2) {
            tableString += `('${splitData[i]}', 'Wood', 1, ${splitData[i + 1]}),\n`
        }

        console.log(tableString)
    })
}

function createTable() {
    fs.readFile(`./formatter.txt`, "utf-8", (err, data) => {
        let i = 1
        let tableArray = []
        let object = {}
        data.split('|').forEach(val => {
            if (i > 2) {
                i = 1
            }

            if (i === 1) {
                if (val.includes('-')) {
                    object.weight = (eval(val) * -1) + 1
                } else {
                    object.weight = 1
                }
            } else if (i === 2) {
                object.table = val
            }

            i++

            if (i > 2) {
                tableArray.push(object)
                object = {}
            }
        })

        console.log(tableArray)
    })
}

function addCurrentTotaltoTables() {
    let table = flawTables.physical

    let total = 0
    table = table.map(val => {
        val.currentTotal = total
        total += val.weight
        return val
    })

    console.log(table)
}

const weights = [
    {
        beastid: 1,
        labelid: 1,
        role: 'Ferdherz',
        weight: 10
    },
    {
        beastid: 1,
        labelid: 1,
        role: 'Sweinkopf',
        weight: 5
    },
    {
        beastid: 1,
        labelid: 1,
        role: 'Ziegehiten',
        weight: 3
    },
    {
        beastid: 1,
        labelid: 1,
        role: 'Braymann',
        weight: 1
    }
]
const label = [
    {
        beastid: 1,
        labelid: 1,
        weight: 10,
        label: 'Forward Scouts'
    }
]
const numbers = [
    {
        beastid: 1,
        weight: 2,
        numbers: '1d10 * 4',
        miles: 'd20'
    }
]

function getRandomEncounter() {
    let rolesGoodToAdd = {}
    let randomEncounterRoles = {}
    weights.forEach(entry => {
        rolesGoodToAdd[entry.role] = true
    })

    let roleLoopTimes = 1

    const totalNumber = rollDice(numbers[0].numbers)

    for (i = 1; i <= totalNumber; i++) {
        const entry = weights[Math.floor(Math.random()*weights.length)];

        if (randomEncounterRoles[entry.role] && rolesGoodToAdd[entry.role]) {
            randomEncounterRoles[entry.role] += 1
            if (randomEncounterRoles[entry.role] === (entry.weight * roleLoopTimes)) {
                rolesGoodToAdd[entry.role] = false
            }
        } else if (!randomEncounterRoles[entry.role] && rolesGoodToAdd[entry.role]) {
            randomEncounterRoles[entry.role] = 1
            if (randomEncounterRoles[entry.role] === (entry.weight * roleLoopTimes)) {
                rolesGoodToAdd[entry.role] = false
            }
        } else if (!rolesGoodToAdd[entry.role]) {
            let allRolesFalse = true
            for (key in rolesGoodToAdd) {
                if (rolesGoodToAdd[key]) {
                    allRolesFalse = false
                }
            }

            if (allRolesFalse) {
                for (key in rolesGoodToAdd) {
                    rolesGoodToAdd[key] = true
                }
                roleLoopTimes++
            } else {
                --i
            }
        }
    }

    console.log({
        monsterRoles: randomEncounterRoles,
        label: label[0].label,
        milesFromLair: rollDice(numbers[0].miles),
        totalNumber
    })
}

function createValuesToInsert() {
    const verbs = ["Admires", "Adores", "Afraid of", "Aloof from", "Ambivalent to", "Antagonistic to", "Antipathy Toward", "Apathetic of", "Apathetic to", "Appreciates", "Apprenticed to", "Ashamed of", "Aspirant to", "Aspiring to", "Assassinate", "At Peace with", "Averse to", "Awed by", "Awkward with", "Banished by", "Banished from", "Believes in", "Belongs to", "Bitter About", "Bound to", "Burn the", "Can't Find", "Can’t Handle", "Can’t Stand", "Captivated by", "Careful About", "Cares About", "Cares for", "Cares Little for", "Carrier of", "Child of", "Close to", "Closed to", "Cold Towards", "Comfortable with", "Compassionate to", "Compassionate Toward", "Compelled to Protect", "Connected with", "Contempt for", "Craves", "Curious About", "Dedicated to", "Defends", "Defensive About", "Demanding of", "Depends on", "Desire Death of", "Desire to B", "Desires", "Despises", "Destined for", "Devote of", "Devoted to", "Devotion to", "Disdain for", "Distaste for", "Distrusts", "Doesn't Respect", "Doesn't Understand", "Doesn't Want", "Doesn’t Care for", "Doesn’t Listen to", "Doesn’t Really Care for", "Doesn’t Want", "Donates to", "Done with", "Drawn to", "Driven to", "Dutiful to", "Embody Ymir", "Embraces Fate", "Enemy of", "Enforces", "Enjoys", "Envious of", "Estranged from", "Exploitive of", "Fanatic Disciple of", "Fanatical Devotion to", "Fascinated by", "Fascinated with", "Feels Inferior to", "Feels Superior to", "Fights for", "Finds", "Follower of", "Follows", "Fondness for", "Friend of", "Friendly to", "Friendly with", "Friends with", "Fuck", "Gave Up Everything for", "Good to His Followers", "Has a", "Has a Distaste for", "Has No", "Hates", "Hatred of", "Helps", "Hesitant to", "Hides from", "Honors", "Hopeful of", "Hungry for", "Idolized", "Idolizes", "In Debt to", "Indifferent T0", "Indifferent Towards", "Interested in", "Jealous of", "Keeps", "Likes", "Loathes", "Looking for", "Looks Down on", "Looks Up to", "Loves", "Loyal Devotee to", "Loyal to", "Loyal Toward", "Lusts for", "Merciless to", "Misses", "Mistrusts", "Mixed Feelings", "Mixed Feelings About", "Must Change View of", "Needs", "Nostalgic", "Not Bound by", "Obsessed with", "Open to", "Out to Get", "Patient with", "Patron of", "Pities", "Plagued by", "Pragmatic Toward", "Prefers", "Prioritizes", "Protective of", "Questions", "Rejected by", "Reliant on", "Respectful of", "Respects", "Revels in", "Reveres", "Rivals with", "Romantic Longing for", "Runs from", "Sacrificed for", "Scared of", "Searching for", "Secretly Wants", "Seeks", "Seizes", "Servant of", "Serves", "Sick of", "Strengthens", "Strives Fore", "Struggling with", "Supplicant of", "Supports", "Suspicious of", "Sycophantic to", "Sympathetic to", "Takes", "Thinks", "Thirsts", "Tired of", "To Family", "To Hell with", "Trusting of", "Trusts", "Uncertain About", "Uncomfortable", "Unsure of", "Upset at", "Values", "Wants", "Warm to", "Wary of", "Watches over", "Watchful of", "Wild About", "Will Do Almost Anything for", "Wishes for", "Wistful of", "Works for", "Worships", "Would Die for", "Wrestles with"]
    const nouns = ["A Bad Time", "A Business", "A Church", "A City", "A Civilian", "A Clan", "A Community", "A Cousin", "A Cult", "A Family", "A Good Time", "A Great Thief", "A Guard", "A Guild", "A Hometown", "A Library", "A Local", "A Local Spirit", "A Men", "A Paragon", "A Quiet Life on the Farm", "A Soldier", "A Uncle", "A University", "Adopted Sibling", "Adventuring", "Aggressors", "All Cultures", "All Good Things", "All of Elf Kind", "An Aunt", "An Orphanage", "Ancient Culture", "Animals", "Another", "Another City", "Another's Culture", "Another's Nobility", "Armor", "Astronomy", "Authority", "Background", "Battle", "Blood", "Brothers-in-arms", "Carvings", "Causing Trouble", "Changing Minds", "Clan Grudges", "Close Relationships", "Coin", "Companion", "Compassion", "Contemplation", "Cook", "Crime", "Criminals", "Cruelty", "Culture", "Dark Thoughts", "Dead Father", "Dead Guardian", "Dead Kid", "Dead Kids", "Dead Mother", "Dead Spouse", "Discipline", "Disorderedly People", "Downtrodden", "Everyone", "Ex", "Family", "Family Name", "Fate", "Filthy Lucre", "Forest", "Friends", "Greatness", "Happy Thoughts", "High Social Caste", "Higher Castes", "Home Hamlet", "Humor", "Iron", "Justice", "Knowledge", "Lady Luck", "Life Itself", "Lifelong Learning", "Local Community", "Location", "Magic", "Mercy", "Monsters", "Morals", "More", "Motherland", "My Allies", "My Armor", "My Clan", "My Enemies", "My Family", "My Friens", "My Future Clan", "My Guild", "My Hometown", "My Place", "My Shield", "My Spouse and Kids", "My Stuck-up Family", "My Weapon", "Nature", "Nature Divinity", "Neigborhood", "No One", "Nobility", "Nomadic Clan", "Norms", "Old Crew", "One of Their Subordinates", "Opressed", "Orderly People", "Other Classes", "Other Cultures", "Other Nobility", "Other People", "Other Profressions", "Other Races", "Others", "Overachievers", "Paintings", "Parents", "Parishioner", "People", "Peoplenumbers", "People’s Behavior", "Personal Gain", "Personal Interest", "Pilgrimmage", "Pleasure", "Popularity", "Power", "Privilege", "Quiet", "Refugees", "Responsibility", "Risktakers", "Self", "Self Preservation", "Shields", "Social Validation", "Solutions", "Spirituality", "Statues", "Strength", "Stress", "Supernatural Evil", "Sweet Tooth", "The Ancestors", "The Army", "The Austerity of Another Country", "The Austerity of Their Country", "The Bank", "The Baron", "The Bloodline", "The Church", "The City", "The Community", "The Count", "The Cult", "The Cult of Saints", "The Divines", "The Downtrodden", "The Duke", "The Empire", "The Exploited", "The Farmer", "The Flame", "The Freemen", "The Future", "The Guilds", "The Infidel", "The Innocent", "The King", "The Kingdom", "The Law", "The Little Things", "The Local Nobles", "The Local Priest", "The Moral High Ground", "The Motherland", "The Museum", "The Newly Ennobled", "The Non-ennobled", "The Old Days", "The Opulence of Another Country", "The Opulence of Their Country", "The Other Guilds", "The Party", "The Past", "The People of a Faith", "The People of the Faith", "The Physical Form", "The Plan", "The Poor", "The Prince", "The Prisoners", "The Rebel", "The Saints", "The Self-righteous", "The Spirit", "The Spirits", "The Taste of Victory", "The Tyrant", "The Watch", "The Wierd", "The World", "Their Aunts", "Their Business", "Their City", "Their Clan", "Their Class", "Their College", "Their Command", "Their Company", "Their Cousins", "Their Culture", "Their Duties", "Their Family", "Their Father", "Their Fighters", "Their Flock", "Their Followers", "Their Freedom", "Their Friends", "Their Guards", "Their Guild", "Their Hometown", "Their Job", "Their Kin", "Their Men", "Their Morality", "Their Mother", "Their Nation", "Their Noblity", "Their Paragon", "Their Parents", "Their People", "Their Profession", "Their Race", "Their Sexuality", "Their Sister", "Their Son", "Their Spouse", "Their Traveling Partners", "Their Tribe", "Their Uncles", "Their View of the World", "Theirself", "Themselves", "Thier Ex", "To Others", "Tribe", "Undead", "Underachievers", "University", "Useful People", "Uselss People", "Values", "Vigilante", "Violence", "Wealth and Power", "Wealthy People", "Weapons", "Weird Adepts", "Wizard", "Worldly Things", "Ymir", "Your Kin", "{{animal}}", "{{food}}", "{{monster}}"]

    let valuesString = ''

    nouns.forEach((val, index) => {
        valuesString += `('${verbs[index] ? verbs[index] : null}', '${nouns[index]}'), `
    })

    console.log(valuesString)
}

massive(connection).then(dbI => {
    app.set('db', dbI)
    app.listen(4343, _ => {
        // createTableArray()
        updateSearch('1.1')
        // for (i = 1; i < 8; i++) {
        // updateQuickNav('2.4')
        // }
        // formatNewSections()
        // formatPHB(0, '', 'rr')
        // addCurrentTotaltoTables()
        // getRandomEncounter()
        // createValuesToInsert()
        console.log(`The night lays like a lullaby on the earth 4343`)
    })
})
