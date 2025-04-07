import server from "./server";

import * as secp from "ethereum-cryptography/secp256k1";
import { toHex } from "ethereum-cryptography/utils";
import { keccak256 } from "ethereum-cryptography/keccak";

function Wallet({
  address,
  setAddress,
  balance,
  setBalance,
  privateKey,
  setPrivateKey,
}) {
  async function onChange(evt) {
    const privateKey = evt.target.value;
    setPrivateKey(privateKey);
    const publicKey = secp.getPublicKey(privateKey);
    const address =
      "0x" + toHex(keccak256(publicKey.slice(1)).slice(-40)).toLowerCase();
    setAddress(address);
    if (address) {
      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      alert("Please enter a valid private key");
    }
  }

  return (
    <div className="container wallet">
      <h1>Private key</h1>

      <label>
        Private key
        <input
          placeholder="Type your private key,"
          value={privateKey}
          onChange={onChange}
        ></input>
      </label>
      <div>
        {address && <p>Address : {address.slice(0, 15)}....</p>}
        {address && (
          <p>
            Public Key : {toHex(secp.getPublicKey(privateKey)).slice(0, 10)}....
          </p>
        )}
      </div>

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
