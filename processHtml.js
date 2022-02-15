function exportToObject(element) {
    var html = document.getElementsByClassName(element);

    let chapterTitleArray = document.getElementsByClassName('chapterTitle');
    let chapterIndex = 0;

    document.getElementsByClassName('sidebarShell')

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
}

function cleanTheElement(element) {
    let hasBottomMargin = element.className.includes('marginBottom')
        , tag = element.tagName
        , innards = element.innerText
        , hasItalics = false

    if (tag === 'DIV') {
        for (child of element.children) {
            if ((child.tagName === 'H1' || child.tagName === 'H2' || child.tagName === 'H3' || child.tagName === 'H4' || child.tagName === 'H5' || child.tagName === 'P') && !element.className.includes('sidebarShell')) {
                tag = child.tagName
                hasItalics = child.className.includes("italic")
            }
        }
    }

    if (tag === 'P') {
        let margin = hasBottomMargin ? 'margin:0px 0px 10px;' : 'margin:0px;';
        if (hasItalics) {
            document.getElementById('exportContent').insertAdjacentHTML('beforeend', `<p style='${margin}'><i>${innards}</i></p>`)
        } else {
            document.getElementById('exportContent').insertAdjacentHTML('beforeend', `<p style='${margin}'>${innards}</p>`)
        }
    } else if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5') {
        document.getElementById('exportContent').insertAdjacentHTML('beforeend', `<${tag}>${innards}</${tag}>`)
    } else if (tag === 'TABLE' || tag === 'UL') {
        document.getElementById('exportContent').append(element)
    } else if (tag === 'DIV') {
        if (element.className.includes('pair')) {
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
                            hasBottomMarginChild = grandchild.className.includes('marginBottom')

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

                kitTables = kitTables + `<table style='margin:0px 0px 10px;>
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
                <tbody>` + body + `<tr>
                    <th>Weight: ${kit.weight}</th>
                    <th colspan="2">Extra Cash: ${kit.cash}</th>
                  </tr>
                </tbody>
              </table>`
            })

            document.getElementById('exportContent').insertAdjacentHTML('beforeend', kitTables)

        } else {
            console.log('DIV EXCEPTION: ', element.className, tag, innards)
        }
    } else {
        console.log('HIGH-LEVEL EXCEPTION: ', element.className, tag, innards)
    }
}