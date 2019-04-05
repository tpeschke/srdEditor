import React from 'react';

const NavShell = Page => {
    return props => 
    <div>
        <Page {...props} />
    </div>
}

export default NavShell