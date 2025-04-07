import { useState } from "react";
import server from "./server";

import * as secp from "ethereum-cryptography/secp256k1";
import { toHex, utf8ToBytes } from "ethereum-cryptography/utils";
import { keccak256 } from "ethereum-cryptography/keccak";

function Transfer({ setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    try {
      const transaction = {
        amount: parseInt(sendAmount),
        recipient: recipient,
      };

      // 1. Hash the transaction with sorted keys
      const txString = JSON.stringify(
        transaction,
        Object.keys(transaction).sort()
      );
      const messageHash = toHex(keccak256(utf8ToBytes(txString)));

      // 2. Sign the hash and get compact signature
      const [signature, recoveryBit] = await secp.sign(
        messageHash,
        privateKey,
        {
          recovered: true,
          der: false, // This ensures compact signature (64 bytes)
        }
      );

      const signatureHex = toHex(signature);

      const {
        data: { balance },
      } = await server.post(`send`, {
        signature: signatureHex,
        recoveryBit,
        transaction,
      });
      setBalance(balance);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
