const { connection } = require('./servStuff')
    , express = require('express')
    , bodyParser = require('body-parser')
    , cors = require('cors')
    , massive = require('massive')
    , fs = require('fs')
    , numWords = require('num-words')
    , _ = require('lodash')

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
    const chapterName = numWords(endpoint)

    let html = "";

    // I think I need to retrieve both the advanced and basic html, stripe it and create objects with the body and id
    // Then run through the array and see which are in the advanced array and which are in the basic and do the insert 
    // or update query from there
    // which means if I add another basic rule, I'll have to add it, with an identical id to both the basic and advaced array :/

    fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`, "utf-8", (err, data) => {
        if (err) { console.log(err) }
        fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}-advanced/chapter-${chapterName}-advanced.component.html`, "utf-8", (adverr, advData) => {
            if (adverr) { console.log(err) }
            let toBasicCompare = []
                , toAdvancedCompare = []
                , finalCompare = []

            toBasicCompare = cleanHTML(data, endpoint)
            toAdvancedCompare = cleanHTML(advData, endpoint)

            toAdvancedCompare.forEach(advParagraph => {
                if (_.find(toBasicCompare, { id: advParagraph.id })) {
                    insertOrUpdateSearch(advParagraph, "basic", finalCompare, endpoint)
                } else {
                    insertOrUpdateSearch(advParagraph, "advanced", finalCompare, endpoint)
                }
            })

            Promise.all(finalCompare).then(finalIdArray => {
                console.log(finalIdArray)
                //replace
                
            //     updateGreatLibrarySpells()
            // } else if (endpoint === 13) {
            //     updateGreatLibraryMiracles()
            // }

            // Clean up
            // db.query("select linkid from srdbasic where linkid like ('%' || $1 || '%')", [`${endpoint}.`]).then(deleteArray => {
            //     deleteArray.forEach(({ linkid }) => {
            //         if (!toCompare.includes(linkid)) {
            //             db.query('delete from srdbasic where linkid = $1', [linkid]).then();
            //         }
            //     })

            //     // fs.writeFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`, html, (err) => {
            //         fs.writeFile(`./chapter-${chapterName}.component.html`, html, (err) => {
            //         if (err) console.log(err);
            //         console.log(`Successfully Wrote Chapter ${endpoint}.`);
            //         if (endpoint !== 15) {
            //             updateSearch(endpoint + 1)
            //         } else {
            //             console.log('ALL DONE')
            //         }
            //     });
            // });

            })
        })
    })
}

function cleanHTML(data) {
    html = data.replace(/ _ngcontent-c2=""/g, '');
    newhtml = html.split(/anchor"|anchor'|anchor /)
    let toCompare = []

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

                toCompare.push({ id, section })
            }
        }
    }

    return toCompare
}

