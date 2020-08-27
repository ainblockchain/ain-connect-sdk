import { customAlphabet } from 'nanoid';
import Firebase from '../common/firebase';
import Wallet from './wallet';
import { EnvType } from '../common/types';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private wallet: Wallet;

  private firebase: Firebase;

  private sendTx: any;

  constructor(mnemonic: string, type: EnvType) {
    this.wallet = new Wallet(mnemonic, type);
    this.firebase = new Firebase(type);
    this.sendTx = this.firebase.getFunctions().httpsCallable('sendTransaction');
  }

  public async createResource(params: any, callback: any) {
    const data = this.wallet.signaturePayload(params);
    const { targetAddress, targetClusterName } = params.payload;
    const requestId = getRandomRequestId();
    const refPath = `/worker/${targetAddress}/${targetClusterName}/request_queue/${requestId}`;
    await this.sendTx({ dbpath: refPath, ...data });
    this.firebase.getDatabase().ref(`${refPath}/response`)
      .on('value', (snapshot) => {
        this.firebase.getDatabase().ref(`${refPath}/response`).off();
        callback(snapshot.val());
      });
  }
}
