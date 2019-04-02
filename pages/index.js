/*import {Link} from '../routes'

export default () => (
  <div>
    <div>Welcome to Next.js!</div>
    <Link route='blog' params={{slug: 'hello-world'}}>
      <a>Hello world</a>
    </Link>
    or
    <Link route='/blog/hello-world'>
      <a>Hello world</a>
    </Link>
  </div>
)*/
import React from 'react'
import Login from './classes/form/Login'
import BuyForm from './classes/form/BuyForm'
import SellForm from './classes/form/SellForm'
import AdsTable from './classes/form/AdsTable'

export default class extends React.Component {
  static async getInitialProps({ req }) {
    //  console.log(req)
    const userAgent = req ? req.headers['user-agent'] : navigator.userAgent
    return { userAgent }
    //const buyForm = Login();
     
  }

  constructor(props){
    super(props);
    this.state = {
      isShow :"buyForm"
    }
  }


  render() {
    return (
      <div>
        CREATE BUY/SELL ADS
        <button value="buyForm">show buy form</button>
        {(this.state.isShow === "buyForm") && <BuyForm />}
        <SellForm></SellForm>
        <AdsTable></AdsTable>
        
      </div>
    )
  }
}