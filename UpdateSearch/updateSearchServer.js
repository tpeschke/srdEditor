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

    fs.readFile(`../bonfireSRD/src/app/chapters/chapter-${chapterName}/chapter-${chapterName}.component.html`, "utf-8", (err, data) => {
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
                section = section.split('>')[1].split('<')[0]

                // check if it's new
                if (isNaN(id.substring(0, 1)) || id === '') {

                    newid = makeid(10)
                    newid = endpoint + newid

                    db.query('insert into srdbasic (linkid, body) values ($1, $2)',[newid, section]).then(res => console.log(res));
                    toCompare.push(newid)

                    html = html.replace(id, newid)

                //If not, add to compare list
                } else {
                    // db.query('insert into srdbasic (linkid, body) values ($1, $2)',[id, section]).then();
                    db.query('update srdbasic set body = $1 where linkid = $2',[section, id]).then();
                    toCompare.push(id)
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

massive(connection).then(dbI => {
    app.set('db', dbI)
    app.listen(4343, _ => {
        updateSearch(1)
        console.log(`The night lays like a lullaby on the earth 4343`)
    })
})