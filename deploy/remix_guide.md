# 🛠️ Smart Contract Deployment Guide (Remix IDE)

This guide walks you through deploying `CertificateRegistry.sol` onto the **Ethereum Sepolia Testnet** in under 3 minutes using the official [Remix Ethereum IDE](https://remix.ethereum.org).

---

## 📋 Prerequisites

1. **MetaMask Wallet**: Installed in your browser ([Download MetaMask](https://metamask.io/download/)).
2. **SepoliaETH Test Gas**: Get free testnet ETH from:
   - [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

---

## 🚀 Step-by-Step Deployment

### 1. Open Remix IDE
Navigate to **[https://remix.ethereum.org](https://remix.ethereum.org)**.

### 2. Create the Contract File
1. In the File Explorer pane on the left, open the `contracts` folder.
2. Click **Create New File** and name it `CertificateRegistry.sol`.
3. Open `contracts/CertificateRegistry.sol` from this repository, copy its full code, and paste it into Remix.

### 3. Compile the Contract
1. On the left sidebar, click the **Solidity Compiler** tab (icon looks like the Solidity S logo).
2. Set the **Compiler Version** to `0.8.20` or higher.
3. Click the blue button: **Compile CertificateRegistry.sol**.
4. Ensure a green checkmark appears on the compiler tab.

### 4. Deploy via MetaMask (Injected Provider)
1. On the left sidebar, click the **Deploy & Run Transactions** tab (Ethereum logo with arrow).
2. In the **Environment** dropdown, select **"Injected Provider - MetaMask"**.
3. MetaMask will prompt you to connect. Approve the connection.
4. Verify that MetaMask network is set to **Sepolia**.
5. In the **Contract** dropdown, confirm `CertificateRegistry - contracts/CertificateRegistry.sol` is selected.
6. Click the orange **Deploy** button.
7. Confirm the transaction in MetaMask.

### 5. Link the Deployed Contract to the Web Application
1. In Remix, scroll down to the **Deployed Contracts** section at the bottom of the left sidebar.
2. Click the copy icon next to the contract name to copy your new contract address (e.g. `0x71C...3aF`).
3. Open `js/config.js` in your project folder.
4. Paste your address into `CONTRACT_ADDRESS`:
   ```javascript
   const CONFIG = {
       CONTRACT_ADDRESS: "0xYourCopiedContractAddressHere",
       ...
   };
   ```
5. Save the file.
6. Refresh `INDEX.HTML` or `issuer.html`. The network indicator pill will now read **Live Contract Connected**!

---

## 💡 Alternative: 1-Click Browser Deployment

You can also deploy directly from within this application without opening Remix:
1. Run `node server.js` and open `deploy.html` in your browser.
2. Click **Connect MetaMask Wallet**.
3. Click **Deploy Contract to Sepolia**.
4. The local server will automatically update `js/config.js` for you upon deployment confirmation!
