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

  private async awaitResponse(refPath: string) {
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
    const res = await this.awaitResponse(refPath);
    return res;
  }

  public async deploy(params: any) {
    const res = await this.sendRequest('deploy', params);
    return res;
  }

  public async redeploy(params: any) {
    const res = await this.sendRequest('redeploy', params);
    return res;
  }

  public async createStorage(params: any) {
    const res = await this.sendRequest('createStorage', params);
    return res;
  }

  public async deleteStorage(params: any) {
    const res = await this.sendRequest('deleteStorage', params);
    return res;
  }

  public async getContainerConfig(params: any) {
    const res = await this.sendRequest('getContainerConfig', params);
    return res;
  }

  public async getClusterInfo(params: any) {
    const { targetAddress, clusterName } = params;
    const snap = await this.firebase.getDatabase().ref(`/worker/${targetAddress}/${clusterName}/info`).once('value');

    /* TODO: return empty error */
    return snap.val();
  }

  public async getClusterList(params: any) {
    const list: any[] = [];
    /* TODO */
    return list;
  }

  public async getHistory(params: any) {
    const historyList: any[] = [];
    /* TODO */
    return historyList;
  }
}
