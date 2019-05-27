import React, { Component } from 'react'
import axios from 'axios'
import Display from './Display';
import _ from 'lodash'

export default class Home extends Component {
    constructor() {
        super()

        this.state = {
            main: [{ linkid: '9.p.1' }],
            side: [],
            deleteList: [],
            chapter: 9
        }
    }

    componentWillMount() {
        // this.getNewChapter()
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
                                content = ''
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

    makeid = (num) => {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        for (let i = 0; i < num; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    insertNewItem = (index, parentIndex) => {
        let copyArray = _.cloneDeep(this.state.main)
        let newId = this.state.chapter + '.' + this.makeid(1) + '.' + this.makeid(10)

        //Sidebar
        if (parentIndex || parentIndex === 0) {
            console.log(parentIndex)
            let item = copyArray[parentIndex]
            if (!index && index !== 0) {
                if (!item.inner) {
                    item.inner = []
                }
                item.inner.unshift({ linkid: newId, nextid: null, edited: true })
                item.nextid = newId
                item.endid = newId
                item.edited = true
            } else {
                item.inner.splice(index + 1, 0, { linkid: newId, nextid: item.inner[index + 1] ? item.inner[index + 1].linkid : null, edited: true })
                if (parentIndex || parentIndex === 0) {
                    item.inner[index].nextid = newId
                    item.inner[index].edited = true
                }
            }
            //If Last Item
            if (item.inner[item.inner.length - 1].linkid !== item.endid) {
                item.endid = newId
            }
            //Add First Item
        } else if (!index && index !== 0) {
            copyArray.unshift({ linkid: newId, nextid: copyArray[0] ? copyArray[0].linkid : null, edited: true })
        } else {
            copyArray.splice(index + 1, 0, { linkid: newId, nextid: copyArray[index + 1] ? copyArray[index + 1].linkid : null, edited: true })
            if (index || index === 0) {
                //If Sidebar is Item Before
                if (copyArray[index].linkid.split('.')[1] === 'sb' || copyArray[index].linkid.split('.')[1] === 'a') {
                    let innerArray = copyArray[index].inner
                    innerArray[innerArray.length - 1].nextid = newId
                    innerArray[innerArray.length - 1].edited = true
                } else {
                    copyArray[index].nextid = newId
                    copyArray[index].edited = true
                }
            }
        }

        this.setState({ main: copyArray }, _ => window.scrollTo(0, document.body.scrollHeight))
    }

    editItemType = (value, index, parentIndex) => {
        let copyArray = _.cloneDeep(this.state.main)
            , splitId = null
            , newId = null
            , item = null;

        if (parentIndex || parentIndex === 0) {
            item = copyArray[parentIndex].inner
            splitId = item[index].linkid.split('.')
            splitId[1] = value.trim()
            newId = splitId.join('.')
            item[index].linkid = newId
            item[index].edited = true
            if (item[index - 1]) {
                item[index - 1].nextid = newId
                item[index - 1].edited = true
            } else {
                item.nextid = newId
                item.edited = true
            }
        } else {
            splitId = copyArray[index].linkid.split('.')
            splitId[1] = value.trim()
            newId = splitId.join('.')
            copyArray[index].linkid = newId
            copyArray[index].edited = true
            if (copyArray[index - 1]) {
                if (copyArray[index - 1].linkid.split('.')[1] === 'sb' || copyArray[index - 1].linkid.split('.')[1] === 'a') {
                    item = copyArray[index - 1].inner
                    item[item.length - 1].nextid = newId
                    item[item.length - 1].edited = true
                } else if (copyArray[index - 1]) {
                    copyArray[index - 1].nextid = newId
                    copyArray[index - 1].edited = true
                }
            }
        }

        this.setState({ main: copyArray })
    }

    editItemValue = (type, value, index, parentIndex) => {
        let copyArray = _.cloneDeep(this.state.main)
        , item = null;

        if (parentIndex || parentIndex === 0) {
            item = copyArray[parentIndex].inner
            item[index][type] = value
            item[index].edited = true
        } else {
            copyArray[index][type] = value
            copyArray[index].edited = true
        }

        this.setState({ main: copyArray })
    }

    deleteItem = (index, parentIndex) => {

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
        let display = this.state.main.map((val, index) => {
            let sbinner = <div></div>
            if (val.linkid.split('.')[1] === 'sb' || val.linkid.split('.')[1] === 'a') {
                if (val.inner) {
                    sbinner = val.inner.map((inside, insideIndex) => {
                        return <Display key={inside.id + inside.linkid} index={insideIndex} parentIndex={index} linkid={inside.linkid} body={inside.body} right={inside.rightbody} left={inside.leftbody} source={inside.source} alt={inside.alt} insertNewItem={this.insertNewItem} editItemType={this.editItemType} editItemValue={this.editItemValue} deleteItem={this.deleteItem} />
                    })
                }
                return (
                    <div key={val.id + val.linkid} className="displayItemShell">
                        <Display linkid={val.linkid} index={index} body={val.body} right={val.rightbody} left={val.leftbody} source={val.source} alt={val.alt} insertNewItem={this.insertNewItem} editItemType={this.editItemType} editItemValue={this.editItemValue} deleteItem={this.deleteItem} />
                        <div className="displayItemShell">
                            <button onClick={_ => this.insertNewItem(null, index)}>Add to sidebar</button>
                            {sbinner}
                        </div>
                    </div>
                )
            }
            return (
                <div key={val.id + val.linkid} className="displayItemShell">
                    <Display linkid={val.linkid} index={index} body={val.body} right={val.rightbody} left={val.leftbody} source={val.source} alt={val.alt} insertNewItem={this.insertNewItem} editItemType={this.editItemType} editItemValue={this.editItemValue} deleteItem={this.deleteItem} />
                </div>
            )

        })

        return (
            <div className="outerShell">
                <div className="navShell">
                    <input type="text" placeholder={`currently on chapter ${this.state.chapter}`} onChange={e => this.setState({ chapter: e.target.value })} />
                    <button onClick={this.getNewChapter}>GO!</button>
                    <button onClick={this.saveChanges}>Save</button>
                    <br />
                    <button onClick={_ => window.scrollTo(0, document.body.scrollHeight)}>To Bottom</button>
                </div>
                <div className="displayShell">
                    <button onClick={_ => this.insertNewItem(null)}>Add Below</button>
                    {display}
                    <button onClick={_ => console.log(this.state.main)}>Log Chapter Array</button>
                </div>
            </div>
        )
    }
}