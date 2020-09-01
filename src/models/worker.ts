import Wallet from './wallet';
import Firebase, { EnvType } from '../common/firebase';
import * as types from '../common/types';
import * as error from '../common/error';

export default class Worker {
  private wallet: Wallet;

  private firebase: Firebase;

  private listenMethodList: types.workerListenMethod;

  constructor(mnemonic: string, env: EnvType) {
    this.wallet = new Wallet(mnemonic);
    this.firebase = new Firebase(env);
  }

  public async getClusterInfo(clusterName: string) {
    const data = await this.firebase.getInstance().database()
      .ref(`/worker/info/${this.getAddress()}@${clusterName}`)
      .once('value');

    const result = data.val();
    result.endpointConfig = JSON.parse(result.endpointConfig);
    result.nodePool = JSON.parse(result.nodePool);
    return result;
  }

  public async listenClusterInfo(clusterName: string, callback: Function) {
    const dbpath = `/worker/info/${this.getAddress()}@${clusterName}`;
    this.firebase.getInstance().database()
      .ref(dbpath)
      .on('child_changed', (data) => {
        const { key } = data;
        let value = data.val();
        if (key === 'endpointConfig' || key === 'nodePool') {
          value = JSON.parse(value);
        }
        callback(key, value);
      });
  }

  public async writePayload(payload: object, dbpath: string) {
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
      .ref(`/worker/request_queue/${this.wallet.getAddress()}@${clusterName}`)
      .on('child_added', async (data) => {
        const requstId = data.key as string;
        const requestValue = data.val();
        const methodType = requestValue.type as types.ListenMethodList;
        const dbpath = `/worker/request_queue/${this.wallet.getAddress()}@${clusterName}/${requstId}/response`;
        if (requestValue.response) {
          return;
        }
        if (this.listenMethodList[requestValue.type]) {
          const result = await this.listenMethodList[methodType](requestValue);
          await this.writePayload(result, dbpath);
        } else {
          await this.writePayload({
            statusCode: error.STATUS_CODE.invalidParams,
          }, dbpath);
        }
      });
  }

  public async registerCluster(option: types.ClusterRegisterParams) {
    await this.writePayload(option, `/worker/info/${this.wallet.getAddress()}@${option.clusterName}`);
  }

  public async updateClusterInfo(clusterName: string, allowAdress?: string[], price?: number) {
    await this.writePayload({
      clusterName,
      allowAdress,
      price,
    }, `/worker/info/${this.wallet.getAddress()}@${clusterName}`);
  }

  public getAddress() {
    return this.wallet.getAddress();
  }
}
