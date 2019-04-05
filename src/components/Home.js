import React, { Component } from 'react'
import axios from 'axios'
import Display from './Display';

export default class Home extends Component {
    constructor() {
        super()

        this.state = {
            main: [],
            side: [],
            chapter: 1
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

    render() {
        let display = this.state.main.map(val => {
            return (
                <div key={val.linkid} className="displayItemShell">
                    <Display linkid={val.linkid} body={val.body} />
                    <div>
                        <button>Add Below</button>
                        <button>Edit</button>
                        <button>Save</button>
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