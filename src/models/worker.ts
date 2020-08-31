import Wallet from './wallet';
import Firebase, { EnvType } from '../common/firebase';
import * as types from '../common/types';

export default class Worker {
  private wallet: Wallet;

  private firebase: Firebase;

  constructor(mnumonic: string, env: EnvType) {
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
