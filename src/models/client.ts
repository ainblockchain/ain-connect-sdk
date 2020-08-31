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

  private async awaitResonse(refPath: string) {
    return new Promise((resolve, reject) => {
      this.firebase.getDatabase().ref(`${refPath}/response`)
        .on('value', (snapshot) => {
          this.firebase.getDatabase().ref(`${refPath}/response`).off();
          resolve(snapshot.val());
        });
    });
  }

  private async sendRequest(type: string, params: any) {
    const data = this.wallet.signaturePayload(params);
    const { clusterAddress, clusterName } = params.payload;
    const requestId = getRandomRequestId();
    const refPath = `/worker/${clusterAddress}/${clusterName}/request_queue/${requestId}`;

    await this.sendTx({ type, dbpath: refPath, ...data });
    const res = await this.awaitResonse(refPath);
    return res;
  }

  public async createResource(params: any) {
    this.sendRequest('createResource', params);
  }

  public async deleteResource(params: any) {
    this.sendRequest('deleteResource', params);
  }

  public async getResourceStatus(params: any) {
    this.sendRequest('getResourceStatus', params);
  }

  public async setResourceConfig(params: any) {
    this.sendRequest('setResourceConfig', params);
  }
}
