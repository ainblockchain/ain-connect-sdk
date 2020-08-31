import Wallet from './wallet';
import Firebase, { EnvType } from '../common/firebase';
import * as types from '../common/types';
import * as error from '../common/error';

export default class Worker {
  private wallet: Wallet;

  private firebase: Firebase;

  private listenMethodList: types.workerListenMethod;

  constructor(mnumonic: string, env: EnvType) {
    this.wallet = new Wallet(mnumonic);
    this.firebase = new Firebase(env);
  }

  public async getClusterInfo(clusterName: string) {
    const data = await this.firebase.getInstance().database()
      .ref(`/worker/${this.getAddress()}/${clusterName}/info`)
      .once('value');
    return data;
  }

  public async listenClusterInfo(clusterName: string, callback: Function) {
    const dbpath = `/worker/${this.getAddress()}/${clusterName}/info`;
    this.firebase.getInstance().database()
      .ref(dbpath)
      .on('child_changed', (data) => {
        callback(data.val() as types.ClusterRegisterParams);
      });
  }

  public async sendResponse(payload: object, dbpath: string) {
    const data = this.wallet.signaturePayload(payload);
    const reqMassage = {
      ...data,
      dbpath,
    };
    await this.firebase.getInstance().functions().httpsCallable('sendTransaction')(reqMassage);
  }

  public listenReqeust(clusterName: string, methods: types.workerListenMethod) {
    this.listenMethodList = methods;
    this.firebase.getInstance().database()
      .ref(`/worker/${this.wallet.getAddress()}/${clusterName}/request_queue`)
      .on('child_added', async (data) => {
        const requstId = data.key as string;
        const requestValue = data.val();
        const methodType = requestValue.type as types.ListenMethodList;
        const dbpath = `/worker/${this.wallet.getAddress()}/${clusterName}/request_queue/${requstId}/response`;
        if (requestValue.response) {
          return;
        }
        if (this.listenMethodList[requestValue.type]) {
          const result = await this.listenMethodList[methodType](requestValue);
          await this.sendResponse(result, dbpath);
        } else {
          await this.sendResponse({
            statusCode: error.STATUS_CODE.invalidParams,
          }, dbpath);
        }
      });
  }

  public async registerCluster(option: types.ClusterRegisterParams) {
    await this.sendResponse(option, `/worker/${this.wallet.getAddress()}/${option.clusterName}/info`);
  }

  public async updateClusterInfo(clusterName: string, allowAdress?: string[], price?: number) {
    await this.sendResponse({
      clusterName,
      allowAdress,
      price,
    }, `/worker/${this.wallet.getAddress()}/${clusterName}/info`);
  }

  public getAddress() {
    return this.wallet.getAddress();
  }
}
