import React, { Component } from "react";
import { Button, FormGroup, FormControl, ControlLabel, Radio, ButtonGroup } from "react-bootstrap";
import createAds from "../../../lib/ads"


export default class BuyForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bankName: "",
      dynamicPrice: 0,
      minOrder:"",
      price:"",
      maxOrder:"",
      name:"",
      accountNo:"",
      state:""
    };
  }

  validateForm() {
    console.log(this.state.bankName.length)
      console.log(this.state.minOrder.length)
        console.log(this.state.maxOrder.length)
          console.log(this.state.price.length)
            console.log(this.state.name.length)
              console.log(this.state.accountNo.length)
                console.log(this.state.state.length)
    return this.state.bankName.length > 0 &&
        this.state.minOrder.length > 0 &&
        this.state.maxOrder.length > 0 &&
        this.state.price.length > 0 &&
        this.state.name.length > 0 &&
        this.state.accountNo.length > 0 &&
        this.state.state.length > 0
  }
  

  handleChange = async event => {
    if (event.target.name == "dynamicPrice"){
      this.setState({"dynamicPrice":event.target.value})
      console.log("FSDAFAFA",event.target.value)
      /*if (this.state.updatePriceInterval){

        clearInterval(this.state.updatePriceInterval)
      }*/
      if (event.target.value === '1'){
        const cryptCompResponse = await fetch('https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,BTC&tsyms=USD,EUR,VND');
        if (cryptCompResponse && cryptCompResponse.status === 200){
          const result = await cryptCompResponse.json();
          console.log(result)
          const priceElem = document.querySelector('#price')
          priceElem.value = result.ETH.USD;
          this.setState({"price":priceElem.value})
        }
        /*this.state.updatePriceInterval = setInterval(async function(){
          const cryptCompResponse = await fetch('https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,BTC&tsyms=USD,EUR,VND');
          if (cryptCompResponse && cryptCompResponse.status === 200){
            const result = await cryptCompResponse.json();
            console.log(result)
            this.state.price = result.ETH.USD;
            const priceElem = document.querySelector('#price')
            priceElem.value = this.state.price
          }
        }, 5000)*/
      }
    }
    else{
      this.setState({
        [event.target.id]: event.target.value
      });
      console.log(event.target.id)
    }
    
    /*console.log("event.target.id", event.target.id)
    if (event.target.id == "dynamicPrice"){
      console.log(this.state.dynamicPrice)
    }*/
  }

  handleSubmit = async event => {
    event.preventDefault();
    const response = await fetch("http://ip-api.com/json");
    if (response && response.status == 200){
      const result = await response.json()
      if (result){
        const country = result.country;
        const city = result.city;
        this.state.country = country;
        this.state.city = city;
        console.log(this.state)
        createAds(this.state)
      }

    }
  }

  render() {
    return (
      <div className="stbBuyAds">
        <form onSubmit={this.handleSubmit}>
        <input type="hidden" name="location" id="location"></input>
          <FormGroup controlId="bankName" bsSize="large">
            <ControlLabel>Bank Name</ControlLabel>
            <FormControl
              autoFocus
              type="bankName"
              value={this.state.bankName}
              onChange={this.handleChange}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Dynamic Price</ControlLabel>
            
            <ControlLabel>Yes</ControlLabel>            
            <FormControl
              name="dynamicPrice"
              type="radio"
              value={1}
              onChange={this.handleChange}  
            />
            <ControlLabel>No</ControlLabel>
            <FormControl       
            name="dynamicPrice"
              type="radio"
              value={0}
              defaultChecked          
              onChange={this.handleChange}
            />
            
          </FormGroup>
          <FormGroup controlId="minOrder">
            <ControlLabel>Minimum Order</ControlLabel>
            <FormControl
              autoFocus
              type="minOrder"
              value={this.state.minOrder}
              onChange={this.handleChange}
            />
          </FormGroup>
          <FormGroup controlId="price" bsSize="large">
            <ControlLabel>Price</ControlLabel>
            <FormControl
              autoFocus
              type="price"
              value={this.state.price}
              onChange={this.handleChange}
            />
          </FormGroup>
          <FormGroup controlId="maxOrder" bsSize="large">
            <ControlLabel>Maximum Order</ControlLabel>
            <FormControl
              autoFocus
              type="maxOrder"
              value={this.state.maxOrder}
              onChange={this.handleChange}
            />
          </FormGroup>
          <FormGroup controlId="name" bsSize="large">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              autoFocus
              type="name"
              value={this.state.name}
              onChange={this.handleChange}
            />
          </FormGroup>
          <FormGroup controlId="accountNo" bsSize="large">
            <ControlLabel>Account #</ControlLabel>
            <FormControl
              autoFocus
              type="accountNo"
              value={this.state.accountNo}
              onChange={this.handleChange}
            />
          </FormGroup>
          <FormGroup controlId="state" bsSize="large">
            <ControlLabel>State</ControlLabel>
            <FormControl
              autoFocus
              type="state"
              value={this.state.state}
              onChange={this.handleChange}
            />
          </FormGroup>          
          <Button
            block
            bsSize="large"
            disabled={!this.validateForm()}
            type="submit"
          >
            Sell Now
          </Button>
        </form>
      </div>
    );
  }
}