import Wallet from './wallet';
import Firebase from '../common/firebase';
import * as Types from '../common/types';
import * as error from '../common/error';

export default class Worker {
  private wallet: Wallet;

  private firebase: Firebase;

  private listenMethodList: Types.workerListenMethod;

  private clusterName: string

  constructor(mnemonic: string, clusterName: string, env: Types.EnvType) {
    this.wallet = new Wallet(mnemonic, env);
    this.clusterName = clusterName;
    this.firebase = new Firebase(env);
  }

  public getAddress() {
    return this.wallet.getAddress();
  }

  public async writeResult(result: any, dbpath: string) {
    const data = this.wallet.signaturePayload({
      payload: JSON.stringify({
        updatedAt: this.firebase.getTimestamp(),
        ...result,
      }),
    });
    const reqMassage = {
      ...data,
      dbpath,
    };
    await this.firebase.getInstance().functions()
      .httpsCallable('sendTransaction')(reqMassage);
  }

  public listenRequest(methods: Types.workerListenMethod) {
    this.listenMethodList = methods;
    this.firebase.getInstance().database()
      .ref(`/worker/request_queue/${this.clusterName}@${this.wallet.getAddress()}`)
      .on('child_added', async (data) => {
        const requestId = data.key as string;
        const value = data.val();
        const methodType = value.type as Types.ListenMethodList;
        const dbpath = `/worker/request_queue/${this.clusterName}@${this.wallet.getAddress()}/${requestId}/response`;
        if (value.response) { // already has response
          return;
        }
        if (this.listenMethodList[methodType]) {
          let result;
          try {
            result = {
              statusCode: error.STATUS_CODE.success,
              result: await this.listenMethodList[methodType](
                value.address, value.payload,
              ),
            };
          } catch (e) {
            result = {
              statusCode: error.STATUS_CODE.failedMethod,
              errMessage: String(e),
            };
          }
          await this.writeResult(result, dbpath);
        } else {
          await this.writeResult({
            statusCode: error.STATUS_CODE.invalidParams,
            errMessage: `Not defined method: ${methodType}`,
          }, dbpath);
        }
      });
  }

  public async deletePath(path: string) {
    const data = this.wallet.signaturePayload({ path });
    await this.firebase.getInstance().functions()
      .httpsCallable('deleteTransaction')(data);
  }

  public async writeStatus(status: object, dbpath: string) {
    const data = this.wallet.signaturePayload({
      payload: JSON.stringify({
        updatedAt: this.firebase.getTimestamp(),
        status,
      }),
    });
    const reqMassage = {
      ...data,
      dbpath,
    };
    await this.firebase.getInstance().functions()
      .httpsCallable('sendTransaction')(reqMassage);
  }

  public async setClusterStatus(status: Types.ClusterStatusParams) {
    const path = `/worker/info/${status.clusterName}@${this.getAddress()}`;
    await this.writeStatus({
      address: this.getAddress(),
      ...status,
    }, path);
  }

  public async deleteClusterStatus(clusterName: string) {
    await this.deletePath(`/worker/info/${clusterName}@${this.getAddress()}`);
  }

  public async setPodStatus(status: Types.SetPodStatusParams) {
    const { clusterName, containerId, podId } = status;
    const key = `/container/${clusterName}@${this.getAddress()}/${containerId}/${podId}`;
    await this.writeStatus(status.podStatus, key);
  }

  public async deletePodStatus(clusterName: string, containerId: string, podId: string) {
    const key = `/container/${clusterName}@${this.getAddress()}/${containerId}/${podId}`;
    await this.deletePath(key);
  }

  public async setStorageStatus(status: Types.SetStorageStatusParams) {
    const key = `/storage/${status.clusterName}@${this.getAddress()}/${status.storageId}`;
    await this.writeStatus(status.storageStatus, key);
  }

  public async deleteStorageStatus(clusterName: string, storageId: string) {
    const key = `/storage/${clusterName}@${this.getAddress()}/${storageId}`;
    await this.deletePath(key);
  }

  public async getAllContainers(clusterName: string)
    : Promise<Types.GetAllContainersReturn> {
    const snap = await this.firebase.getInstance().database()
      .ref(`/container/${clusterName}@${this.getAddress()}`).once('value');
    if (!snap.exists) {
      return null;
    }
    return snap.val();
  }

  public async getAllStorages(clusterName: string)
    : Promise<Types.GetAllStoragesReturn> {
    const snap = await this.firebase.getInstance().database()
      .ref(`/storage/${clusterName}@${this.getAddress()}`).once('value');
    if (!snap.exists) {
      return null;
    }
    return snap.val();
  }
}
