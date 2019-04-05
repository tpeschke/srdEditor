import React from 'react'

export default function Display({ body, linkid }) {
    let inner = <div></div>;

    switch (linkid.split('.')[1]) {
        case 'p':
            inner = <textarea type="text" value={body.join(' ')}/>
            break;
        default:
            inner = <textarea type="text" value={body}/>
    }
    return (
        <div className="displayItem">
            <input type="text" value={linkid.split('.')[1]}/>
            {inner}
        </div>
    )
}