async function insertOrUpdateSearch(paragraph, type, toCompare, endpoint) {
    const db = app.get('db')
        , {id, section} = paragraph

    // check if it's new
    if (isNaN(id.substring(0, 1)) || id === '') {

        newid = makeid(10)
        newid = endpoint + newid

        toCompare.push(db.query(`insert into srd${type} (linkid, body) values ($1, $2) returning linkid`, [newid, section]).then(res => {
            return res[0].linkid
            if (type === 'basic') {

            } else if (type === 'advance') {
                // let regexId = new RegExp(`${id}`, "g")
                // html = html.replace(regexId, newid)
            }
        }));
    } else {
        // pull the the old body for basic to get it ready for the update section
        // I might need to make two htmls and make them global for the final search and replace
        toCompare.push(db.query(`update srd${type} set body = $1 where linkid = $2`, [section, id]).then(_ => {
            return id
        }));
    }

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

function updateGreatLibraryMiracles() {
    const db = app.get('db')

    fs.readFile(`../bonfireSRD/src/app/chapters/chapter-thirteen/chapter-thirteen.component.html`, "utf-8", (err, data) => {
        if (err) { console.log(err) }

        // Update Miracles
        let miracleArray = []
        let miracleList = data.split('base rules.</p>')[1].split('<h3>')

        for (i = 1; i < miracleList.length; i++) {
            let miracle = miracleList[i].split("strong class='orangeHeader'").map((val, index) => {
                if (val.includes("EFFECT")) {
                    // breaks up the effect sections
                    val = val.split('</p>').map(innerVal => {
                        // strip HTML, line breaks, and remove multiple spaces from those sections
                        return innerVal.replace(/<(?:.|\n)*?>|<|>|\r\n|\n|\r/gm, '').replace(/\s\s+/g, ' ').trim().replace(/EFFECT /g, '')
                    })
                } else {
                    // strip HTML, line breaks, and remove multiple spaces
                    val = val.replace(/<(?:.|\n)*?>|<|>|\r\n|\n|\r/gm, '').replace(/\s\s+/g, ' ').trim().replace(/BASE INVOCATION DIE /g, '')

                    if (index === 1) {
                        val = val.split(' | ')
                    }
                }

                return val
            })

            miracleArray.push(miracle)
        }

        db.query('select name, id from glmiracles').then(checkList => {
            db.query('select * from gldomains').then(domainList => {
                insertOrUpdateMiracle(miracleArray, checkList, 0, db, domainList)
            })
        })
    })
}

function insertOrUpdateMiracle(miracleList, checkList, index, db, domainList) {
    let miracle = miracleList[index]
    let checkListVersion = null
    if (miracle) {
        checkListVersion = checkList.find(obj => obj.name === miracle[0])
    }

    if (index === miracleList.length) {
        console.log('miracles updated')
    } else if (checkListVersion) {
        console.log(miracle[0])
        db.query('update glmiracles set invocationdie = $2 where name = $1', [miracle[0], miracle[2]]).then(_ => {
            insertMiracleDomains({ miracleList, checkList, index, db, domainList, miracle }, miracle[1], checkListVersion.id, 0)
        })
    } else {
        console.log(miracle[0])
        db.query('insert into glmiracles (name, invocationdie) values ($1, $2); select id from glmiracles where name = $1', [miracle[0], miracle[2]]).then(newMiracle => {
            insertMiracleDomains({ miracleList, checkList, index, db, domainList, miracle }, miracle[1], newMiracle[0].id, 0)
        })
    }
}

function insertMiracleDomains(miraclesListObj, miraclesDomains, miraclesId, index) {
    if (index === miraclesDomains.length) {
        miraclesListObj.db.query('select Count(id) from glmiracleeffects where miracleid = $1', [miraclesId]).then(effectLength => {
            insertMiracleEffects(miraclesListObj, miraclesId, 0, +effectLength[0].count)
        })
    } else {
        let { db, domainList } = miraclesListObj
        db.query('select * from glmiracledomains where miracleid = $1', [miraclesId]).then(currentDomainListFormiracles => {
            let idArray = miraclesDomains.map(val => domainList.find(obj => obj.name === val).id)

            if (!currentDomainListFormiracles.find(obj => obj.domainid === idArray[index])) {
                db.query('insert into glmiracledomains (miracleid, domainid) values ($1, $2)', [miraclesId, idArray[index]]).then(_ => {
                    insertMiracleDomains(miraclesListObj, miraclesDomains, miraclesId, ++index)
                })
            } else {
                insertMiracleDomains(miraclesListObj, miraclesDomains, miraclesId, ++index)
            }
        })
    }
}

function insertMiracleEffects(miracleListObj, miracleId, effectIndex, effectLength) {

    let miracleEffect = miracleListObj.miracle[3]

    if (effectLength > miracleEffect.length) {
        miracleListObj.db.query(`delete from glmiracleeffects where miracleid = $1 and index > $2`, [miracleId, miracleEffect.length - 1]).then(_ => {
            insertMiracleEffects(miracleListObj, miracleId, effectIndex, effectIndex)
        })
    } else if (effectLength <= effectIndex && effectIndex <= miracleEffect.length - 1 && miracleEffect[effectIndex] !== '') {
        miracleListObj.db.query(`insert into glmiracleeffects (miracleid, index, effect) values ($1, $2, $3)`, [miracleId, effectIndex, miracleEffect[effectIndex]]).then(_ => {
            insertMiracleEffects(miracleListObj, miracleId, ++effectIndex, effectLength)
        })
    } else if (effectIndex <= miracleEffect.length - 1 && miracleEffect[effectIndex] !== '') {
        if (effectLength === 0) {
            insertMiracleEffects(miracleListObj, miracleId, ++effectIndex, ++effectLength)
        } else {
            miracleListObj.db.query(`update glmiracleeffects set effect = $3 where miracleid = $1 and index = $2`, [miracleId, effectIndex, miracleEffect[effectIndex]]).then(_ => {
                insertMiracleEffects(miracleListObj, miracleId, ++effectIndex, effectLength)
            })
        }
    } else {
        let { miracleList, checkList, index, db, domainList } = miracleListObj
        insertOrUpdateMiracle(miracleList, checkList, ++index, db, domainList)
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

massive(connection).then(dbI => {
    app.set('db', dbI)
    app.listen(4343, _ => {
        updateSearch(3)
        // updateQuickNav(13)
        // formatNewSections()
        console.log(`The night lays like a lullaby on the earth 4343`)
    })
})