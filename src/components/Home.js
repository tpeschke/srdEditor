import React, { Component } from 'react'
import axios from 'axios'
import Display from './Display';

export default class Home extends Component {
    constructor() {
        super()

        this.state = {
            main: [],
            side: [],
            chapter: 4
        }
    }

    componentWillMount() {
        this.getNewChapter()
    }

    getNewChapter = () => {
        axios.get(`/nc/${this.state.chapter}`).then(res => {
            if (res.data === 'Something went wrong') {
                this.setState({ main: [], side: [] })
            } else if (res.data.main) {
                this.setState({ main: res.data.main, side: res.data.side })
            } else {
                this.setState({ main: res.data })
            }
        })
    }

    insertNewItem = () => {

    }

    render() {
        let display = this.state.main.map(val => {
            let sbinner = <div></div>
            if (val.linkid.split('.')[1] === 'sb') {
                sbinner = val.inner.map(inside => {
                    return <Display key={val.linkid} linkid={inside.linkid} body={inside.body} right={inside.rightbody} left={inside.leftbody} source={val.source} alt={val.alt}/>
                })
            }

            return (
                <div key={val.linkid} className="displayItemShell">
                    <Display linkid={val.linkid} body={val.body} right={val.rightbody} left={val.leftbody} source={val.source} alt={val.alt} />
                    <div className="displayItemShell">
                        <button>Add to sidebar</button>
                        {sbinner}
                    </div>
                </div>
            )
        })

        return (
            <div className="displayShell">
                <div>
                    <input type="text" placeholder={`currently on chapter ${this.state.chapter}`} onChange={e => this.setState({ chapter: e.target.value })} />
                    <button onClick={this.getNewChapter}>GO!</button>
                </div>
                <button>Add Below</button>
                {display}
            </div>
        )
    }
}