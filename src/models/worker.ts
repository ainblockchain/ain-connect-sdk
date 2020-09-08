import Wallet from './wallet';
import Firebase from '../common/firebase';
import * as types from '../common/types';
import * as error from '../common/error';

export default class Worker {
  private wallet: Wallet;

  private firebase: Firebase;

  private listenMethodList: types.workerListenMethod;

  private clusterName: string

  constructor(mnemonic: string, clusterName: string, env: types.EnvType) {
    this.wallet = new Wallet(mnemonic, env);
    this.clusterName = clusterName;
    this.firebase = new Firebase(env);
  }

  public async writePayload(payload: object, dbpath: string) {
    const data = this.wallet.signaturePayload(JSON.stringify(payload));
    const reqMassage = {
      ...data,
      dbpath,
    };
    await this.firebase.getInstance().functions().httpsCallable('sendTransaction')(reqMassage);
  }

  public listenRequest(methods: types.workerListenMethod) {
    this.listenMethodList = methods;
    this.firebase.getInstance().database()
      .ref(`/worker/request_queue/${this.clusterName}@${this.wallet.getAddress()}`)
      .on('child_added', async (data) => {
        const requstId = data.key as string;
        const requestValue = data.val();
        const methodType = requestValue.type as types.ListenMethodList;
        const dbpath = `/worker/request_queue/${this.clusterName}@${this.wallet.getAddress()}/${requstId}/response`;
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
    await this.writePayload(option, `/worker/info/${this.clusterName}@${this.wallet.getAddress()}`);
  }

  public async updateClusterInfo(
    nodePools?: { [nodePoolName: string] : types.nodePool },
    allowAddressList?: { [address: string]: 0 | 1 },
  ) {
    await this.writePayload({
      nodePools,
      allowAddressList,
    }, `/worker/info/${this.clusterName}@${this.wallet.getAddress()}`);
  }

  public getAddress() {
    return this.wallet.getAddress();
  }
}
