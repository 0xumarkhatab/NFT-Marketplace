import { Contract, providers, utils, ethers } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal, { getInjectedProvider, Provider } from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {

  const [isOwner, setIsOwner] = useState(false);
  const [isPresaleStarted, setIsPresaleStarted] = useState(false);
  const [actionButtonText, setActionButtonText] = useState(null)
  const [isPresaleEnded, setIsPresaleEnded] = useState(false);
  const [Loggedin, setLoggedin] = useState(false);
  const [Description, setDescription] = useState("Loading Blockchain State...")
  const [Loading, setLoading] = useState(false);
  const [mintedTokens, setMintedTokens] = useState(0);
  const [TotalSupply, setTotalSupply] = useState(20);

  const Web3Ref = useRef();

  async function actionHandler() {
    if (!Loggedin) {
      console.log(Web3Ref.current)
      connectWallet();
    }
    else if (isOwner && isPresaleStarted === false) {
      startPresale();
    }
    else {
      if (isPresaleStarted && !isPresaleEnded) {
        await presaleMint();
      }
      else {
        await publicMint();
      }


    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await Web3Ref.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to GOERLI");
      throw new Error("Change network to GOERLI");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setLoggedin(true);
      setTimeout(async () => {
        await updateInfromation();
        console.log("updating info inside connect");

      }, 1000);
    } catch (err) {
      console.error(err);
    }

  }

  function updateDescription() {
    if (isPresaleEnded || isPresaleEnded === true)
      setDescription("Public Minting is Live 🎉🥳. Grab your NFT Now ")
    else if (isPresaleEnded === false && isPresaleStarted)
      setDescription("Presale has started . Grab your NFT now 🎉🥳 ")



    if (isOwner) {
      if (!isPresaleStarted) {
        setDescription("Presale has not started . Start Now 🎉🥳 ")
        setActionButtonText("Start Presale")

      }
      else {

        setActionButtonText("Presale Mint")
      }
    }
    else if (!Loggedin) {
      if (!isPresaleStarted) {
        setDescription("CryptoDev NFTs Sale is going to be Live, Hurry up and become the part of this ")
      }
      else {
        setDescription("CryptoDev NFTs Presale is Live. Login and mint your NFTs if you are whitelisted ")
      }

      setActionButtonText("Login")
    }
    else if (isPresaleStarted) {

      setActionButtonText("Presale Mint")

    }
    else if (isPresaleEnded) {
      setDescription("Public Minting is Live 🎉🥳. Grab your NFT Now ")
      setActionButtonText("Public Mint")
    }
    else {
      setDescription("Public Minting is Live 🎉🥳. Grab your NFT Now ")
      setActionButtonText("Public Mint")
    }
  }

  async function presaleMint() {

    try {
      const signer = await getProviderOrSigner(true);

      const contract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.presaleMint({
        value: utils.parseEther("0.01")
      });

      setLoading(true);
      await tx.wait();
      setLoading(false);
      alert("You successfully Minted the NFT 🎉 ")
    }
    catch (err) {
      console.log("Presale Minting Error : ", err);
    }

  }
  async function publicMint() {
    try {
      const signer = await getProviderOrSigner(true);

      const contract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.mint({
        value: utils.parseEther("0.01")
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      alert("You successfully Minted the NFT 🎉 ")
    }
    catch (err) {
      console.log("Public Minting Error : ", err);
    }

  }


  async function startPresale() {
    try {
      const signer = await getProviderOrSigner(true);

      const contract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.startPresale();
      setLoading(true);
      await tx.wait();
      setLoading(false);

    }
    catch (err) {
      console.log("Presale Starting Error : ", err);
    }

  }
  async function isContractOwner() {
    const signer = await getProviderOrSigner(true);

    const contract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
    const owner = await contract.owner();
    const connectedAddress = await signer.getAddress();
    console.log("owner : ", owner, "connected : ", connectedAddress);
    if (owner.toLowerCase() == connectedAddress.toLowerCase()) {
      return true;
    }
    else {
      return false;
    }


  }


  async function getPresaleStatus() {
    const provider = await getProviderOrSigner();

    const contract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
    const presaleStartStatus = await contract.presaleStarted();
    const presaleEndStatus = await contract.presaleEnded();


    return { start: presaleStartStatus, end: presaleEndStatus.lt(Math.floor(Date.now() / 1000)) };


  }
  async function fillTokenCounts() {
    const provider = await getProviderOrSigner();

    const contract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
    const total_minted_tokens = await contract.tokenIds();
    const total_supply = await contract.maxTokenIds()
    setMintedTokens(total_minted_tokens.toString());
    setTotalSupply(total_supply.toString());
    console.log("Token stats : ", total_minted_tokens.toString(), total_supply.toString());

  }


  useEffect(() => {
    if (!Loggedin) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      Web3Ref.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();
      //      getContractOwner();

    }

    updateInfromation();

  }, [Loggedin, isOwner, isPresaleStarted, Loading])


  async function fillPresaleStatus() {
    const presale_status = await getPresaleStatus();

    if (presale_status.end) {
      setIsPresaleEnded(true);
      setIsPresaleStarted(false);
    }
    else {
      setIsPresaleEnded(false);
      setIsPresaleStarted(true);

    }

  }
  async function updateInfromation() {
    if (!Loggedin) {
      return;
    }
    const owner_status = await isContractOwner();
    setIsOwner(owner_status);
    fillPresaleStatus()
    fillTokenCounts();


    setTimeout(async () => {
      await updateDescription();
      console.log("description is ", Description);

    }, 1000);

  }



  return (
    <div className={styles.main}>
      <div className={styles.main__left}>
        <p className={styles.title}>Welcome to Crypto Devs!</p>
        <p className={styles.description}>Its an NFT collection for developers in Crypto.</p>

        <p className={styles.description}>{mintedTokens}/{TotalSupply} tokens have {mintedTokens > 0 && "already "} been minted </p>

        <p className={styles.description}>{Description} </p>
        {
          actionButtonText != null && <button className={styles.action__button} onClick={actionHandler}>{Loading ? "Loading... " : actionButtonText} 🚀</button>
        }

      </div>
      <div className={styles.main__right}>
        <img src="./cryptodevs/0.svg" />
      </div>


    </div>
  )
}