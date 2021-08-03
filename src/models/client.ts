import { customAlphabet } from 'nanoid';
import Firebase from './firebase';
import Wallet from './wallet';
import * as Types from '../common/types';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private wallet: Wallet;
  private firebase: Firebase;
  private sendTx: any;

  constructor(type: Types.NetworkType, mnemonic: string) {
    this.wallet = new Wallet().init(type, mnemonic);
    this.firebase = new Firebase(type, this.wallet);
  }

  private async awaitResponse(refPath: string)
    : Promise<Types.RequestReturn<any>> {
    return new Promise((resolve, reject) => {
      this.firebase.getDatabase().ref(`${refPath}/response`)
        .on('value', (snapshot) => {
          if (snapshot.exists()) {
            this.firebase.getDatabase().ref(`${refPath}/response`).off();
            const res = snapshot.val();
            resolve(res);
          }
        });
    });
  }
}
