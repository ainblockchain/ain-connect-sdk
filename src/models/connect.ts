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

  static getProviderUrl(type: NetworkType): string {
    switch (type) {
      case NetworkType.MAINNET:
      case NetworkType.TESTNET:
      case NetworkType.DEVNET:
        return Const.PROVIDER_URL[type];
      default:
        throw new Error(`Wrong network type: ${type}`);
    }
  }

  constructor(
    type: NetworkType,
    mnemonic: string,
    useFirebase?: boolean, // XXX: temporary param
  ) {
    this.ainJs = new AinJS(Connect.getProviderUrl(type));
    this.mnemonic = mnemonic;
    this.fbMode = useFirebase || false;
    this.ainJs.wallet.addFromHDWallet(mnemonic);

    this.changeNetwork(type);
    this.changeAccount(0);
  }

  public changeAccount = (index: number) => {
    const walletInfo = Connect.getWalletInfo(this.mnemonic, index);
    this.wallet = walletInfo.wallet;
    this.privateKey = walletInfo.privateKey;
    this.address = walletInfo.address;

    this.ainJs.wallet.setDefaultAccount(this.address);
  }

  public changeNetwork = (type: NetworkType) => {
    this.ainJs.setProvider(Connect.getProviderUrl(type));
    if (this.fbMode) {
      const apps = firebase.apps.map((value) => value.name);
      if (apps.includes(type)) {
        this.app = firebase.app(type);
      } else {
        const fbConfig = Const.FIREBASE_CONFIG[type];
        this.app = firebase.initializeApp(fbConfig, type);
      }
    }
  }

  public sendTransaction = async (txInput: TransactionInput) => {
    if (this.fbMode) {
      const fbTxInput: TransactionInput = { ...txInput, nonce: -1 };
      const txBody = await this.ainJs.buildTransactionBody(fbTxInput);
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
        // TODO: transfer TX 같은 경우, balance 부족으로 실패해도 tx hash가 생성된다.
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
      return res.result;
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
