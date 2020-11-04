export interface RedisCallback {
  (err: Error | null, key: string | null, value: any): void
}

export type EnvType = 'prod' | 'staging';

// sleep < failed < pending < createContainer < success
export type PodPhaseList = 'failed' | 'pending' | 'createContainer' | 'success';
export type StorageStatus = 'failed' | 'pending' | 'createStorage' | 'success';

export type ConditionType = 'Initialized' | 'Ready' | 'ContainersReady' | 'PodScheduled';

export type ListenMethodList = 'deploy' | 'redeploy' | 'undeploy'
 | 'createNamespace' | 'deleteNamespace'
 | 'createStorage' | 'deleteStorage'
 | 'createSecret' | 'getContainerLog'
 | 'putStorageToFtp' | 'getStorageFromFtp';

export type workerListenMethod = {
  [type: string]: Function;
};

export type NodeInfo = {
  cpu: number; // m
  memory: number; // Mi
  gpu: number;
}

/* Types for Worker */
/* setClusterStatus */
export type ClusterStatusParams = {
  clusterName: string;
  nodePool: {
    [nodePoolName: string]: {
      gpuType: string,
      osImage: string,
      nodes: {
        [nodeId: string]: {
          capacity: NodeInfo,
          allocatable: NodeInfo,
        }
      }
    }
  };
}

/* setPodStatus */
export type PodStatusParams = {
  podName: string;
  namespaceId: string;
  status: {
    phase: PodPhaseList;
    message?: string;
    startTime?: string;
    condition?: {
      type: ConditionType;
      status: boolean;
      reason?: string;
      message?: string;
    }
  };
}
export type SetPodStatusParams = {
  clusterName: string;
  containerId: string;
  podId: string;
  podStatus: PodStatusParams;
}

/* setStorageStatus */
export type StorageStatusParams = {
  status: StorageStatus;
}
export type SetStorageStatusParams = {
  clusterName: string;
  storageId: string;
  storageStatus: StorageStatusParams;
}

/* getAllContainers */
export type GetAllContainersReturn = {
  [containerId: string]: {
    [podId: string]: {
      updatedAt: number;
      status: PodStatusParams;
    }
  }
} | null;

/* getAllStorages */
export type GetAllStoragesReturn = {
  [storageId: string]: {
    updatedAt: number;
    status: StorageStatusParams;
  }
} | null;

/* Types for Client */
export type RequestReturn<T> = {
  statusCode: string;
  result?: T;
  errMessage?: string;
  updatedAt: number;
}

export type DeployParams = {
  clusterName: string;
  namespaceId: string;
  deployTemplateName?: string;
  containerInfo: {
    imageName: string;
    nodePoolName: string;
    storageSpec?: {
      [storageId: string]: {
        mountPath: string;
      }
    }
    secretSpec?: {
      [secretId: string]: {
        mountPath: string;
      }
    }
    hwSpec: {
      cpu: number;
      memory: number;
      gpu: number;
    }
    replicas?: number;
    command?: string;
    env?: object;
    port: number[];
  }
  maxDuration: number;
  requestTimeout?: number;
  runningTimeout?: number;
}

export type DeployReturn = {
  clusterName: string;
  containerId: string;
  endpoint: {
    [post: string]: string
  };
}

export type RedeployParams = {
  clusterName: string;
  namespaceId: string;
  containerId: string;
  option: {
    port?: number[];
    imageName?: string;
    replicas?: number;
    env?: object;
  }
}

export type UndeployParams = {
  clusterName: string;
  namespaceId: string;
  containerId: string;
}

export type CreateNamespaceParams = {
  clusterName: string;
}

export type CreateNamespaceReturn = {
  namespaceId: string;
}

export type DeleteNamespaceParams = {
  clusterName: string;
  namespaceId: string;
}

export type CreateStorageParams = {
  clusterName: string;
  namespaceId: string;
  capacity: number; // Gi
  isSharedNfs?: {
    ip: string;
    basePath: string;
  }
}

export type CreateStorageReturn = {
  storageId: string;
}

export type DeleteStorageParams = {
  clusterName: string;
  namespaceId: string;
  storageId: string;
  sharedNfs: boolean;
}

export type CreateSecretParams = {
  clusterName: string;
  namespaceId: string;
  name: string;
  type: string;
  data: {
    [key: string]: string
  };
}

export type PutStorageToFtpParams = {
  clusterName: string;
  namespaceId: string;
  storageId: string;
  toStorageId: string;
  timestamp: string;
}

export type GetStorageFromFtpParams = {
  clusterName: string;
  namespaceId: string;
  storageId: string;
  timestamp: string;
}

export type GetContainerLogParams = {
  clusterName: string;
  namespaceId: string;
  containerId: string;
  fromTimestamp?: number;
}
export type GetContainerLogReturn = {
  log: string;
}

/* getClusterList */
export type GetClusterListParams = {
  targetAddress?: string;
  nodeInfo?: {
    cpu: number;
    memory: number;
    gpu?: object;
  }
}
export type GetClusterListReturn = {
  updatedAt: number;
  address: string;
  clusterName: string;
  nodePool: {
    [nodePoolName: string]: {
      gpuType: string,
      osImage: string,
      nodes: {
        [nodeId: string]: NodeInfo,
      }
    }
  };
}

export type StatusGetterReturn<T> = {
  updatedAt: number;
  status: T;
} | null;

/* getClusterStatus */
export type GetClusterStatusParams = {
  targetAddress: string;
  clusterName: string;
}
export type GetClusterStatusReturn = ClusterStatusParams;

/* getContainerStatus */
export type GetContainerStatusParams = {
  targetAddress: string;
  clusterName: string;
  containerId: string;
}
export type GetContainerStatusReturn = {
  containerStatus: PodPhaseList;
} | null;

/* getStorageStatus */
export type GetStorageStatusParams = {
  targetAddress: string;
  clusterName: string;
  storageId: string;
}
export type GetStorageStatusReturn = StorageStatusParams;
