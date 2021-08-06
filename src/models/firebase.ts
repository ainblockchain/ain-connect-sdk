import Axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { TransactionInput } from '@ainblockchain/ain-js/lib/types';

import Wallet from './wallet';
import * as constants from '../common/constants';
import * as Types from '../common/types';

export default class Firebase {
  private instance: firebase.app.App;
  private endpoint: string;
  private wallet: Wallet;

  constructor(type: Types.NetworkType, wallet: Wallet) {
    const firebaseConfig = (type === 'MAINNET') ?
        constants.MAINNET_FIREBASE_CONFIG :
        constants.TESTNET_FIREBASE_CONFIG;
    this.instance = firebase.initializeApp(firebaseConfig);
    this.endpoint = (type === 'MAINNET') ?
        'https://' :
        'https://us-central1-gpt2-ainetwork.cloudfunctions.net';
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
    callback: Types.EventCallback
  ) => {
    // TODO: event type?
    this.instance.database().ref(path).on('child_added',
      (snap) => callback(`${path}/${snap.key}`, snap.val()));
  }

  public get = async (path: string) => {
    return await this.instance.database().ref(path).once('value');
  }
}
