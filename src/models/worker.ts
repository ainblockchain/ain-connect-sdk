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

  public registerJobMethod(methods: {[type: string]: Function}) {
    this.methods = methods;
    const rootRef = this.firebase.getInstance().database()
      .ref(`/worker/${this.wallet.getAddress()}`);
    rootRef
      .on('child_added', (data) => {
        const clusterName = data.key as string;

        const requestRef = this.firebase.getInstance().database()
          .ref(`/worker/${this.wallet.getAddress()}/${clusterName}/request_queue`);
        requestRef
          .on('child_added', async (requestData) => {
            const requstId = requestData.key as string;
            const requestValue = requestData.val();
            if (requestValue.response) {
              return;
            }
            if (this.methods[requestValue.type]) {
              const result = await this.methods[requestValue.type]();
              const resultData = this.wallet.signaturePayload(result);
              const reqMassage = {
                ...resultData,
                dbpath: `/worker/${this.wallet.getAddress()}/${clusterName}/request_queue/${requstId}/response`,
              };
              await this.firebase.getInstance().functions().httpsCallable('sendTransaction')(reqMassage);
            } else {
              const resultData = this.wallet.signaturePayload({
                statusCode: error.STATUS_CODE.invalidParams,
              });
              const reqMassage = {
                ...resultData,
                dbpath: `/worker/${this.wallet.getAddress()}/${clusterName}/request_queue/${requstId}/response`,
              };
              await this.firebase.getInstance().functions().httpsCallable('sendTransaction')(reqMassage);
            }
          });

        this.listenDict[clusterName] = {
          requestRef,
        };
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
    const data = this.wallet.signaturePayload(option);
    const reqMassage = {
      ...data,
      dbpath: `/worker/${this.wallet.getAddress()}/${option.clusterName}/info`,
    };
    const result = await this.firebase.getInstance().functions().httpsCallable('sendTransaction')(reqMassage);

    return result;
  }

  public async updateClusterInfo(clusterName: string, allowAdress?: string[], price?: number) {
    const data = this.wallet.signaturePayload({
      clusterName,
      allowAdress,
      price,
    });
    const reqMassage = {
      ...data,
      dbpath: `/worker/${this.wallet.getAddress()}/${clusterName}/info`,
    };
    const result = await this.firebase.getInstance().functions().httpsCallable('sendTransaction')(reqMassage);

    return result;
  }
}
