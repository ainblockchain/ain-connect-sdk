export interface RedisCallback {
  (err: Error | null, key: string | null, value: any): void
}

export type EnvType = 'prod' | 'staging';
export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// sleep < failed < pending < createContainer < success
export type PodPhaseList = 'failed' | 'pending' | 'createContainer' | 'success';
export type StorageStatus = 'failed' | 'pending' | 'createStorage' | 'success';

export type ConditionType = 'Initialized' | 'Ready' | 'ContainersReady' | 'PodScheduled';

export type Condition = {
  type: ConditionType;
  status: boolean;
  reason?: string;
  message?: string;
};

export type ListenMethodList = 'deploy' | 'redeploy' | 'undeploy' | 'runCommand'
 | 'deployForDocker' | 'undeployForDocker'
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

export type ContainerStatusForDocker = {
  status: string;
  image: string;
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
  image: string;
  status: {
    phase: PodPhaseList;
    message?: string;
    startTime?: string;
    condition?: Condition;
  };
}
export type SetPodStatusParams = {
  clusterName: string;
  containerId: string;
  podId: string;
  podStatus: PodStatusParams;
}

/* setContainerStatusForDocker */
export type SetContainerStatusForDocker = {
  clusterName: string;
  containerId: string;
  containerStatus: ContainerStatusForDocker;
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
      params: PodStatusParams;
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

/* getAllContainersForDocker */
export type GetAllContainersForDockerReturn = {
  [containerId: string]: ContainerStatusForDocker;
} | null;

/*
----------------------------------------------------
|                 Types for Client                 |
----------------------------------------------------
*/
export type RequestReturn<T> = {
  statusCode: string;
  result?: T;
  errMessage?: string;
  updatedAt: number;
}

export type StorageSpec = {
  [storageId: string]: {
    mountPath: string;
    subPath?: string;
    readOnly?: 0 | 1;
  }
}

export type RunCommandParams = {
  targetAddress: string;
  clusterName: string;
  cmd: string;
}

export type RunCommandReturn = {
  stdout: string;
  stderr: string;
}

export type DeployParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  deployTemplateName?: string;
  containerInfo: {
    imageName: string;
    nodePoolName: string;
    storageSpec?: StorageSpec;
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
  maxDuration?: number;
  requestTimeout?: number;
  runningTimeout?: number;
  strategy?: 'RollingUpdate' | 'Recreate';
}

export type DeployReturn = {
  targetAddress: string;
  clusterName: string;
  containerId: string;
  endpoint: {
    [post: string]: string
  };
}

export type RedeployParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  containerId: string;
  option: {
    port?: number[];
    imageName?: string;
    replicas?: number;
    env?: object;
    storageSpec?: StorageSpec;
  }
}

export type UndeployParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  containerId: string;
}

/* DeployForDocker */
export type DeployForDockerParams = {
  publishPorts?: { [externalPort: string]: string },
  clusterName: string;
  targetAddress: string;
  image: string;
  env?: {
    [key: string]: string
  };
  command?: string[];
}
export type DeployForDockerReturn = {
  containerId: string;
}

/* UndeployForDocker */
export type UndeployForDockerParams = {
  clusterName: string;
  targetAddress: string;
  containerId: string;
}

export type CreateNamespaceParams = {
  targetAddress: string;
  clusterName: string;
}

export type CreateNamespaceReturn = {
  namespaceId: string;
}

export type DeleteNamespaceParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
}

export type CreateStorageParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  capacity: number; // Gi
  nfsInfo?: {
    server: string;
    path: string;
  }
}

export type CreateStorageReturn = {
  storageId: string;
}

export type DeleteStorageParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  storageId: string;
}

export type CreateSecretParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  name: string;
  type: string;
  data: {
    [key: string]: string
  };
}

export type UpdateContainerStatusParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  containerId: string;
}

export type PutStorageToFtpParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  storageId: string;
  toStorageId: string;
  timestamp: string;
}

export type GetStorageFromFtpParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  storageId: string;
  timestamp: string;
}

export type GetContainerLogParams = {
  targetAddress: string;
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
  isDocker?: boolean;
  nodePool?: {
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
  condition?: Condition;
} | null;

/* getContainerStatusForDocker */
export type GetContainerStatusForDockerParams = {
  clusterName: string;
  targetAddress: string;
  containerId: string;
}
export type GetContainerStatusForDockerReturn = ContainerStatusForDocker | null;

/* getStorageStatus */
export type GetStorageStatusParams = {
  targetAddress: string;
  clusterName: string;
  storageId: string;
}
export type GetStorageStatusReturn = StorageStatusParams;
