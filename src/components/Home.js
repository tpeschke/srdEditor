import React, { Component } from 'react'
import axios from 'axios'
import Display from './Display';
import _ from 'lodash'

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

    makeid = () => {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        for (let i = 0; i < 10; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    insertNewItem = (linkid, parentid) => {
        let copyArray = _.cloneDeep(this.state.main)
        let index = null;
        let previousIndex = null;
        let newId = this.state.chapter + '.s.' + this.makeid()

        if (parentid) {
            let parentIndex = 0
            if (parentid === 'parent') {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === linkid) {
                        parentIndex = i
                        i = copyArray.length
                    }
                }
                if (copyArray[parentIndex].inner) {
                    copyArray[parentIndex].inner.unshift({ id: newId, linkid: newId, nextid: copyArray[0].linkid })
                } else {
                    copyArray[parentIndex].inner = [{ id: newId, linkid: newId, nextid: copyArray[0].linkid }]
                }
            } else {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === parentid) {
                        parentIndex = i
                        i = copyArray.length
                    }
                }
                for (let i = 0; i < copyArray[parentIndex].inner.length; i++) {
                    if (copyArray[parentIndex].inner[i].linkid === linkid) {
                        index = i + 1
                        previousIndex = i
                        i = copyArray.length
                    }
                }
                if (copyArray[parentIndex].inner.length === index) {
                    copyArray[parentIndex].inner.push({ id: newId, linkid: newId, nextid: null })
                } else {
                    copyArray[parentIndex].inner.splice(index, 0, { id: newId, linkid: newId, nextid: copyArray[parentIndex].inner[index].linkid })
                    copyArray[parentIndex].inner[previousIndex] = Object.assign({}, copyArray[previousIndex].inner[previousIndex], { nextid: newId })
                }
            }
        } else {
            if (linkid) {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].linkid === linkid) {
                        index = i + 1
                        previousIndex = i
                        i = copyArray.length
                    }
                }
                if (copyArray.length === index) {
                    copyArray.push({ id: newId, linkid: newId, nextid: null })
                } else {
                    copyArray.splice(index, 0, { id: newId, linkid: newId, nextid: copyArray[index].linkid })
                }
                copyArray[previousIndex] = Object.assign({}, copyArray[previousIndex], { nextid: newId })
            } else {
                copyArray.unshift({ id: newId, linkid: newId, nextid: copyArray[0].linkid })
            }
        }
        this.setState({ main: copyArray })
    }

    editItem = (type, value, parentid, id) => {
        let copyArray = _.cloneDeep(this.state.main)
        if (parentid) {
            if (type === 'linkid') {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === parentid) {
                        for (let x = 0; x < copyArray[i].inner.length; x++) {
                            if (copyArray[i].inner[x].id === id) {
                                copyArray[i].inner[x].linkid = this.state.chapter + '.' + value + '.' + copyArray[i].inner[x].linkid.split('.')[2]
                                copyArray[i].inner[x].edited = true
                                if (value === 'p') {
                                    copyArray[i].inner[x].body = []
                                }
                                x = copyArray[i].inner.length
                            }
                        }
                        i = copyArray.length
                    }
                }
            } else if (type === 'p') {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === parentid) {
                        for (let x = 0; x < copyArray[i].inner.length; x++) {
                            if (copyArray[i].inner[x].id === id) {
                                copyArray[i].inner[x].body = value.split(' ')
                                copyArray[i].inner[x].edited = true
                                x = copyArray[i].inner.length
                            }
                        }
                        i = copyArray.length
                    }
                }
            } else if (type) {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === parentid) {
                        for (let x = 0; x < copyArray[i].inner.length; x++) {
                            if (copyArray[i].inner[x].id === id) {
                                copyArray[i].inner[x][value] = value
                                copyArray[i].inner[x].edited = true
                                x = copyArray[i].inner.length
                            }
                        }
                        i = copyArray.length
                    }
                }
            } else {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === parentid) {
                        for (let x = 0; x < copyArray[i].inner.length; x++) {
                            if (copyArray[i].inner[x].id === id) {
                                copyArray[i].inner[x].body = value
                                copyArray[i].inner[x].edited = true
                                x = copyArray[i].inner.length
                            }
                        }
                        i = copyArray.length
                    }
                }
            }
        } else {
            if (type === 'linkid') {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === id) {
                        copyArray[i].linkid = this.state.chapter + '.' + value + '.' + copyArray[i].linkid.split('.')[2]
                        copyArray[i].edited = true
                        if (value === 'p') {
                            copyArray[i].body = ['']
                        }
                        i = copyArray.length
                    }
                }
            } else if (type === 'p') {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === id) {
                        copyArray[i].body = value.split(' ')
                        copyArray[i].edited = true
                        i = copyArray.length
                    }
                }
            } else if (type) {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === id) {
                        copyArray[i][type] = value
                        copyArray[i].edited = true
                        i = copyArray.length
                    }
                }
            } else {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === id) {
                        copyArray[i].body = value
                        copyArray[i].edited = true
                        i = copyArray.length
                    }
                }
            }
        }

        this.setState({ main: copyArray })
    }

    render() {
        let display = this.state.main.map(val => {
            let sbinner = <div></div>
            if (val.linkid.split('.')[1] === 'sb') {
                if (val.inner) {
                    sbinner = val.inner.map(inside => {
                        return <Display key={inside.id} id={inside.id} linkid={inside.linkid} body={inside.body} right={inside.rightbody} left={inside.leftbody} source={val.source} alt={val.alt} insertNewItem={this.insertNewItem} editItem={this.editItem} parentid={val.id} />
                    })
                }
                return (
                    <div key={val.id} className="displayItemShell">
                        <Display linkid={val.linkid} id={val.id} body={val.body} right={val.rightbody} left={val.leftbody} source={val.source} alt={val.alt} insertNewItem={this.insertNewItem} editItem={this.editItem} />
                        <div className="displayItemShell">
                            <button onClick={_ => this.insertNewItem(val.id, 'parent')}>Add to sidebar</button>
                            {sbinner}
                        </div>
                    </div>
                )
            }
            return (
                <div key={val.id} className="displayItemShell">
                    <Display linkid={val.linkid} id={val.id} body={val.body} right={val.rightbody} left={val.leftbody} source={val.source} alt={val.alt} insertNewItem={this.insertNewItem} editItem={this.editItem} />
                </div>
            )

        })

        return (
            <div className="displayShell">
                <div>
                    <input type="text" placeholder={`currently on chapter ${this.state.chapter}`} onChange={e => this.setState({ chapter: e.target.value })} />
                    <button onClick={this.getNewChapter}>GO!</button>
                    <button>Save</button>
                </div>
                <button onClick={_ => this.insertNewItem()}>Add Below</button>
                {display}
            </div>
        )
    }
}