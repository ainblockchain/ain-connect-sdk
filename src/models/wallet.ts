import { mnemonicToSeedSync } from 'bip39';
import * as ainUtil from '@ainblockchain/ain-util';
import AinJS from '@ainblockchain/ain-js';
import HDKey from 'hdkey';

import { EnvType } from '../common/types';
import { MAINNET_PROVIDER_URL, TESTNET_PROVIDER_URL } from '../common/constants';

export default class Wallet {
  private mnemonic: string;

  private secretKey: string;

  private address: string;

  private ainJs: AinJS;

  constructor(mnemonic: string, type: EnvType) {
    const key = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic));
    const mainWallet = key.derive("m/44'/412'/0'/0/0"); /* default wallet address for AIN */

    this.mnemonic = mnemonic;
    this.secretKey = `0x${mainWallet.privateKey.toString('hex')}`;
    this.address = ainUtil.toChecksumAddress(`0x${ainUtil.pubToAddress(mainWallet.publicKey, true).toString('hex')}`);
    this.ainJs = new AinJS(type === 'prod' ? MAINNET_PROVIDER_URL : TESTNET_PROVIDER_URL);
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

  public getAinJs() {
    return this.ainJs;
  }

  public signaturePayload(payload: string) {
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
