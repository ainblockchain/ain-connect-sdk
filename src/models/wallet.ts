declare global {
  interface Window {
    CloudConnect: any;
  }
}

import { mnemonicToSeedSync } from 'bip39';
import * as ainUtil from '@ainblockchain/ain-util';
import AinJS from '@ainblockchain/ain-js';
import { TransactionInput } from '@ainblockchain/ain-js/lib/types';
import HDKey from 'hdkey';

import { NetworkType } from '../common/types';
import { MAINNET_PROVIDER_URL, TESTNET_PROVIDER_URL } from '../common/constants';

export default class Wallet {
  private initialized: boolean = false;
  private wallet: any = null;
  private mnemonic: string;
  private privateKey: string;
  private address: string;
  private ainJs: AinJS;
  private useExtension: boolean = false;
  private connectExtension: any = null;

  public init(type?: NetworkType, mnemonic?: string): Wallet {
    if (!type) {
      // TODO: use AIN Connect Extension
      this.useExtension = true;
      window.addEventListener("scriptLoaded", async (event) => {
        if (window.CloudConnect) {
          this.connectExtension = window.CloudConnect;
          // TODO: Get network type from extension
          this.initialized = true;
        } else {
          // TODO: ERROR
        }
      });
    } else if (mnemonic) {
      this.useExtension = false;
      this.ainJs = new AinJS(type === 'MAINNET' ?
        MAINNET_PROVIDER_URL : TESTNET_PROVIDER_URL);
      const key = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic));
      this.wallet = key.derive("m/44'/412'/0'/0/0"); /* default wallet address for AIN */
      this.mnemonic = mnemonic;
      this.privateKey = `0x${this.wallet.privateKey.toString('hex')}`;
      this.address = ainUtil.toChecksumAddress(`0x${ainUtil.pubToAddress(this.wallet.publicKey, true).toString('hex')}`);

      this.ainJs.wallet.addFromHDWallet(mnemonic);
      this.ainJs.wallet.setDefaultAccount(this.address);

      this.initialized = true;
    } else {
      // ERROR
      throw new Error('Cannot initialize Connect SDK');
    }

    return this;
  }

  public isExtension = () => {
    return this.useExtension;
  }

  public getWallet = () => {
    return this.wallet;
  }

  public getMnemonic = () => {
    return this.mnemonic;
  }

  public getPrivateKey = () => {
    return this.privateKey;
  }

  public getAddress = () => {
    return this.address;
  }

  public getAinJs = () => {
    return this.ainJs;
  }

  /* TransactionInput type
   * {
   *   parent_tx_hash?: string;
   *   operation: {
   *     type: SetOperationType;
   *     ref: string;
   *     value: any | undefined | null;
   *     is_global?: boolean;
   *   }: SetOperation | {
   *     type: SetMultiOperationType;
   *     op_list: SetOperation[];
   *   }: SetMultiOperation 
   *   nonce?: number;
   *   address?: string;
   *   timestamp?: number
   * }
   */
  public sendTransaction = async (txInput: TransactionInput) => {
    if (this.useExtension) {
      // TODO: Update connectExtension sendTransaction
      const res = await this.connectExtension.sendTransaction(txInput);
    } else {
      await this.ainJs.sendTransaction(txInput);
    }
  }
}
