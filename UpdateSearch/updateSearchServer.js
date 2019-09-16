const { connection } = require('./servStuff')
    , express = require('express')
    , bodyParser = require('body-parser')
    , cors = require('cors')
    , massive = require('massive')
    , toCompare = []
    , fs = require('fs')
    , numWords = require('num-words')

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

    let html = "";

    fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`, "utf-8", (err, data) => {
        if (err) { console.log(err) }
        html = data.replace(/ _ngcontent-c2=""/g, '');
        newhtml = html.split(/anchor"|anchor'|anchor /)

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
                let section = newhtml[i].replace(/(\r\n|\n|\r)/gm, '').match(/<h.*?>(.*?)<\/h|<p.*?>(.*?)<\/p/g)
                // this will also catch images with ids but it will result in section being null so this is just tell it to ignore those
                if (section) {
                    section = section[0].replace(/<strong.*?>|<\/strong>|<a.*?>|<\/a>/g, '')
                    section = section.split('>')[1].split('<')[0]

                    // check if it's new
                    if (isNaN(id.substring(0, 1)) || id === '') {

                        newid = makeid(10)
                        newid = endpoint + newid

                        db.query('insert into srdbasic (linkid, body) values ($1, $2)', [newid, section]).then(res => console.log(res));
                        toCompare.push(newid)
                        let regexId = new RegExp(`${id}`, "g")
                        html = html.replace(regexId, newid)

                        //If not, add to compare list
                    } else {
                        // db.query('insert into srdbasic (linkid, body) values ($1, $2)',[id, section]).then();
                        db.query('update srdbasic set body = $1 where linkid = $2', [section, id]).then();
                        toCompare.push(id)
                    }
                }
            }
        }

        if (endpoint === 12) {
            updateGreatLibrary()
        }

        // Clean up
        db.query("select linkid from srdbasic where linkid like ('%' || $1 || '%')", [`${endpoint}.`]).then(deleteArray => {
            deleteArray.forEach(({ linkid }) => {
                if (!toCompare.includes(linkid)) {
                    db.query('delete from srdbasic where linkid = $1', [linkid]).then();
                }
            })

            fs.writeFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`, html, (err) => {
                // fs.writeFile(`./chapter-${chapterName}.component.html`, html, (err) => {
                if (err) console.log(err);
                console.log(`Successfully Wrote Chapter ${endpoint}.`);
                if (endpoint !== 15) {
                    updateSearch(endpoint + 1)
                } else {
                    console.log('ALL DONE')
                }
            });
        });

    });
}

