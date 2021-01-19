import Link from 'next/link'
import algosdk from "algosdk";
import React, { useEffect, useState } from "react"
import Layout from '../components/layout/layout';
import Grid from '@material-ui/core/Grid'
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

export default function Home() {
  const [algoInstalled, setAlgoinstalled] = useState(false);
  const [jsonResponse, setJsonResponse] = useState(false);
  const [optInResponse, setOptInResponse] = useState(false);
  const [stakeResponse, setStakeResponse] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(null);
  const [network, setNetwork] = useState("TestNet");

  useEffect(() => {
    if (typeof AlgoSigner !== 'undefined') {
      setAlgoinstalled(true);
    }
  });

  const changeStakeAmount = (event) => {
    console.log(event.target.value)
    setStakeAmount(event.target.value)
  }


  const changeNetwork = (event) => {
    console.log(event.target.value)

    setNetwork(event.target.value);
}

  const getAccount = async () => {
    console.log(await AlgoSigner.accounts({ ledger: 'TestNet' }));
  }

  const getApp = async () => {
    var test = await AlgoSigner.algod({
      ledger: network,
      path: '/v2/applications/13360793',
      method: 'GET',
    });

    setJsonResponse(JSON.stringify(test, null, ' '));
  }

  const optIn = async () => {
    var txParams;
    var appId = 13360793;
    var signedTx;

    await AlgoSigner.algod({
      ledger: network,
      path: '/v2/transactions/params'
    })
      .then((d) => {
        txParams = d;
      })
      .catch((e) => {
        console.error(e);
      });


    let txn = {
      type: "appl",
      appOnComplete: 1,
      from: "CWYQGEQ72DIBEQ6DAFV74LCEY6TEFADLB446O3GEP7T2SYEFJ3Q3APJPBI",
      appIndex: appId,
      fee: txParams['fee'],
      firstRound: txParams['last-round'],
      lastRound: txParams['last-round'] + 1000,
      genesisID: txParams['genesis-id'],
      genesisHash: txParams['genesis-hash'],
    };

    await AlgoSigner.sign(txn)
      .then((d) => {
        signedTx = d;
      })
      .catch((e) => {
        console.error(e);
      });

    await AlgoSigner.send({
      ledger: network,
      tx: signedTx.blob
    }).then(response => {
      setOptInResponse(JSON.stringify(response, null, ' '));
    }).catch(error => {
      setOptInResponse(JSON.stringify(error, null, ' '));
    })

  }

  const reclaim = async () => {
    var txParams;
    let enc = new TextEncoder();
    var appArgs = [];

    var programCode = "AiAEAgYABTIEIhIzABAjEhAzABkkEiUzABkSERAzASAyAxIQMwAgMgMSEA=="
    appArgs.push(enc.encode("reclaim"));

    let program = new Uint8Array(Buffer.from(programCode, "base64"));

    let lsig = await algosdk.makeLogicSig(program);
    console.log(program)
    let sender = lsig.address();
    console.log(lsig)

    var appAccounts = [];
    appAccounts.push(sender);

    await AlgoSigner.algod({
      ledger: network,
      path: '/v2/transactions/params'
    })
      .then((d) => {
        txParams = d;
      })
      .catch((e) => {
        console.error(e);
      });

    let txn = {
      fee: txParams['fee'],
      firstRound: txParams['last-round'],
      lastRound: txParams['last-round'] + 1000,
      genesisID: txParams['genesis-id'],
      genesisHash: txParams['genesis-hash'],
    };

    let txn1 = await algosdk.makeApplicationNoOpTxn("CWYQGEQ72DIBEQ6DAFV74LCEY6TEFADLB446O3GEP7T2SYEFJ3Q3APJPBI", txn, 13360793, appArgs, appAccounts);
    let txn2 = await algosdk.makePaymentTxnWithSuggestedParams(sender, "CWYQGEQ72DIBEQ6DAFV74LCEY6TEFADLB446O3GEP7T2SYEFJ3Q3APJPBI", 90000, undefined, undefined, txn);
    
    let txngroup = await algosdk.assignGroupID([txn1, txn2]);
    txn1.group = txngroup[0].group.toString('base64');
    txn2.group = txngroup[1].group.toString('base64');

    console.log(" I have been grouped")

    /* AlgoSigner requires uint8Array to be in base64 format */
    var encryptedBytes = Buffer.from(txn1.appArgs[0]);
    txn1.appArgs[0] = encryptedBytes.toString('base64');

    /* Required due to how javascript SDK creates objects, not compatable with AlgoSigner */
    delete txn1.name;  
    delete txn1.tag; 
    delete txn1.lease; 
    delete txn1.note;  

    txn1.genesisHash = txParams['genesis-hash'];
    txn1.from = "CWYQGEQ72DIBEQ6DAFV74LCEY6TEFADLB446O3GEP7T2SYEFJ3Q3APJPBI";
    txn1.appAccounts = [sender];

    /* Repeated for down here aswell due an error popping up for SDK "address is malformed" if not modified */
    delete txn2.name; 
    delete txn2.tag;  
    delete txn2.lease; 
    delete txn2.note;  
    delete txn2.appArgs
    txn2.genesisHash = txParams['genesis-hash'];
    txn2.to = "CWYQGEQ72DIBEQ6DAFV74LCEY6TEFADLB446O3GEP7T2SYEFJ3Q3APJPBI";
    txn2.from = sender;

    console.log(txn1)
    console.log(txn2)

    var signed1, signed2;

    signed1 = await AlgoSigner.sign(txn1);
    signed2 = await algosdk.signLogicSigTransaction(txn2, lsig);

    console.log(signed1)
    console.log(signed2)

    if (!(signed1 && signed2)) {
      console.log("oh no")
    }

    const decoded_1 = new Uint8Array(atob(signed1.blob).split("").map(x => x.charCodeAt(0)));
    const decoded_2 = signed2.blob;

    console.log(decoded_1);
    console.log(decoded_2);

    let combined_decoded_txns = new Uint8Array(decoded_1.byteLength + decoded_2.byteLength);
    combined_decoded_txns.set(new Uint8Array(decoded_1), 0);
    combined_decoded_txns.set(new Uint8Array(decoded_2), decoded_1.byteLength);

    const grouped_txns = btoa(String.fromCharCode.apply(null, combined_decoded_txns));

    console.log(await AlgoSigner.send({
      ledger: network,
      tx: grouped_txns
    }).then((tx) => {
      console.log(tx)

    }).catch((e) => { console.log(e) }));
  }


  const stake = async () => {
    var txParams;
    var appId = 13360793;
    let enc = new TextEncoder();
    var appArgs = [];
    appArgs.push(enc.encode("stake"));

    await AlgoSigner.algod({
      ledger: network,
      path: '/v2/transactions/params'
    })
      .then((d) => {
        txParams = d;
      })
      .catch((e) => {
        console.error(e);
      });

    let txn = {
      fee: txParams['fee'],
      firstRound: txParams['last-round'],
      lastRound: txParams['last-round'] + 1000,
      genesisID: txParams['genesis-id'],
      genesisHash: txParams['genesis-hash'],
    };

    let tres = await algosdk.makePaymentTxnWithSuggestedParams("CWYQGEQ72DIBEQ6DAFV74LCEY6TEFADLB446O3GEP7T2SYEFJ3Q3APJPBI", "B7FLOD5FPBXZTACR7S4L6HNTW4TNZPLFWYRH2EN5MISLW4LTLWNYVUOW7I", 10000, undefined, undefined, txn);

    console.log(tres)

    let txn1 = {
      ...txn,
      appArgs: appArgs,
      from: "CWYQGEQ72DIBEQ6DAFV74LCEY6TEFADLB446O3GEP7T2SYEFJ3Q3APJPBI",
      type: "appl",
      appIndex: appId,
    };

    let txn2 = {
      ...txn,
      from: "CWYQGEQ72DIBEQ6DAFV74LCEY6TEFADLB446O3GEP7T2SYEFJ3Q3APJPBI",
      to: "B7FLOD5FPBXZTACR7S4L6HNTW4TNZPLFWYRH2EN5MISLW4LTLWNYVUOW7I",
      type: "pay",
      amount: Number(stakeAmount)
    };


    // Use the sdk to assign a group id
    let txngroup = await algosdk.assignGroupID([txn1, txn2]);

    // Modify the group fields in orginal transactions to be base64 encoded strings
    txn1.group = txngroup[0].group.toString('base64');
    txn2.group = txngroup[1].group.toString('base64');

    // Need to encrypt the apps arguments to a base64 string as per AlgoSigners requirements
    var encryptedBytes = Buffer.from(txn1.appArgs[0]);
    txn1.appArgs[0] = encryptedBytes.toString('base64');

    // Ask for sign for the original created transactions. If one was already signed we only need one signature here.
    var signed1, signed2;
    signed1 = await AlgoSigner.sign(txn1);
    signed2 = await AlgoSigner.sign(txn2);

    // If we rejected a sign then just return.
    if (!(signed1 && signed2)) {
      console.log("oh no")
    }

    // Get the decoded binary Uint8Array values from the blobs
    const decoded_1 = new Uint8Array(atob(signed1.blob).split("").map(x => x.charCodeAt(0)));
    const decoded_2 = new Uint8Array(atob(signed2.blob).split("").map(x => x.charCodeAt(0)));

    // Use their combined length to create a 3rd array
    let combined_decoded_txns = new Uint8Array(decoded_1.byteLength + decoded_2.byteLength);

    // Starting at the 0 position, fill in the binary for the first object
    combined_decoded_txns.set(new Uint8Array(decoded_1), 0);

    // Starting at the first object byte length, fill in the 2nd binary value
    combined_decoded_txns.set(new Uint8Array(decoded_2), decoded_1.byteLength);

    // Modify our combined array values back to an encoded 64bit string
    const grouped_txns = btoa(String.fromCharCode.apply(null, combined_decoded_txns));

    // Use AlgoSigner to send this grouped atomic transaction to the Algorand test network
    console.log(await AlgoSigner.send({
      ledger: network,
      tx: grouped_txns
    }).then((tx) => {
      setStakeResponse(JSON.stringify(tx, null, ' '))
    }).catch((e) => {
      setStakeResponse(JSON.stringify(e, null, ' '));
    }));
  }

  return (
    <Layout>
      <Grid style={{ maxWidth: "1000px", margin: "auto" }} >
        <Grid>
          <Select
            native
            variant="outlined"
            style={{ background: "grey" }}
            value={network}
            onChange={changeNetwork}
            inputProps={{
              name: 'Network',
            }}
          >
            <option value={"TestNet"}>Test Net</option>
            <option value={"MainNet"}>Main Net</option>
          </Select>
        </Grid>
        <Grid container spacing={2}>
          <Grid item sm={6} xs={12}>
            <Grid>
              <h1>Create Fund <strong>{" - ADMIN (COMING SOON)"}</strong></h1>
            </Grid>
            <Grid style={{ marginTop: "10px" }}>
              <Select
                native
                variant="outlined"
                style={{ width: "100%" }}
                //value={network}
                onChange={() => { changeOwnerAccount() }}
                inputProps={{
                  name: 'Account',
                }}
              >
                <option value={0}>Account 1</option>
                <option value={1}>Account 2</option>
              </Select>
            </Grid>
            <Grid style={{ marginTop: "10px" }}>
              <Button disabled style={{ width: "100%" }} variant="contained" color="primary" onClick={() => {
                optIn()
              }}>
                Create Fund
          </Button>

            </Grid>

          </Grid>

          <Grid item sm={6} xs={12}>
            <Grid>
              <pre style={{
                background: "#f5f5f5",
                overflow: "auto",
                height: "250px"
              }}>
                <code>
                  {jsonResponse}
                </code>
              </pre>
            </Grid>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item sm={6} xs={12}>
            <Grid>
              <h1>Opt-In<strong>{" - CLIENT"}</strong></h1>
            </Grid>
            <Grid>
              <Button style={{ width: "100%" }} variant="contained" color="primary" onClick={() => {
                optIn()
              }}>
                Opt In
          </Button>
            </Grid>
            <Grid>


            </Grid>

          </Grid>

          <Grid item sm={6} xs={12}>
            <Grid>
              <pre style={{
                background: "#f5f5f5",
                overflow: "auto",
                height: "250px"
              }}>
                <code>
                  {optInResponse}
                </code>
              </pre>
            </Grid>
          </Grid>
        </Grid>


        <Grid container spacing={2}>
          <Grid item sm={6} xs={12}>
            <Grid>
              <h1>Stake<strong>{" - CLIENT"}</strong></h1>
            </Grid>
            <Grid style={{ marginTop: "10px" }}>
              <TextField label="Amount" variant="outlined" style={{ width: "100%" }} value={stakeAmount} onChange={changeStakeAmount} />
            </Grid>
            <Grid style={{ marginTop: "10px" }}>
              <Button style={{ width: "100%" }} variant="contained" color="primary" onClick={() => {
                stake()
              }}>
                Stake
          </Button>
            </Grid>

            <Grid>
            </Grid>
          </Grid>

          <Grid item sm={6} xs={12}>
            <Grid>
              <pre style={{
                background: "#f5f5f5",
                overflow: "auto",
                height: "250px"
              }}>
                <code>
                  {stakeResponse}
                </code>
              </pre>
            </Grid>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item sm={6} xs={12}>
            <Grid>
              <h1>Reclaim<strong>{" - CLIENT (COMING SOON)"}</strong></h1>
            </Grid>
            <Grid>
              <Button style={{ width: "100%" }} variant="contained" color="primary" onClick={() => {
                reclaim()
              }}>
                Reclaim
          </Button>
            </Grid>
            <Grid>
            </Grid>
          </Grid>

          <Grid item sm={6} xs={12}>
            <Grid>
              <pre style={{
                background: "#f5f5f5",
                overflow: "auto",
                height: "250px"
              }}>
                <code>
                  {jsonResponse}
                </code>
              </pre>
            </Grid>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item sm={6} xs={12}>
            <Grid>
              <h1>Claim Difference<strong>{" - ADMIN (COMING SOON)"}</strong></h1>
            </Grid>
            <Grid>
              <Button disabled style={{ width: "100%" }} variant="contained" color="primary" onClick={() => {
                claimDifference()
              }}>
                Claim Difference
          </Button>
            </Grid>
            <Grid>


            </Grid>

          </Grid>

          <Grid item sm={6} xs={12}>
            <Grid>
              <pre style={{
                background: "#f5f5f5",
                overflow: "auto",
                height: "250px"
              }}>
                <code>
                  {jsonResponse}
                </code>
              </pre>
            </Grid>
          </Grid>
        </Grid>

      </Grid>


    </Layout>
  )
}
