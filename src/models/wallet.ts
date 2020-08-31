import { mnemonicToSeedSync } from 'bip39';
import * as ainUtil from '@ainblockchain/ain-util';

const HDKey = require('hdkey');

export default class Wallet {
  private mnemonic: string;

  private secretKey: string;

  private address: string;

  constructor(mnemonic: string) {
    const key = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic));
    const mainWallet = key.derive("m/44'/412'/0'/0/0"); /* default wallet address for AIN */

    this.mnemonic = mnemonic;
    this.secretKey = `0x${mainWallet.privateKey.toString('hex')}`;
    this.address = ainUtil.toChecksumAddress(`0x${ainUtil.pubToAddress(mainWallet.publicKey, true).toString('hex')}`);
  }

  public getMnemonic() {
    return this.mnemonic;
  }

  public getSecretKey() {
    return this.secretKey;
  }

  public getAddress() {
    return this.address;
  }

  public signaturePayload(payload: object) {
    // Remove undefined data
    const data = JSON.parse(JSON.stringify(payload));
    const fields: ainUtil.Field[] = [];
    Object.keys(data).forEach((name) => {
      fields.push({
        name,
        default: Buffer.from([]),
      });
      if (typeof data[name] === 'object') {
        data[name] = JSON.stringify(data[name]);
      }
    });
    const signature = ainUtil.ecSignMessage(
      ainUtil.serialize(data, fields), ainUtil.toBuffer(this.secretKey),
    );
    return {
      payload: data,
      signature,
      fields,
      address: this.address,
    };
  }
}