function updateGreatLibrary() {
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
        console.log('db updated')
    } else if (checkListVersion) {
        console.log(spell[0])
        db.query('update glspells set name = $1, base_cost = $2, components = $3, duration = $4, aoe = $5 where name = $1', [spell[0], spell[2], spell[3], spell[4], spell[5], spell[6]]).then(_ => {
            insertSpellOrders({ spellList, checkList, index, db, orderList, spell }, spell[1], checkListVersion.id, 0)
        })
    } else {
        console.log(spell[0])
        db.query('insert into glspells (name, base_cost, components, duration, aoe) values ($1, $2, $3, $4, $5)', [spell[0], spell[2], spell[3], spell[4], spell[5], spell[6]]).then(_ => {
            insertSpellOrders({ spellList, checkList, index, db, orderList, spell }, spell[1], checkListVersion.id, 0)
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

    fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`, "utf-8", (err, data) => {
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
                let section = newhtml[i].replace(/(\r\n|\n|\r)/gm, '').match(/<h.*?>(.*?)<\/h|<p.*?>(.*?)<\/p/g)[0].replace(/<h.*?>|<\/h/g, '')

                if (newhtml[i].indexOf('<h3>') !== -1) {
                    quickNav = quickNav + `{linkid: 'hg', body: '${section}', jump: '${id}'}, `
                } else if (newhtml[i].indexOf('<h1>') !== -1) {
                    quickNav = quickNav + `{linkid: 'h', body: '${section}', jump: '${id}'}, `
                }
            }
        }

        fs.writeFile(`../chapter-${chapterName}-quicknav.txt`, quickNav, (err) => {
            if (err) console.log(err);
            console.log(`Successfully Created QuickNav for Chapter ${endpoint}.`);
        });
    });
}

function formatNewSections() {
    let formattedArray = []

    fs.readFile(`../Untitleddocument.txt`, "utf-8", (err, data) => {

        data.split('|').forEach(val => {
            if (val.substring(0, 1) === 'h') {
                formattedArray.push(`<div class='anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}'"></app-bm-chapter-icon>
                        <h3>${val.substring(1).toUpperCase()}</h3>
                    </div>`)
            } else if (val.substring(0, 1) === 'p') {
                formattedArray.push(`<div class='paragraphShell anchor'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}'"></app-bm-chapter-icon>
                        <p>${val.substring(1)}</p>
                    </div>`)
            } else if (val.substring(0, 1) === 'l') {
                formattedArray.push(`<div class='paragraphShell anchor marginBottom'>
                        <div id='${val.substring(1, 15).replace(/[\W_]+/g, "")}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${val.substring(1, 15).replace(/[\W_]+/g, "")}'"></app-bm-chapter-icon>
                        <p>${val.substring(1)}</p>
                    </div>`)
            } else if (val.substring(0, 1) === 's') {
                formattedArray.push(`<div class="anchor">
                        <div id="${val.substring(1, 15).replace(/[\W_]+/g, "")}" class="anchorTag"></div>
                        <h1>${val.substring(1).toProperCase(true)}</h1>
                    </div>`)
            } else if (val.substring(0, 1) === 'm') {
                formattedArray.push(`<div class="anchor marginBottom">
                        <div id="${val.substring(1, 15).replace(/[\W_]+/g, "")}" class="anchorTag"></div>
                        <h1>${val.substring(1).toProperCase(true)}</h1>
                    </div>`)
            } else if (val.substring(0, 1) === 'c') {
                formattedArray.push(`<strong class='orangeHeader'>${val.substring(1).toUpperCase()}</strong>`)
            } else {
                console.log('something when wrong', val)
            }

        })
        fs.writeFile(`../formated.html`, formattedArray.join(''), (err) => {
            // fs.writeFile(`./chapter-${chapterName}.component.html`, html, (err) => {
            if (err) console.log(err);
            console.log(`All Done.`);
        });
    })
}

function formatSpells() {
    let formattedArray = []

    fs.readFile(`../spells.txt`, "utf-8", (err, data) => {
        data.split('    ').forEach(val => {
            val.split('\n').forEach((innerVal, i, array) => {
                let cleanedVal = innerVal.replace(/\n|\r/ig, '')
                let newId = makeid(10)
                if (cleanedVal === '') {
                    formattedArray.push('<div class="space"></div>')
                } else if (cleanedVal.substring(0, 6) === 'ORDERS') {
                    let orders = cleanedVal.split(':')[1].replace(/,/ig, " |")
                    formattedArray.push(`<div class='paragraphShell anchor'>
                    <div id='${newId}' class='anchorTag'></div>
                    <app-bm-chapter-icon [id]="'${newId}'"></app-bm-chapter-icon>
                    <p><strong class='orangeHeader'>ORDERS</strong> ${orders}</p>
                  </div>`)
                } else if (cleanedVal.substring(0, 9) === "BASE COST" || cleanedVal.substring(0, 10) === "COMPONENTS" || cleanedVal.substring(0, 8) === "DURATION" || cleanedVal.substring(0, 6) === "RADIUS" || cleanedVal.substring(0, 8) === "POSITIVE" || cleanedVal.substring(0, 8) === "NEGATIVE") {
                    cleanedVal = cleanedVal.split(':')
                    let heading = cleanedVal[0]
                    let value = cleanedVal[1]
                    formattedArray.push(`<div class='paragraphShell anchor'>
                    <div id='${newId}' class='anchorTag'></div>
                    <app-bm-chapter-icon [id]="'${newId}'"></app-bm-chapter-icon>
                    <p><strong class='orangeHeader'>${heading}</strong> ${value}</p>
                  </div>`)
                } else if (cleanedVal.toUpperCase() === cleanedVal) {
                    formattedArray.push(`<div class='anchor'>
                    <div id='${newId}' class='anchorTag'></div>
                    <app-bm-chapter-icon [id]="'${newId}'"></app-bm-chapter-icon>
                    <h3>${cleanedVal}</h3>
                  </div>`)
                } else {
                    if (i === array.length) {
                        formattedArray.push(`<div class='paragraphShell anchor marginBottom'>
                        <div id='${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${newId}'"></app-bm-chapter-icon>
                        <p>${cleanedVal}</p>
                      </div>`)
                    } else {
                        formattedArray.push(`<div class='paragraphShell anchor'>
                        <div id='${newId}' class='anchorTag'></div>
                        <app-bm-chapter-icon [id]="'${newId}'"></app-bm-chapter-icon>
                        <p>${cleanedVal}</p>
                      </div>`)
                    }
                }
            })
        })

        fs.writeFile(`../formatedSpells.html`, formattedArray.join(''), (err) => {
            // fs.writeFile(`./chapter-${chapterName}.component.html`, html, (err) => {
            if (err) console.log(err);
            console.log(`All Done.`);
        });
    })
}

massive(connection).then(dbI => {
    app.set('db', dbI)
    app.listen(4343, _ => {
        updateSearch(1)
        // updateQuickNav(12)
        // formatNewSections()
        // formatSpells()
        console.log(`The night lays like a lullaby on the earth 4343`)
    })
})