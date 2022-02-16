function exportToObject(element) {
    var html = document.getElementsByClassName(element);

    let chapterTitleArray = document.getElementsByClassName('chapterTitle');
    let chapterIndex = 0;

    for (chapter of html) {
        document.getElementById('exportContent').insertAdjacentHTML('beforeend', `<h1>${chapterTitleArray.item(chapterIndex).innerText}</h1>`)
        ++chapterIndex

        chapter.childNodes.forEach(element => {
            if (element.tagName) {
                cleanTheElement(element)
            }
        })
    }

    document.getElementById('oldContent').innerHTML = ''

    var preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    var postHtml = "</body></html>";
    var html = preHtml + document.getElementById('exportContent').innerHTML + postHtml;
    var blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    var url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    filename = `${fileName}.doc`;
    var downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    if (navigator.msSaveOrOpenBlob) {
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.click();
    }
    document.body.removeChild(downloadLink);
}

function cleanTheElement(element) {
    let hasBottomMargin = element.className.includes('marginBottom')
        , tag = element.tagName
        , innards = element.innerText
        , hasItalics = false
        , isBold = false

    if (tag === 'DIV') {
        for (child of element.children) {
            if ((child.tagName === 'H1' || child.tagName === 'H2' || child.tagName === 'H3' || child.tagName === 'H4' || child.tagName === 'H5' || child.tagName === 'P') && !element.className.includes('sidebarShell')) {
                tag = child.tagName
                hasItalics = child.className.includes("italic")
                isBold = child.innerHTML.includes('strong')
            }
        }
    }

    if (tag === 'P') {
        let margin = hasBottomMargin ? 'margin:0px 0px 10px;' : 'margin:0px;';
        if (hasItalics) {
            document.getElementById('exportContent').insertAdjacentHTML('beforeend', `<p style='${margin}'><i>${innards}</i></p>`)
        } else if (isBold) {
            for (child of element.children) {
                if (child.tagName === 'P' && child.innerHTML.includes('strong')) {
                    if (hasBottomMargin) {
                        child.style.margin = '0px 0px 10px'
                    } else {
                        child.style.margin = '0px'
                    }
                    document.getElementById('exportContent').append(child)
                }
            }
        } else {
            document.getElementById('exportContent').insertAdjacentHTML('beforeend', `<p style='${margin}'>${innards}</p>`)
        }
    } else if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5') {
        document.getElementById('exportContent').insertAdjacentHTML('beforeend', `<${tag}>${innards}</${tag}>`)
    } else if (tag === 'TABLE' || tag === 'UL' || tag === 'OL') {
        document.getElementById('exportContent').append(element)
    } else if (tag === 'DIV') {
        if (element.className.includes('table-overflow') || element.className.includes('descriptionShell') || element.className.includes('multiple-tables-shell') || element.className.includes('rudiment-shell') || element.className.includes('falling-damage-shell')) {
            // EQUIPMENT TABLES
            let tables = equipmentTables.tables
            if (element.innerText.includes('Animals, Livestock & Pets')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.livestock, 'Animals, Livestock & Pets'))
            } else if (element.innerText.includes('Animals, Mounts')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.mounts, 'Animals, Mounts'))
            } else if (element.innerText.includes('Animal, Barding')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.barding, 'Animal, Barding'))
            } else if (element.innerText.includes('Animals, Feed')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.feed, 'Animals, Feed'))
            } else if (element.innerText.includes('Armor')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.armor, 'Armor'))
            } else if (element.innerText.includes('Beverages')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.beverages, 'Beverages'))
            } else if (element.innerText.includes('Clothing') && !element.innerText.includes('Accessories')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.clothing, 'Clothing'))
            } else if (element.innerText.includes('Clothing, Accessories')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.accessories, 'Clothing, Accessories'))
            } else if (element.innerText.includes('Containers, Heavy')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.heavy, 'Containers, Heavy'))
            } else if (element.innerText.includes('Poisons & Toxins')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.poisons, 'Poisons & Toxins'))
            } else if (element.innerText.includes('Shields')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.shields, 'Shields'))
            } else if (element.innerText.includes('Substances, Alchemical')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.alchemical, 'Substances, Alchemical'))
            } else if (element.innerText.includes('Substances, Ropes & Fabrics')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.ropes, 'Substances, Ropes & Fabrics'))
            } else if (element.innerText.includes('Tools, Adventuring')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.adventuring, 'Tools, Adventuring'))
            } else if (element.innerText.includes('Tools, General')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.general, 'Tools, General'))
            } else if (element.innerText.includes('Tools, Trade')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.trades, 'Tools, Trade'))
            } else if (element.innerText.includes('Weapons, Axes')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.axes, 'Weapons, Axes'))
            } else if (element.innerText.includes('Weapons, Polearms')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.polearms, 'Weapons, Polearms'))
            } else if (element.innerText.includes('Weapons, Sidearms')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.sidearms, 'Weapons, Sidearms'))
            } else if (element.innerText.includes('Weapons, Swords')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.swords, 'Weapons, Swords'))
            } else if (element.innerText.includes('Weapons, Trauma')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.trauma, 'Weapons, Trauma'))
            } else if (element.innerText.includes('Weapons, Ranged')) {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', assembleEquipmentTable(tables.ranged, 'Weapons, Ranged'))
            } else {
                document.getElementById('exportContent').insertAdjacentHTML('beforeend', element.innerHTML)
            }
        } else if (element.className.includes('tierBox')) {
            let tierBoxDiv = `<div>
                            <p>${element.children[0].innerText}</p>
                            <div>
                                <p>${element.children[1].children[0].innerText}</p>
                                <div>
                                    <p>${element.children[1].children[1].children[0].innerText}</p>
                                </div>
                            </div>
                        </div>`
            document.getElementById('exportContent').insertAdjacentHTML('beforeend', tierBoxDiv)
        } else if (element.className.includes('pair')) {
            for (child of element.children) {
                if (child.className.includes('pair')) {
                    let first = ''
                        , second = ''
                    for (grandchild of child.children) {
                        if (grandchild.tagName && first === '') {
                            first = grandchild.innerText
                        } else if (grandchild.tagName && first !== '' && second === '') {
                            second = grandchild.innerText
                        }
                    }
                    document.getElementById('exportContent').insertAdjacentHTML('beforeend', `<p style='margin:0px;'><strong>${first}</strong> ${second}</p>`)
                }
            }
        } else if (element.className.includes('sidebarShell')) {
            let sidebarTable = '<div style="border: 3px solid #b45f06;padding: 10px;margin:0px 0px 5px">'

            for (child of element.children) {
                let hasBottomMarginChild = child.className.includes('marginBottom')
                    , tagChild = child.tagName
                    , innardsChild = child.innerText

                if (tagChild === 'DIV' && !child.className.includes('chart')) {
                    for (grandchild of child.children) {
                        if (grandchild.tagName === 'H1' || grandchild.tagName === 'H2' || grandchild.tagName === 'H3' || grandchild.tagName === 'H4' || grandchild.tagName === 'H5' || grandchild.tagName === 'P') {
                            tagChild = grandchild.tagName
                            innardsChild = grandchild.innerText
                            hasBottomMarginChild = child.className.includes('marginBottom')

                            if (tagChild === 'H1') {
                                sidebarTable = sidebarTable + `<h5>${innardsChild}</h5>`
                            } else if (tagChild === 'H2' || tagChild === 'H3' || tagChild === 'H4' || tagChild === 'H5') {
                                if (tagChild === 'H3' && innardsChild.includes('{{trait | titlecase}}')) {
                                    tagChild = 'P'
                                    innardsChild = 'You can find it in Chapter 2.1 on the Bonfire SRD.'
                                }
                                sidebarTable = sidebarTable + `<${tagChild}>${innardsChild}</${tagChild}>`
                            } else if (tagChild === 'P') {
                                let margin = hasBottomMarginChild ? 'margin:0px 0px 10px;' : 'margin:0px;';
                                sidebarTable = sidebarTable + `<p style='${margin}'>${innardsChild}</p>`;
                            }
                        } else if (grandchild.tagName === 'TABLE') {
                            document.getElementById('exportContent').append(grandchild)
                        }
                    }
                } else if (tagChild === 'DIV' && child.className.includes('chart')) {
                    for (grandchild of child.children) {
                        sidebarTable = sidebarTable + `<p style='margin:0px;'>${grandchild.innerText}</p>`
                    }
                } else if (tagChild === 'H1') {
                    sidebarTable = sidebarTable + `<h5>${innardsChild}</h5>`
                }
            }
            sidebarTable = sidebarTable + '</div>'
            document.getElementById('exportContent').insertAdjacentHTML('beforeend', sidebarTable)
        } else if (element.className.includes('kit-shell')) {
            kitTables = ''

            kits.forEach(kit => {
                let body = ''
                kit.items.forEach(item => {
                    body = body + `<tr>
                    <td>${item.name}</td>
                    <td>${item.size}</td>
                    <td>${item.sellback}</td>
                  </tr>`
                })

                kitTables = kitTables + `<table style='margin:0px 0px 10px;'>
                                            <thead>
                                                <tr>
                                                    <th colspan="3">${kit.name}</th>
                                                </tr>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Size</th>
                                                    <th>Sell Back</th>
                                                </tr>
                                            </thead>
                                            <tbody>`
                    + body +
                    `<tr>
                                                    <th>Weight: ${kit.weight}</th>
                                                    <th colspan="2">Extra Cash: ${kit.cash}</th>
                                                 </tr>
                                            </tbody>
                                        </table>`
            })

            document.getElementById('exportContent').insertAdjacentHTML('beforeend', kitTables)

        } else if (element.className.includes('miscImage')) {
            document.getElementById('exportContent').insertAdjacentHTML('beforeend', '<h1>IMAGE HERE</h1>')
        } else {
            console.log('DIV EXCEPTION: ', element.className, tag, innards)
        }
    } else {
        console.log('HIGH-LEVEL EXCEPTION: ', element.className, tag, innards)
    }
}

function assembleEquipmentTable(table, title) {
    let multi = equipmentTables.multipliers
        , isThereSize = !!table[0].size


    assembledTable = `<table>
          <thead>
            <tr>
              <th colspan="${isThereSize ? 7 : 6}">${title}</th>
            </tr>
            <tr>
              <th colspan="2">Name</th>
              ${isThereSize ? '<th>Size</th>' : ''}
              <th>Source</th>
              <th>Local Market</th>
              <th>Nearby Market</th>
              <th>Distant City</th>
            </tr>
          </thead>
          <tbody>`

    table.forEach(item => {
        assembledTable = assembledTable +
            `<tr *ngFor="let content of tables.ranged">
                <td colspan="2">${item.name}</td>
                ${isThereSize ? `<td>${item.size}</td>` : ''}
                <td>${item.price}</td>
                <td>${(item.price * (item.size ? multi.local[item.size] : multi.local.M)).toFixed(1)}</td>
                <td>${(item.price * (item.size ? multi.nearby[item.size] : multi.nearby.M)).toFixed(1)}</td>
                <td>${(item.price * (item.size ? multi.distant[item.size] : multi.distant.M)).toFixed(1)}</td>
            </tr>`
    })

    return assembledTable = assembledTable + `</tbody></table>`

}