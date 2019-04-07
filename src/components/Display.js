import React from 'react'

export default function Display({ body, linkid, right, left, source, alt }) {
    let inner = <div></div>;

    switch (linkid.split('.')[1]) {
        case 'p':
            inner = <textarea type="text" value={body.join(' ')} />
            break;
        case 'c':
            inner = (<div>
                <textarea type="text" value={left} />
                <textarea type="text" value={right} />
            </div>)
            break;
        case 'i':
            inner = (<div>
                    <textarea type="text" value={source} />
                    <textarea type="text" value={alt} />
                </div>)
            break;
        default:
            inner = <textarea type="text" value={body} />
    }
    return (
        <div className="displayItem">
            <input type="text" value={linkid.split('.')[1]} />
            {inner}
            <div>
                <button>Add Below</button>
                <button>Save</button>
            </div>
        </div>
    )
}