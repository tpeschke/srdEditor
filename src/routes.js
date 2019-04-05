import React, { Component } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import Home from './components/Home'
import NavShell from './components/NavShell'

export default class Routes extends Component {

    render() {
        return (
            <div>
                <Switch >
                    <Route component={ NavShell(Home) } exact path="/" />
                    
                    <Redirect to='/' />
                </Switch>
            </div>
        )
    }
}