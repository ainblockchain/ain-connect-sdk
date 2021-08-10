import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { TransactionInput } from '@ainblockchain/ain-js/lib/types';

import Wallet from './wallet';
import * as Const from '../common/constants';
import * as Types from '../common/types';

export default class Firebase {
  private instance: firebase.app.App;
  private endpoint: string;
  private wallet: Wallet;

  constructor(type: Types.NetworkType, wallet: Wallet) {
    const firebaseConfig = (type === 'MAINNET')
      ? Const.MAINNET_FIREBASE_CONFIG
      : Const.TESTNET_FIREBASE_CONFIG;
    this.instance = firebase.initializeApp(firebaseConfig);
    this.endpoint = (type === 'MAINNET')
      ? Const.MAINNET_FIREBASE_ENDPOINT
      : Const.TESTNET_FIREBASE_ENDPOINT;
  }

  public getInstance(): firebase.app.App {
    return this.instance;
  }

  public getDatabase(): firebase.database.Database {
    return this.instance.database();
  }

  public sendTransaction = async (txInput: TransactionInput) => {
    let signedTx = {};
    if (this.wallet.isExtension()) {
      // TODO: get signed tx through extension
    } else {
      const ainJs = this.wallet.getAinJs();
      const txBody = await ainJs.buildTransactionBody(txInput);
      const signature = ainJs.wallet.signTransaction(txBody);
      signedTx = {
        signature,
        tx_body: txBody,
      };
    }
    await this.instance.functions()
      .httpsCallable('sendSignedTransaction')(signedTx);
  }

  public addEventListener = (
    path: string,
    callback: Types.EventCallback,
  ) => {
    // TODO: event type?
    // TODO: 처리된 event들에 대해선 callback 발생하지 않도록
    this.instance.database().ref(path).on('child_added',
      (snap) => callback(`${path}/${snap.key}`, snap.val()));
  }

  public get = async (path: string) => {
    const snap = await this.instance.database().ref(path).once('value');
    return snap.val();
  }
}
