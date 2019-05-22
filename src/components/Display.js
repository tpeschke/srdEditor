import React from 'react'

export default function Display({ body, linkid, right, left, source, alt, insertNewItem, editItem, parentid, id, deleteItem }) {
    let inner = <div></div>;
    switch (linkid.split('.')[1]) {
        case 'p':
            inner = <textarea type="text" value={body} onChange={e => editItem('p', e.target.value, parentid, linkid)} />
            break;
        case 'c':
        case 'pc':
            inner = (<div className="doubleShell">
                <textarea type="text" value={left} onChange={e => editItem('leftbody', e.target.value, parentid, linkid)} />
                <textarea type="text" value={right} onChange={e => editItem('rightbody', e.target.value, parentid, linkid)} />
            </div>)
            break;
        case 'i':
            inner = (<div className="doubleShell">
                <textarea type="text" value={source} onChange={e => editItem('source', e.target.value, parentid, linkid)} />
                <textarea type="text" value={alt} onChange={e => editItem('alt', e.target.value, parentid, linkid)} />
            </div>)
            break;
        case 'ab':
        case 'a':
        case 's':
            inner = <div className="middeBridge"></div>
            break;
        default:
            inner = <textarea type="text" value={body} onChange={e => editItem(null, e.target.value, parentid, linkid)} />
    }
    return (
        <div className="displayItem">
            <input type="text" value={linkid.split('.')[1]} onChange={e => editItem('linkid', e.target.value, parentid, linkid)} />
            {inner}
            <div>
                <button onClick={_ => insertNewItem(linkid, parentid)}>Add Below</button>
                {/* <button onClick={_ => deleteItem(linkid, parentid)}>Delete</button> */}
            </div>
        </div>
    )
}