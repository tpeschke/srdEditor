import React from 'react'

export default function Display({ body, linkid, right, left, source, alt, insertNewItem, editItem, parentid, id, deleteItem }) {
    let inner = <div></div>;

    switch (linkid.split('.')[1]) {
        case 'p':
            inner = <textarea type="text" value={body} onChange={e=>editItem('p', e.target.value, parentid, id)} />
            break;
        case 'c':
            inner = (<div>
                <textarea type="text" value={left} onChange={e=>editItem('left', e.target.value, parentid, id)} />
                <textarea type="text" value={right} onChange={e=>editItem('right', e.target.value, parentid, id)} />
            </div>)
            break;
        case 'i':
            inner = (<div>
                    <textarea type="text" value={source} onChange={e=>editItem('source', e.target.value, parentid, id)} />
                    <textarea type="text" value={alt} onChange={e=>editItem('alt', e.target.value, parentid, id)} />
                </div>)
            break;
        case 'ab':
        case 'a':
            inner = <div></div>
            break;
        default:
            inner = <textarea type="text" value={body} onChange={e=>editItem(null, e.target.value, parentid, id)} />
    }
    return (
        <div className="displayItem">
            <input type="text" value={linkid.split('.')[1]} onChange={e=>editItem('linkid', e.target.value, parentid, id)}/>
            {inner}
            <div>
                <button onClick={_=>insertNewItem(linkid, parentid)}>Add Below</button>
                <button onClick={_=>deleteItem(id, parentid)}>Delete</button>
            </div>
        </div>
    )
}