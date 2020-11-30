import { customAlphabet } from 'nanoid';
import Firebase from '../common/firebase';
import Wallet from './wallet';
import * as Types from '../common/types';

const PodPhasePriority = {
  failed: 1,
  pending: 2,
  createContainer: 3,
  success: 4,
};

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private wallet: Wallet;

  private firebase: Firebase;

  private sendTx: any;

  constructor(mnemonic: string, env: Types.EnvType, config?: Types.FirebaseConfig) {
    this.wallet = new Wallet(mnemonic, env);
    this.firebase = new Firebase(env, config);
    this.sendTx = this.firebase.getFunctions().httpsCallable('sendTransaction');
  }

  private async awaitResponse(refPath: string)
    : Promise<Types.RequestReturn<any>> {
    return new Promise((resolve, reject) => {
      this.firebase.getDatabase().ref(`${refPath}/response`)
        .on('value', (snapshot) => {
          if (snapshot.exists()) {
            this.firebase.getDatabase().ref(`${refPath}/response`).off();
            const res = snapshot.val();
            resolve(res);
          }
        });
    });
  }

  private async sendRequest(type: string, params: any)
    : Promise<Types.RequestReturn<any>> {
    const payload = {
      type,
      payload: params,
      address: this.wallet.getAddress(),
      updatedAt: this.firebase.getTimestamp(),
    };
    const data = this.wallet.signaturePayload({
      payload: JSON.stringify(payload),
    });
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

  public async createNamespace(params: Types.CreateNamespaceParams)
    : Promise<Types.RequestReturn<Types.CreateNamespaceReturn>> {
    const res = await this.sendRequest('createNamespace', params);
    return res;
  }

  public async deleteNamespace(params: Types.DeleteNamespaceParams)
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

  /* FTP */
  public async putStorageToFtp(params: Types.PutStorageToFtpParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('putStorageToFtp', params);
    return res;
  }

  public async getStorageFromFtp(params: Types.GetStorageFromFtpParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('getStorageFromFtp', params);
    return res;
  }

  /* Container Log */
  public async getContainerLog(params: Types.GetContainerLogParams)
    : Promise<Types.RequestReturn<Types.GetContainerLogReturn>> {
    const res = await this.sendRequest('getContainerLog', params);
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
      const nodePoolIds = Object.keys(cluster.params.nodePool || {});
      const resultNodePool = {};
      for (const nodePoolId of nodePoolIds) {
        const nodePool = cluster.params.nodePool[nodePoolId];
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
          address: cluster.params.address,
          clusterName: cluster.params.clusterName,
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
    const { clusterName, targetAddress, containerId } = params;
    const statusPath = `/container/${clusterName}@${targetAddress}/${containerId}`;
    const snap = await this.firebase.getDatabase().ref(statusPath).once('value');

    if (!snap.exists()) {
      return null;
    }

    const podIds = Object.keys(snap.val());
    if (podIds.length === 0) {
      return null;
    }

    let curStatus: Types.PodPhaseList = 'failed';
    for (const podId of podIds) {
      const pod = snap.val()[podId];
      const podStatus = pod.params.status.phase;
      if (PodPhasePriority[curStatus] < PodPhasePriority[podStatus]) {
        curStatus = podStatus;
      }
    }

    return { containerStatus: curStatus };
  }

  public async getContainerStatusForDocker(params: Types.GetContainerStatusForDockerParams)
    : Promise<Types.GetContainerStatusForDockerReturn> {
    const { clusterName, targetAddress, containerId } = params;
    const statusPath = `/container/${clusterName}@${targetAddress}/${containerId}`;
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
