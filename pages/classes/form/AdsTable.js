import React, { Component } from "react";
import fetch from "node-fetch"
import "./AdsTable.css"
//import ContentEditable from "./ContentEditable"
import ContentEditable from "react-contenteditable"

export default class AdsTable extends Component {
    constructor(props) {
        super(props);
        this.getTableData("ASC").then(result => {
            console.log(result)
            //this.setState({sortPrice:this.state.sortPrice})
        })
        this.state = {
            sortPrice: "ASC",
            dataArray: null
        };
        this.sortByPrice = this.sortByPrice.bind(this)
    }

    /*validateForm() {
      return this.state.email.length > 0 && this.state.password.length > 0;
    }
  
    handleChange = event => {
      this.setState({
        [event.target.id]: event.target.value
      });
    }*/

    sortByPrice() {
        //e.preventDefault();
        const sort = this.state.sortPrice == "ASC" ? "DESC" : "ASC"
        console.log(state)
        this.setState({
            sortPrice: sort
        })
        this.getTableData(sort).then(result => {

            console.log(result)
            //this.setState({sortPrice:this.state.sortPrice})
        })
    }
    async getTableData(sort) {
        const response = await fetch(`http://localhost:3000/api/getAds?sort=${sort}`)
        console.log("getTableData")
        if (response && response.status == 200) {
            const result = await response.json()
            this.setState({ dataArray: result.data })

            return result.data;
        }
        else {
            return {}
        }
    }

    onValueChanged(obj) {
        console.log(obj)
    }
    handleChange_bankName(obj) {
        console.log("handleChange_bankName", obj.currentTarget.getAttribute('rowid'), obj.target.value)
        fetch(`http://localhost:3000/api/updateBank?adsId=${obj.currentTarget.getAttribute('rowid')}&value=${obj.target.value}`)
        .then(response=>{
            if(response && response.status == 200){
                response.json();
            }
        })
        .then(result=>{
            console.log(result);
        })
    }
    handleChange_minOrder(obj) {
        console.log("handleChange_bankName", obj.currentTarget.getAttribute('rowid'), obj.target.value)
    }
    handleChange_maxOrder(obj) {
        console.log("handleChange_bankName", obj.currentTarget.getAttribute('rowid'), obj.target.value)
    }
    handleChange_price(obj) {
        console.log("handleChange_bankName", obj.currentTarget.getAttribute('rowid'), obj.target.value)
    }

    render() {

        let tableContent = () => {
            let table = []
            if (this.state.dataArray) {
                this.state.dataArray.forEach(element => {


                    table.push(<div className="sbTableContentRow">
                        <ContentEditable
                            className="sbColContent"
                            html={String(element.bankName)} // innerHTML of the editable div
                            disabled={false} // use true to disable edition
                            onChange={this.handleChange_bankName} // handle innerHTML change
                            rowid={element.adsId}
                        />
                        <ContentEditable
                            className="sbColContent"
                            html={String(element.minOrder)} // innerHTML of the editable div
                            disabled={false} // use true to disable edition
                            onChange={this.handleChange_minOrder} // handle innerHTML change
                            rowid={element.adsId}
                        />
                        <ContentEditable
                            className="sbColContent"
                            html={String(element.maxOrder)} // innerHTML of the editable div
                            disabled={false} // use true to disable edition
                            onChange={this.handleChange_maxOrder} // handle innerHTML change
                            rowid={element.adsId}
                        />
                        <ContentEditable
                            className="sbColContent"
                            html={String(element.price)} // innerHTML of the editable div
                            disabled={false} // use true to disable edition
                            onChange={this.handleChange_price} // handle innerHTML change
                            rowid={element.adsId}
                        />
                    </div>)
                });
            }
            return table
        }





        return (
            <div className="sbAdsTable">
                <div className="sbTableHeader">
                    <div className="sbColHeader">Bank Name</div>
                    <div className="sbColHeader">Min</div>
                    <div className="sbColHeader">Vol</div>
                    <div className="sbColHeader" onClick={this.sortByPrice}>$Price</div>
                </div>
                <div className="sbTableContent">
                    {tableContent()}
                </div>
            </div>

        )
    }
}