import React from 'react'

export default function Display({ body, linkid, right, left, source, alt, insertNewItem, editItemValue, editItemType, parentIndex, index, deleteItem }) {
    let inner = <div></div>;
    switch (linkid.split('.')[1]) {
        case 'c':
        case 'pc':
            inner = (<div className="doubleShell">
                <textarea type="text" value={left} onChange={e => editItemValue('leftbody', e.target.value, index, parentIndex)} />
                <textarea type="text" value={right} onChange={e => editItemValue('rightbody', e.target.value, index, parentIndex)} />
            </div>)
            break;
        case 'i':
            inner = (<div className="doubleShell">
                <textarea type="text" value={source} onChange={e => editItemValue('source', e.target.value, index, parentIndex)} />
                <textarea type="text" value={alt} onChange={e => editItemValue('alt', e.target.value, index, parentIndex)} />
            </div>)
            break;
        case 'ab':
        case 's':
            inner = <div className="middeBridge"></div>
            break;
        default:
            inner = <textarea type="text" value={body} onChange={e => editItemValue('body', e.target.value, index, parentIndex)} />
    }
    return (
        <div className="displayItem">
            <input type="text" value={linkid.split('.')[1]} onChange={e => editItemType(e.target.value, index, parentIndex)} />
            {inner}
            <div>
                <button onClick={_ => insertNewItem(index, parentIndex)}>Add Below</button>
                {/* <button onClick={_ => deleteItem(linkid, parentid)}>Delete</button> */}
            </div>
        </div>
    )
}