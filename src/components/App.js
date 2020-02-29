import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import Identicon from 'identicon.js'
import SocialNetwork from '../abis/SocialNetwork.json'
import './App.css'

const App = () => {
  const [account, setAccount] = useState('')
  const [socialNetwork, setSocialNetwork] = useState(null)
  const [postCount, setPostCount] = useState(0)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postContentInput, setPostContentInput] = useState('')

  useEffect(() => {
    loadWeb3()
    loadBlockchainData()
  }, [])

  useEffect(() => {
    if (socialNetwork !== null) {
      console.log(socialNetwork)
    }
  }, [socialNetwork])

  useEffect(() => {
    if (posts.length > 0) {
      console.log(posts)
    }
  }, [posts])

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  const loadBlockchainData = async () => {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    console.log(accounts)
    setAccount(accounts[0])
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = SocialNetwork.networks[networkId]
    if(networkData) {
      const socialNetworkContract = web3.eth.Contract(SocialNetwork.abi, networkData.address)
      setSocialNetwork(socialNetworkContract)
      const postCountValue = await socialNetworkContract.methods.postCount().call()
      setPostCount(postCountValue)
      // Load Posts
      let postHolder = [];
      for (let i = 1; i <= postCountValue; i++) {
        const post = await socialNetworkContract.methods.posts(i).call()
        postHolder.push(post)
      }
      setLoading(false)
      postHolder = postHolder.sort((a, b) => b.tipAmount - a.tipAmount)
      setPosts(postHolder)
    } else {
      window.alert('SocialNetwork contract not deployed to detected network.')
    }
    // Address
    // ABI
  }

  const sharePost = async (e) => {
    e.preventDefault()
    console.log("You've shared a post that named " + postContentInput)
  
    setLoading(true)
    await socialNetwork.methods.createPost(postContentInput).send({ from: account })
      .once('receipt', (receipt) => {
        setLoading(false)
      })
  }

  const tipPost = async (postId, tipAmt) => {
    setLoading(true)
    await socialNetwork.methods.tipPost(postId).send({ from: account, value: tipAmt })
      .once('receipt', (receipt) => {
        setLoading(false)
      })
  } 


  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <h1>Post Tipping Platform</h1>
      <p style={{textDecoration: 'underline', color: 'grey'}}>Account: {account}</p>
      {
        account ?
        <img src={`data:image/png;base64,${new Identicon(account, 30).toString()}`}></img>
        :
        <span></span>
      }
      <div style={{display: 'flex', flexDirection: 'column', boxSizing: 'border-box'}}>
      
      <div>
        <form onSubmit={(e) => sharePost(e)}>
          <input onChange={(e) => setPostContentInput(e.target.value)} placeholder="What's on your mind?"></input>
          <button style={{borderRadius: '10px', backgroundColor: 'blue', color: 'white'}} type="submit">Share</button>
        </form>
      </div>
      
      {
        loading === true && <p>Loading...</p>
      }
      {
        posts.length > 0 &&
        posts.map(post => {
          return (
            <div key={post.id._hex} style={{height: '300px', width: '250px', borderRadius: '10px', backgroundColor: '#151515', border: '1px solid gray', color: 'white', padding: '20px', flex: 1}}>
              <img src={`data:image/png;base64,${new Identicon(post.author, 30).toString()}`}></img>
              <p style={{fontSize: '9px'}}>{post.author}</p>
              <hr style={{backgroundColor: 'white'}}></hr>
              <p>{post.content}</p>
              <div>
                <p>TIPS: {window.web3.utils.fromWei(post.tipAmount.toString())} ETH</p>
                
                <form onSubmit={(e) => {
                  e.preventDefault()
                  let tipAmt = window.web3.utils.toWei('0.1', 'Ether')
                  tipPost(post.id, tipAmt)
                  }}>
                  <button type="submit"><span>TIP 0.1 ETH</span></button>
                </form>
              </div>
            </div>
          )
        }) 
      }
      </div>
    </div>
  )
}

export default App;