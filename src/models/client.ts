import { customAlphabet } from 'nanoid';
import Firebase from '../common/firebase';
import Wallet from './wallet';
import * as types from '../common/types';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private wallet: Wallet;

  private firebase: Firebase;

  private sendTx: any;

  constructor(mnemonic: string, type: types.EnvType) {
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
    const payload = { type, payload: JSON.stringify(params) };
    const data = this.wallet.signaturePayload(payload);
    const { targetAddress, clusterName } = params;
    const requestId = getRandomRequestId();
    const refPath = `/worker/request_queue/${clusterName}@${targetAddress}/${requestId}`;

    await this.sendTx({ dbpath: refPath, ...data });
    const res = await this.awaitResponse(refPath);
    return res;
  }

  public async deploy(params: types.DeployParams) {
    const res = await this.sendRequest('deploy', params);
    return res;
  }

  public async redeploy(params: types.RedeployParams) {
    const res = await this.sendRequest('redeploy', params);
    return res;
  }

  public async undeploy(params: types.UndeployParams) {
    const res = await this.sendRequest('undeploy', params);
    return res;
  }

  public async createNamespace(params: types.CreateStorageParams) {
    const res = await this.sendRequest('createNamespace', params);
    return res;
  }

  public async deleteNamespace(params: types.DeleteStorageParams) {
    const res = await this.sendRequest('deleteNamespace', params);
    return res;
  }

  public async createStorage(params: types.CreateStorageParams) {
    const res = await this.sendRequest('createStorage', params);
    return res;
  }

  public async deleteStorage(params: types.DeleteStorageParams) {
    const res = await this.sendRequest('deleteStorage', params);
    return res;
  }

  public async getContainerInfo(params: types.GetContainerInfoParams) {
    const res = await this.sendRequest('getContainerInfo', params);
    return res;
  }

  public async execKubeCtl(params: any) {
    const res = await this.sendRequest('execKubeCtl', params);
    return res;
  }

  public async getClusterInfo(params: types.GetClusterInfoParams) {
    const { targetAddress, clusterName } = params;
    const snap = await this.firebase.getDatabase().ref(`/worker/info/${clusterName}@${targetAddress}`).once('value');

    if (!snap.exists()) {
      throw Error('Cluster not exists');
    } else {
      return snap.val();
    }
  }

  public async getClusterList(params: types.GetClusterListParams) {
    let list = [];
    const refPath = '/worker/info/';
    if (params.targetAddress) {
      // filtered by address
      const snap = await this.firebase.getDatabase().ref(refPath)
        .orderByChild('address').equalTo(params.targetAddress)
        .once('value');
      list = snap.val();
    } else if (params.clusterOption) {
      // TODO: filtered by options
      const snap = await this.firebase.getDatabase().ref(refPath).once('value');
      list = snap.val();
    } else {
      // no filter
      const snap = await this.firebase.getDatabase().ref(refPath).once('value');
      list = snap.val();
    }
    return list;
  }

  public async getHistory(params: types.GetHistoryParams) {
    const historyList: any[] = [];
    /* TODO */
    return historyList;
  }
}
