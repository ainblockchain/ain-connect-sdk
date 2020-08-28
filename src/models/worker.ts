import Wallet from './wallet';
import Firebase, { EnvType } from '../common/firebase';
import * as types from '../common/types';
import * as error from '../common/error';

export default class Worker {
  private wallet: Wallet;

  private firebase: Firebase;

  private methods: {[type: string]: Function};

  private listenDict: {[clusterName: string]: {
    requestRef: any,
  }}

  constructor(mnumonic: string, env: EnvType) {
    this.listenDict = {};
    this.wallet = new Wallet(mnumonic);
    this.firebase = new Firebase(env);
  }

  public async sendResponse(payload: object, dbpath: string) {
    const data = this.wallet.signaturePayload(payload);
    const reqMassage = {
      ...data,
      dbpath,
    };
    await this.firebase.getInstance().functions().httpsCallable('sendTransaction')(reqMassage);
  }

  public listenReqeust(methods: {[type: string]: Function}) {
    this.methods = methods;
    const rootRef = this.firebase.getInstance().database()
      .ref(`/worker/${this.wallet.getAddress()}`);
    rootRef
      .on('child_added', (data) => {
        const clusterName = data.key as string;

        const requestRef = this.firebase.getInstance().database()
          .ref(`/worker/${this.wallet.getAddress()}/${clusterName}/request_queue`);
        this.listenDict[clusterName] = {
          requestRef,
        };

        requestRef
          .on('child_added', async (requestData) => {
            const requstId = requestData.key as string;
            const requestValue = requestData.val();
            const dbpath = `/worker/${this.wallet.getAddress()}/${clusterName}/request_queue/${requstId}/response`;
            if (requestValue.response) {
              return;
            }
            if (this.methods[requestValue.type]) {
              const result = await this.methods[requestValue.type](requestValue);
              await this.sendResponse(result, dbpath);
            } else {
              await this.sendResponse({
                statusCode: error.STATUS_CODE.invalidParams,
              }, dbpath);
            }
          });
      });

    rootRef
      .on('child_removed', (data) => {
        const clusterName = data.key as string;
        if (this.listenDict[clusterName]) {
          this.listenDict[clusterName].requestRef.onDisconnect();
          delete this.listenDict[clusterName];
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
}
