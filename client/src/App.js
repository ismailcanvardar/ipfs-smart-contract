import React, { useState, useEffect } from "react";
import Web3 from "web3";
import ipfs from "./ipfs";
import SimpleStorage from "./contracts/SimpleStorage.json";

const App = () => {
  const [account, setAccount] = useState("");
  const [buffer, setBuffer] = useState(null);
  const [IPFSHash, setIPFSHash] = useState(null);
  const [simpleStorage, setSimpleStorage] = useState(null);
  const [savedImage, setSavedImage] = useState(null);
  const [user, setUser] = useState({});

  const [createUserValues, setCreateUserValues] = useState({
    email: "",
    username: ""
  });

  useEffect(() => {
    loadWeb3();
    loadBlockchainData();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };

  useEffect(() => {
    console.log(account);
  }, [account]);

  const loadBlockchainData = async () => {
    const web3 = window.web3;
    // Load account
    const accounts = await web3.eth.getAccounts();
    console.log(accounts[0]);
    setAccount(accounts[0]);
    // Network ID
    const networkId = await web3.eth.net.getId();
    const networkData = SimpleStorage.networks[networkId];
    if (networkData) {
      const simpleStorageContract = new web3.eth.Contract(
        SimpleStorage.abi,
        networkData.address
      );
      setSimpleStorage(simpleStorageContract);
    }
  };

  useEffect(() => {
    if (simpleStorage !== null) {
      simpleStorage.methods
        .get()
        .call({ from: account })
        .then(res => setSavedImage(res));

      getUserCredentials();
    }
  }, [simpleStorage]);

  const getUserCredentials = async () => {
    await simpleStorage.methods
      .getUserCredentials()
      .call({ from: account })
      .then(res => {
        setUser(res);
        console.log(res);
      });
  };

  const onSubmit = async e => {
    e.preventDefault();
    ipfs.files.add(buffer, async (err, res) => {
      if (err) {
        alert(err);
        console.error(err);
        return;
      }
      console.log(res[0].hash);
      await simpleStorage.methods.set(res[0].hash).send({ from: account });
      return setIPFSHash(res[0].hash);
    });
  };

  const captureFile = e => {
    const file = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      setBuffer(Buffer(reader.result));
    };
  };

  const createUser = async e => {
    e.preventDefault();
    await simpleStorage.methods
      .createUser(createUserValues.email, createUserValues.username)
      .send({ from: account })
      .once("receipt", receipt => {
        console.log(receipt.events.createUser.returnValue);
      });
  };

  // useEffect(() => {
  //   console.log(buffer);
  // }, [buffer])

  return (
    <div style={{ minHeight: "100vh", width: "100%", backgroundColor: "black", color: '#FF0000' }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "start",
          justifyContent: "center"
        }}
      >
        <div>
          <h1>Boilerplate</h1>
          <p style={{ textDecoration: "underline", color: "grey" }}>
            Account: {account}
          </p>

          {IPFSHash && (
            <img src={`https://ipfs.io/ipfs/${IPFSHash}`} alt="photo"></img>
          )}
          <div style={{backgroundColor: '#151515', padding: '7px', textAlign: 'center', borderRadius: '5px', marginBottom: '20px'}}>
            <h5>Upload Image:</h5>
            <form onSubmit={e => onSubmit(e)}>
            <input onChange={e => captureFile(e)} type="file"></input>
            <button type="submit">Submit</button>
          </form>
          </div>

          {savedImage !== null && (
            <img src={`https://ipfs.io/ipfs/${savedImage}`} alt="photo"></img>
          )}

          <div style={{backgroundColor: '#151515', padding: '7px', textAlign: 'center', borderRadius: '5px', marginTop: '20px'}}>
            <h5>Create User:</h5>
            <form onSubmit={e => createUser(e)}>
            <input
              placeholder="email"
              onChange={e =>
                setCreateUserValues({
                  ...createUserValues,
                  email: e.target.value
                })
              }
            ></input>
            <input
              placeholder="username"
              onChange={e =>
                setCreateUserValues({
                  ...createUserValues,
                  username: e.target.value
                })
              }
            ></input>
            <button type="submit">Create User</button>
          </form>
        </div>
          </div>

        <div
          style={{
            marginLeft: "20px",
            border: "1px solid #151515",
            borderRadius: '5px',
            backgroundColor: '#151515',
            padding: "10px",
            marginTop: '123px'
          }}
        >
          <h2>Created User:</h2>
          <p>ID: {user.userId}</p>
          <p>Email: {user.userEmail}</p>
          <p>Username: @{user.userUsername}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
