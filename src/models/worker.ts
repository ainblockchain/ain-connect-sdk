import Wallet from './wallet';
import Firebase from '../common/firebase';
import * as types from '../common/types';
import * as error from '../common/error';

export default class Worker {
  private wallet: Wallet;

  private firebase: Firebase;

  private listenMethodList: types.workerListenMethod;

  constructor(mnemonic: string, env: types.EnvType) {
    this.wallet = new Wallet(mnemonic, env);
    this.firebase = new Firebase(env);
  }

  public async getClusterInfo(clusterName: string) {
    const data = await this.firebase.getInstance().database()
      .ref(`/worker/info/${clusterName}@${this.getAddress()}`)
      .once('value');

    const result = data.val();
    result.endpointConfig = JSON.parse(result.endpointConfig);
    result.nodePool = JSON.parse(result.nodePool);
    return result;
  }

  public async listenClusterInfo(clusterName: string, callback: Function) {
    const dbpath = `/worker/info/${clusterName}@${this.getAddress()}`;
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
    const data = this.wallet.signaturePayload(JSON.stringify(payload));
    const reqMassage = {
      ...data,
      dbpath,
    };
    await this.firebase.getInstance().functions().httpsCallable('sendTransaction')(reqMassage);
  }

  public listenReqeust(clusterName: string, methods: types.workerListenMethod) {
    this.listenMethodList = methods;
    this.firebase.getInstance().database()
      .ref(`/worker/request_queue/${clusterName}@${this.wallet.getAddress()}`)
      .on('child_added', async (data) => {
        const requstId = data.key as string;
        const requestValue = data.val();
        const methodType = requestValue.type as types.ListenMethodList;
        const dbpath = `/worker/request_queue/${clusterName}@${this.wallet.getAddress()}/${requstId}/response`;
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
    await this.writePayload(option, `/worker/info/${option.clusterName}@${this.wallet.getAddress()}`);
  }

  public async updateClusterInfo(clusterName: string, allowAdress?: string[], price?: number) {
    await this.writePayload({
      clusterName,
      allowAdress,
      price,
    }, `/worker/info/${clusterName}@${this.wallet.getAddress()}`);
  }

  public getAddress() {
    return this.wallet.getAddress();
  }
}
