import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/functions';
import 'firebase/storage';
import { TransactionInput } from '@ainblockchain/ain-js/lib/types';
import { mnemonicToSeedSync } from 'bip39';
import {
  toChecksumAddress,
  pubToAddress,
} from '@ainblockchain/ain-util';
import AinJS from '@ainblockchain/ain-js';
import HDKey from 'hdkey';
import * as Const from '../common/constants';
import { NetworkType, EventCallback } from '../common/types';

export default class Connect {
  private _initialized: boolean = false;
  private app: firebase.app.App;
  private wallet: HDKey;
  private mnemonic: string;
  private privateKey: string;
  private address: string;
  private ainJs: AinJS;
  private fbMode: boolean; // XXX: temporary property

  static getWalletInfo(mnemonic: string, index: number) {
    const key = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic));
    const wallet = key.derive(`m/44'/412'/0'/0/${index}`);
    return {
      wallet,
      privateKey: `0x${wallet.privateKey.toString('hex')}`,
      address: toChecksumAddress(
        `0x${pubToAddress(wallet.publicKey, true).toString('hex')}`,
      ),
    };
  }

  static getProviderUrl(type: NetworkType, port?: number): string {
    const portStr = port ? `:${port}` : '';
    switch (type) {
      case NetworkType.MAINNET:
      case NetworkType.DEVNET:
      case NetworkType.TESTNET:
        return Const.PROVIDER_URL[type];
      case NetworkType.LOCAL:
      default:
        return `${Const.PROVIDER_URL[type]}${portStr}`;
    }
  }

  constructor(
    type: NetworkType,
    mnemonic: string,
    port?: number,
    useFirebase?: boolean, // XXX: temporary param
  ) {
    const firebaseConfig = Const.FIREBASE_CONFIG[type];
    if (!firebase.apps.includes[type]) {
      this.app = firebase.initializeApp(firebaseConfig, type);
    } else {
      this.app = firebase.app(type);
    }

    this.ainJs = new AinJS(Connect.getProviderUrl(type, port));
    const walletInfo = Connect.getWalletInfo(mnemonic, 0);
    this.wallet = walletInfo.wallet;
    this.mnemonic = mnemonic;
    this.privateKey = walletInfo.privateKey;
    this.address = walletInfo.address;
    this.fbMode = useFirebase || false;

    this.ainJs.wallet.addFromHDWallet(mnemonic);
    this.ainJs.wallet.setDefaultAccount(this.address);
    this._initialized = true;
  }

  public changeAccount = (index: number) => {
    if (!this._initialized) {
      throw new Error('Connect SDK not initialized');
    }
    const walletInfo = Connect.getWalletInfo(this.mnemonic, index);
    this.wallet = walletInfo.wallet;
    this.privateKey = walletInfo.privateKey;
    this.address = walletInfo.address;
  }

  public changeNetwork = (type: NetworkType, port?: number) => {
    const firebaseConfig = Const.FIREBASE_CONFIG[type];
    if (!firebase.apps.includes[type]) {
      this.app = firebase.initializeApp(firebaseConfig, type);
    } else {
      this.app = firebase.app(type);
    }
    this.ainJs.setProvider(Connect.getProviderUrl(type, port));
  }

  public sendTransaction = async (txInput: TransactionInput) => {
    const txBody = await this.ainJs.buildTransactionBody(txInput);
    if (this.fbMode) {
      const signature = this.ainJs.wallet.signTransaction(txBody);

      const result = await this.app.functions()
        .httpsCallable('sendSignedTransaction')({
          signature,
          tx_body: txBody,
        });

      if (result.data && result.data.error_message) {
        throw Error(`[code:${result.data.code}]: ${result.data.error_message}`);
      }
      return result;
    } else {
      const result = await this.ainJs.sendTransaction(txInput);
      if (result.code) {
        /* result: { code: 'ERROR_CODE', message: 'ERROR_MESSAGE' } */
        throw Error(`[code:${result.code}]: ${result.message}`);
      } else {
        /* result: { result: any, tx_hash: 'TX_HASH' } */
        return result;
      }
    }
  }

  public addEventListener = (
    path: string,
    callback: EventCallback,
  ) => {
    if (this.fbMode) {
      // TODO: 처리된 event들에 대해선 callback 발생하지 않도록
      this.app.database().ref(path).on('child_added',
        async (snap) => {
          await callback(`${path}/${snap.key}`, snap.val());
        });
    } else {
      // TODO
    }
  }

  public get = async (path: string) => {
    if (this.fbMode) {
      const snap = await this.app.database().ref(path).once('value');
      return snap.val();
    } else {
      const res = await this.ainJs.db.ref(path).getValue();
      return res;
    }
  }

  public set = async (path: string, value: any) => {
    if (this.fbMode) {
      await this.app.database().ref(path).set(value);
    } else {
      await this.ainJs.db.ref(path).setValue({ value });
    }
  }

  public getWallet = () => this.wallet;
  public getMnemonic = () => this.mnemonic;
  public getPrivateKey = () => this.privateKey;
  public getAddress = () => this.address;
  public getAinJs = () => this.ainJs;
  public getApp = () => this.app;
}
