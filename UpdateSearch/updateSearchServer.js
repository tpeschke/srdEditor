const {connection} = require('./servStuff')
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

    fs.readFile(`../bonfireSRD/src/app/chapter-${chapterName}/chapter-${chapterName}.component.html`, "utf-8", (err, data) => {
        if (err) { console.log(err) }
        html = data.replace(/ _ngcontent-c2=""/g, '');
        newhtml = html.split(/anchor"|anchor'/)

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
                let section = newhtml[i].replace(/(\r\n|\n|\r)/gm,'').match(/<h.*?>(.*?)<\/h|<p.*?>(.*?)<\/p/g)
                section = section[0].replace(/<strong.*?>|<\/strong>|<a.*?>|<\/a>/g, '')
                let type = section.split(' ')[0].substring(1)
                section = section.split('>')[1].split('<')[0]

                // check if it's new
                if (isNaN(id.substring(0, 1)) || id === '') {
                    if (type.includes('h') && section[1]) {
                        // console.log(newhtml[i])
                        if (section[1].includes('CrP')) {
                            type = 'pc'
                        } else {
                            type = 'c'
                        }
                    } else if (type.includes('h3')) {
                        type = type.substring(0, 2)
                    }else if (type.includes('h') || type.includes('p')) {
                        type = type.substring(0, 1)
                    }

                    newid = makeid(10)
                    newid = endpoint + type + newid
                    searchId = endpoint + '.' + type + '.' + newid

                    db.query('insert into srdbasic (linkid, body) values ($1, $2)',[searchId, section]).then();
                    toCompare.push(searchId)

                    html = html.replace(id, newid)

                //If not, add to compare list
                } else {
                    let searchId = ''
                    // check for generated ids
                    if (id.length > 10) {
                        searchId = id.substring(0, `${endpoint}`.length) + '.' + id.substring(`${endpoint}`.length, id.length - 10) + '.' + id.substring(id.length - 10)
                    // check for old id
                    } else {
                        let startIndex = 0;
                        for (let i = 0; i < id.length; i++) {
                            if (+id.substring(i)) {
                                startIndex = i;
                                i = id.length + 1
                            }
                        }
                        searchId = id.substring(0, `${endpoint}`.length) + '.' + id.substring(`${endpoint}`.length, startIndex) + '.' + id.substring(startIndex)
                    }

                    // db.query('insert into srdbasic (linkid, body) values ($1, $2)',[searchId, section]).then();
                    db.query('update srdbasic set body = $1 where linkid = $2',[section, searchId]).then();
                    toCompare.push(searchId)
                }
            }
        }

        // Clean up
        db.query("select linkid from srdbasic where linkid like ('%' || $1 || '%')",[`${endpoint}.`]).then(deleteArray => {
            deleteArray.forEach(({linkid})=> {
                if (!toCompare.includes(linkid)) {
                    db.query('delete from srdbasic where linkid = $1',[linkid]).then();
                }
            })

            fs.writeFile(`../bonfireSRD/src/app/chapter-${chapterName}/chapter-${chapterName}.component.html`, html, (err) => {
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

massive(connection).then(dbI => {
    app.set('db', dbI)
    app.listen(4343, _ => {
        updateSearch(1)
        console.log(`The night lays like a lullaby on the earth 4343`)
    })
})