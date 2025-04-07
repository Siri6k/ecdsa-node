const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const wallets = {
  wallet1: {
    privateKey:
      "0accce5cedfd31bd827671dd1c1d1ed3de25ed7e994bf8b1d20c967b415f4023",
    publicKey:
      "046777bdafaaf6abb9076b0be0e8a4a64bc431ca6dca55aa7435cfcd2dae488e0e565df9d314ea91abd31a110b963faf0d6830ee0c0ea3760a450819c66a256dbb",
    address:
      "0x7a3133da527d28d88bed8b8e4a6594ac56d4c27c23b4c66f74a0e92039489d9d",
  },
  wallet2: {
    privateKey:
      "f59d5425715f7a808d25a60144c027c7bee322a0595c2ee312dd7608c7fe714e",
    publicKey:
      "04f9756242bf80364060515436141472961195b837da4961939ad56c7e052e32739e6e6b0098a9c032ea4fd5b68b4b9e91140ef5be5d9cecbf3eb8ef0c609cd737",
    address:
      "0x388ddec23dde443f6e1853836043f7001c5b71ec5191e0263d8b08f25c314e78",
  },
  wallet3: {
    privateKey:
      "295438ce013c68beecddd78aa6c4098959afab4740f97bea55abd35d2574c453",
    publicKey:
      "04d8b683188c598c1e5d11c2174a5f815057abcabf1564f79b668897fe17169ada872ca471100b8c744df7405df26c7551cb3e4a67ab99ce2236535c4c044dd817",
    address:
      "0x0634bbb0e2641ee983cf24a6e8f126edb13bb15c8d70c88d4b2be5b4f9576778",
  },
};

const secp = require("ethereum-cryptography/secp256k1");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");

// Function to generate an Ethereum address from a private key
function generateWallet() {
  // 1. Generate random private key
  const privateKey = secp.utils.randomPrivateKey();
  console.log("Private key:", toHex(privateKey));

  // 2. Derive public key from private key (compressed format)
  const publicKey = secp.getPublicKey(privateKey);

  // 3. Convert public key to Ethereum address
  // - Remove first byte (compression indicator)
  // - Hash with Keccak-256
  // - Take last 20 bytes
  const ethAddress =
    "0x" + toHex(keccak256(publicKey.slice(1)).slice(-40)).toLowerCase();

  console.log("Ethereum address:", ethAddress);
  return {
    address: ethAddress,
  };
}

// Generate 3 wallets
const wallet1 = wallets.wallet1;
const wallet2 = wallets.wallet2;
const wallet3 = wallets.wallet3;

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
  try {
    const { signature: signatureHex, recoveryBit, transaction } = req.body;

    // 1. Validate signature length (must be 64 bytes = 128 hex chars)
    if (signatureHex.length !== 128) {
      return res.status(400).send({ message: "Invalid signature length" });
    }

    // 2. Consistent JSON stringification with sorted keys
    const txString = JSON.stringify(
      transaction,
      Object.keys(transaction).sort()
    );
    const transactionHash = toHex(keccak256(utf8ToBytes(txString)));

    // 3. Convert hex signature to Uint8Array
    const signatureBytes = secp.Signature.fromCompact(signatureHex);
    signatureBytes.recovery = recoveryBit;

    // 4. Recover public key
    const publicKey = secp.recoverPublicKey(
      transactionHash,
      signatureBytes.toCompactRawBytes(),
      recoveryBit
    );

    console.log("Recovered public key:", toHex(publicKey));

    // 5. Get sender address
    const sender =
      "0x" + toHex(keccak256(publicKey.slice(1)).slice(-40)).toLowerCase();
    console.log("Sender address:", sender);

    // Rest of your transaction processing...
    const { recipient, amount } = transaction;

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (amount <= 0) {
      return res.status(400).send({ message: "Amount must be positive" });
    }

    if (balances[sender] < amount) {
      return res.status(400).send({ message: "Not enough funds!" });
    }

    balances[sender] -= amount;
    balances[recipient] += amount;

    res.send({ balance: balances[sender], message: "Transfer successful" });
  } catch (error) {
    console.error("Transaction error:", error);
    res.status(400).send({ message: "Signature verification failed" });
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
