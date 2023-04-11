import { Crypto } from "node-webcrypto-p11";

export const crypto = new Crypto({
  library: "/usr/local/lib/softhsm/libsofthsm2.so",
  name: "SoftHSM2",
  slot: 0,
  pin: "12345",
  readWrite: true,
});

process.on("exit", () => {
  crypto.close();
});
