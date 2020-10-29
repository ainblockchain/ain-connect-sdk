import { customAlphabet } from 'nanoid';
import Firebase from '../common/firebase';
import Wallet from './wallet';
import * as Types from '../common/types';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private wallet: Wallet;

  private firebase: Firebase;

  private sendTx: any;

  constructor(mnemonic: string, type: Types.EnvType) {
    this.wallet = new Wallet(mnemonic, type);
    this.firebase = new Firebase(type);
    this.sendTx = this.firebase.getFunctions().httpsCallable('sendTransaction');
  }

  private async awaitResponse(refPath: string)
    : Promise<Types.RequestReturn<any>> {
    return new Promise((resolve, reject) => {
      this.firebase.getDatabase().ref(`${refPath}/response`)
        .on('value', (snapshot) => {
          this.firebase.getDatabase().ref(`${refPath}/response`).off();
          resolve(snapshot.val());
        });
    });
  }

  private async sendRequest(type: string, params: any)
    : Promise<Types.RequestReturn<any>> {
    const payload = { type, payload: JSON.stringify(params) };
    const data = this.wallet.signaturePayload(payload);
    const { targetAddress, clusterName } = params;
    const requestId = getRandomRequestId();
    const refPath = `/worker/request_queue/${clusterName}@${targetAddress}/${requestId}`;

    await this.sendTx({ dbpath: refPath, ...data });
    const res = await this.awaitResponse(refPath);
    return res;
  }

  public async deploy(params: Types.DeployParams)
    : Promise<Types.RequestReturn<Types.DeployReturn>> {
    const res = await this.sendRequest('deploy', params);
    return res;
  }

  public async redeploy(params: Types.RedeployParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('redeploy', params);
    return res;
  }

  public async undeploy(params: Types.UndeployParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('undeploy', params);
    return res;
  }

  public async createNamespace(params: Types.CreateStorageParams)
    : Promise<Types.RequestReturn<Types.CreateNamespaceReturn>> {
    const res = await this.sendRequest('createNamespace', params);
    return res;
  }

  public async deleteNamespace(params: Types.DeleteStorageParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('deleteNamespace', params);
    return res;
  }

  public async createStorage(params: Types.CreateStorageParams)
    : Promise<Types.RequestReturn<Types.CreateStorageReturn>> {
    const res = await this.sendRequest('createStorage', params);
    return res;
  }

  public async deleteStorage(params: Types.DeleteStorageParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('deleteStorage', params);
    return res;
  }

  /* Secret */
  public async createSecret(params: Types.CreateSecretParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('createSecret', params);
    return res;
  }

  public async execKubeCtl(params: any) {
    const res = await this.sendRequest('execKubeCtl', params);
    return res;
  }

  public async getClusterList(params?: Types.GetClusterListParams)
    : Promise<Types.GetClusterListReturn[]> {
    const res: Types.GetClusterListReturn[] = [];
    let list;
    const refPath = '/worker/info';
    if (params && params.targetAddress) {
      // filtered by address
      const snap = await this.firebase.getDatabase().ref(refPath)
        .orderByChild('status/address').equalTo(params.targetAddress)
        .once('value');
      list = snap.val();
    } else {
      const snap = await this.firebase.getDatabase().ref(refPath).once('value');
      list = snap.val();
    }

    const clusterKeys = Object.keys(list);
    for (const clusterKey of clusterKeys) {
      const cluster = list[clusterKey];
      const nodePoolIds = Object.keys(cluster.status.nodePool);
      const resultNodePool = {};
      for (const nodePoolId of nodePoolIds) {
        const nodePool = cluster.status.nodePool[nodePoolId];
        // choose proper GPU type when gpu option specified
        if (!params || !params.nodeInfo || !params.nodeInfo.gpu
            || params.nodeInfo.gpu[nodePool.gpuType] !== undefined) {
          const nodeIds = Object.keys(nodePool.nodes);
          const resultNodes = {};
          for (const nodeId of nodeIds) {
            const node = nodePool.nodes[nodeId];
            if (!params || !params.nodeInfo
                || (params.nodeInfo.cpu <= node.allocatable.cpu
                && params.nodeInfo.memory <= node.allocatable.memory
                && (!params.nodeInfo.gpu
                    || params.nodeInfo.gpu[nodePool.gpuType] <= node.allocatable.gpu)
                )) {
              resultNodes[nodeId] = node.allocatable;
            }
          }

          if (Object.keys(resultNodes).length !== 0) {
            resultNodePool[nodePoolId] = {
              gpuType: nodePool.gpuType,
              osImage: nodePool.osImage,
              nodes: resultNodes,
            };
          }
        }
      }

      if (Object.keys(resultNodePool).length !== 0) {
        res.push({
          updatedAt: cluster.updatedAt,
          address: cluster.status.address,
          clusterName: cluster.status.clusterName,
          nodePool: resultNodePool,
        });
      }
    }

    return res;
  }

  public async getClusterStatus(params: Types.GetClusterStatusParams)
    : Promise<Types.StatusGetterReturn<Types.GetClusterStatusReturn>> {
    const { targetAddress, clusterName } = params;
    const snap = await this.firebase.getDatabase().ref(`/worker/info/${clusterName}@${targetAddress}`).once('value');

    if (!snap.exists()) {
      return null;
    }
    return snap.val();
  }

  public async getContainerStatus(params: Types.GetContainerStatusParams)
    : Promise<Types.GetContainerStatusReturn> {
    const { clusterName, targetAddress } = params;
    const statusPath = `/worker/info/${clusterName}@${targetAddress}`;
    const snap = await this.firebase.getDatabase().ref(statusPath).once('value');

    if (!snap.exists()) {
      return null;
    }
    return snap.val();
  }

  public async getStorageStatus(params: Types.GetStorageStatusParams)
    : Promise<Types.StatusGetterReturn<Types.GetStorageStatusReturn>> {
    const { clusterName, targetAddress, storageId } = params;
    const statusPath = `/storage/${clusterName}@${targetAddress}/${storageId}`;
    const snap = await this.firebase.getDatabase().ref(statusPath).once('value');

    if (!snap.exists()) {
      return null;
    }
    return snap.val();
  }
}
