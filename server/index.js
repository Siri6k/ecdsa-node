const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const secp = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");

// Function to generate an Ethereum address from a private key
function generateWallet() {
  // 1. Generate random private key
  const privateKey = secp.utils.randomPrivateKey();
  console.log("Private key:", toHex(privateKey));

  // 2. Derive public key from private key (compressed format)
  const publicKey = secp.getPublicKey(privateKey);
  console.log("Public key:", toHex(publicKey));

  // 3. Convert public key to Ethereum address
  // - Remove first byte (compression indicator)
  // - Hash with Keccak-256
  // - Take last 20 bytes
  const ethAddress =
    "0x" + toHex(keccak256(publicKey.slice(1)).slice(-40)).toLowerCase();

  console.log("Ethereum address:", ethAddress);
  return {
    privateKey: toHex(privateKey),
    publicKey: toHex(publicKey),
    address: ethAddress,
  };
}

// Generate 3 wallets
const wallet1 = generateWallet();
const wallet2 = generateWallet();
const wallet3 = generateWallet();

// Create balances object using the addresses
const balances = {
  [wallet1.address]: 100,
  [wallet2.address]: 50,
  [wallet3.address]: 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
