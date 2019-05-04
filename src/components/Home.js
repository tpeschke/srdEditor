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
            deleteList: [],
            chapter: 5
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
                res.data.main.forEach(val => {
                    let content = ''
                    if (val.linkid.split('.')[1] === 'p') {
                        for (let i = 0; i < val.body.length; i++) {
                            if (val.body[i].substring(0, 2) === '+)' || val.body[i].substring(0, 7) === 'Chapter') {
                                content = content + val.body[i] + '|'
                            } else if (val.body[i + 1] && val.body[i + 1].substring(0, 7) === 'Chapter') {
                                content = content + val.body[i] + '|'
                            } else {
                                content = content + val.body[i] + ' '
                            }
                        }
                        val.body = content
                    } else if (val.linkid.split('.')[1] === 'sb') {
                        val.inner.forEach(para => {
                            if (para.linkid.split('.')[1] === 'p') {
                                for (let i = 0; i < para.body.length; i++) {
                                    if (para.body[i].substring(0, 2) === '+)' || para.body[i].substring(0, 7) === 'Chapter') {
                                        content = content + para.body[i] + '|'
                                    } else if (para.body[i + 1] && para.body[i + 1].substring(0, 7) === 'Chapter') {
                                        content = content + para.body[i] + '|'
                                    } else {
                                        content = content + para.body[i] + ' '
                                    }
                                }
                                para.body = content
                            }
                        })
                    }
                })
                console.log(res.data.main)
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
                copyArray[parentIndex].nextid = newId
                copyArray[parentIndex].endit = newId
                copyArray[parentIndex].edited = true
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
                        i = copyArray[parentIndex].inner.length
                    }
                }
                if (copyArray[parentIndex].inner.length === index) {
                    copyArray[parentIndex].inner.push({ id: newId, linkid: newId, nextid: null })
                    copyArray[parentIndex].inner[previousIndex].nextid = newId
                    copyArray[parentIndex].endid = newId
                    copyArray[parentIndex].edited = true
                } else {
                    copyArray[parentIndex].inner.splice(index, 0, { id: newId, linkid: newId, nextid: copyArray[parentIndex].inner[index].linkid })
                    copyArray[parentIndex].inner[previousIndex].nextid = newId
                }
                copyArray[parentIndex].inner[previousIndex].edited = true
                copyArray[parentIndex].inner[index].edited = true
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
                copyArray[previousIndex] = Object.assign({}, copyArray[previousIndex], { nextid: newId, edited: true })
            } else {
                copyArray.unshift({ id: newId, linkid: newId, nextid: copyArray[0].linkid })
            }
        }
        this.setState({ main: copyArray }, _ => window.scrollTo(0, document.body.scrollHeight))
    }

    editItem = (type, value, parentid, linkid) => {
        let copyArray = _.cloneDeep(this.state.main)

        if (parentid) {
            if (type === 'linkid') {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].id === parentid) {
                        for (let x = 0; x < copyArray[i].inner.length; x++) {
                            if (copyArray[i].inner[x].linkid === linkid) {
                                if (copyArray[i].endid === copyArray[i].inner[x].linkid) {
                                    copyArray[i].endid = this.state.chapter + '.' + value + '.' + copyArray[i].inner[x].linkid.split('.')[2]
                                    copyArray[i].edited = true
                                }
                                copyArray[i].inner[x].linkid = this.state.chapter + '.' + value + '.' + copyArray[i].inner[x].linkid.split('.')[2]
                                copyArray[i].inner[x].edited = true
                                if (copyArray[i].inner[x - 1]) {
                                    copyArray[i].inner[x - 1].nextid = copyArray[i].inner[x].linkid
                                    copyArray[i].inner[x - 1].edited = true
                                }
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
                            if (copyArray[i].inner[x].linkid === linkid) {
                                if (copyArray[i].endid === copyArray[i].inner[x].linkid) {
                                    copyArray[i].endid = this.state.chapter + '.' + type + '.' + copyArray[i].inner[x].linkid.split('.')[2]
                                    copyArray[i].edited = true
                                }
                                copyArray[i].inner[x].body = value
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
                            if (copyArray[i].endid === copyArray[i].inner[x].linkid) {
                                copyArray[i].endid = this.state.chapter + '.' + value + '.' + copyArray[i].inner[x].linkid.split('.')[2]
                            }
                            if (copyArray[i].inner[x].linkid === linkid) {
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
                            if (copyArray[i].endid === copyArray[i].inner[x].linkid) {
                                copyArray[i].endid = this.state.chapter + '.' + value + '.' + copyArray[i].inner[x].linkid.split('.')[2]
                            }
                            if (copyArray[i].inner[x].linkid === linkid) {
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
                    if (copyArray[i].linkid === linkid) {
                        copyArray[i].linkid = this.state.chapter + '.' + value + '.' + copyArray[i].linkid.split('.')[2]
                        copyArray[i].edited = true
                        copyArray[i - 1].nextid = this.state.chapter + '.' + value + '.' + copyArray[i].linkid.split('.')[2]
                        copyArray[i - 1].edited = true
                        if (value === 'p') {
                            copyArray[i].body = ['']
                        }
                        i = copyArray.length
                    }
                }
            } else if (type === 'p') {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].linkid === linkid) {
                        copyArray[i].body = value
                        copyArray[i].edited = true
                        i = copyArray.length
                    }
                }
            } else if (type) {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].linkid === linkid) {
                        copyArray[i][type] = value
                        copyArray[i].edited = true
                        i = copyArray.length
                    }
                }
            } else {
                for (let i = 0; i < copyArray.length; i++) {
                    if (copyArray[i].linkid === linkid) { 
                        copyArray[i].body = value
                        copyArray[i].edited = true
                        i = copyArray.length
                    }
                }
            }
        }
        this.setState({ main: copyArray })
    }

    deleteItem = (linkid, parentid) => {
        let copyArray = _.cloneDeep(this.state.main)
        if (parentid) {
            for (let i = 0; i < copyArray.length; i++) {
                if (copyArray[i].linkid === parentid) {
                    for (let x = 0; x < copyArray[i].inner.length; x++) {
                        if (copyArray[i].inner.length === 1) {
                            copyArray[i].inner.pop()
                            copyArray[i].endid = null
                            copyArray[i].nextid = null
                            copyArray[i].edited = true
                        } else {
                            if (!copyArray[i].inner[x + 1].nextid) {
                                copyArray[i].inner[x].nextid = null
                            } else {
                                copyArray[i].inner[x - 1].nextid = copyArray[i].inner[x + 1].linkid
                                copyArray[i].inner[x - 1].edited = true
                            }
                            copyArray[i].inner.splice(x + 1, 1)
                            copyArray[i].endid = copyArray[i].inner[copyArray[i].inner.length - 1].linkid
                        }
                        x = copyArray[i].inner.length
                    }
                    i = copyArray.length
                }
            }
        } else {
            for (let i = 0; i < copyArray.length; i++) {
                if (copyArray[i].linkid === linkid) {
                    copyArray[i - 1].nextid = copyArray[i + 1].linkid
                    copyArray[i - 1].edited = true
                    copyArray.splice(i, 1)
                    i = copyArray.length
                }
            }
        }

        this.setState({ main: copyArray })
    }

    saveChanges = () => {
        let savedArray = []
        let copyArray = _.cloneDeep(this.state.main)
        copyArray.forEach(val => {
            if (val.edited) {
                savedArray.push(val)
                val.edited = null;
            }
            if (val.linkid.split('.')[1] === 'sb') {
                val.inner.forEach(inside => {
                    if (inside.edited) {
                        savedArray.push(inside)
                        inside.edited = null;
                    }
                })
            }
        })

        axios.patch('/saveChapter', { auth: process.env.REACT_APP_AUTH, chapter: savedArray }).then(_ => {
            this.setState({ main: copyArray })
        })
    }

    render() {
        let display = this.state.main.map(val => {
            let sbinner = <div></div>
            if (val.linkid.split('.')[1] === 'sb') {
                if (val.inner) {
                    sbinner = val.inner.map(inside => {
                        return <Display key={inside.id + inside.linkid} id={inside.id} linkid={inside.linkid} body={inside.body} right={inside.rightbody} left={inside.leftbody} source={val.source} alt={val.alt} insertNewItem={this.insertNewItem} editItem={this.editItem} parentid={val.id} deleteItem={this.deleteItem} />
                    })
                }
                return (
                    <div key={val.id + val.linkid} className="displayItemShell">
                        <Display linkid={val.linkid} id={val.id} body={val.body} right={val.rightbody} left={val.leftbody} source={val.source} alt={val.alt} insertNewItem={this.insertNewItem} editItem={this.editItem} deleteItem={this.deleteItem} />
                        <div className="displayItemShell">
                            <button onClick={_ => this.insertNewItem(val.id, 'parent')}>Add to sidebar</button>
                            {sbinner}
                        </div>
                    </div>
                )
            }
            return (
                <div key={val.id + val.linkid} className="displayItemShell">
                    <Display linkid={val.linkid} id={val.id} body={val.body} right={val.rightbody} left={val.leftbody} source={val.source} alt={val.alt} insertNewItem={this.insertNewItem} editItem={this.editItem} deleteItem={this.deleteItem} />
                </div>
            )

        })

        return (
            <div className="outerShell">
                <div className="navShell">
                    <input type="text" placeholder={`currently on chapter ${this.state.chapter}`} onChange={e => this.setState({ chapter: e.target.value })} />
                    <button onClick={this.getNewChapter}>GO!</button>
                    <button onClick={this.saveChanges}>Save</button>
                    <br/>
                    <button onClick={_=>window.scrollTo(0,document.body.scrollHeight)}>To Bottom</button>
                </div>
                <div className="displayShell">
                    <button onClick={_ => this.insertNewItem()}>Add Below</button>
                    {display}
                </div>
            </div>
        )
    }
}