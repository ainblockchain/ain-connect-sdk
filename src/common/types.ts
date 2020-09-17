export type EnvType = 'prod' | 'staging';

export type ListenMethodList = 'deploy' | 'redeploy' | 'undeploy'
 | 'createNamespace' | 'deleteNamespace'
 | 'createStorage' | 'deleteStorage'
 | 'getContainerInfo' | 'getClusterInfo';

export type workerListenMethod = {
  [type in ListenMethodList]: Function;
};

export type endpointConfig = {
  https: 0 | 1;
  domainName?: string
  ip?: string
  istio: 0 | 1;
}

export type nodePool = {
  hwConfig: {
    gpu: 0 | 1;
    storage: 0 | 1;
  }
  priceConfig: {
    cpuPerCore: number;
    memoryPerGb: number;
    gpu: number;
    storagePerGb: number;
  }
}

export type selectClusterOption = {
  isSingleNode: boolean;
  isPrivate: boolean;
  https: boolean;
  istio: boolean;
  hwSpec: {
    isGpu?: boolean;
    isStorage?: boolean;
  };
}

export type containerInfo = {
  imageName: string;
  nodePoolName?: string;
  storageId?: string;
  imageRegistryLoginInfo?: {
    url: string;
    id: string;
    pw: string;
  };
  hwSpec: {
    cpuPerCore: number;
    memoryPerGb: number;
    gpu: number;
    storagePerGb?: number;
  }
  replicas?: number;
  command?: string;
  env?: object;
  port: object;
}

export type ClusterRegisterParams = {
  address: string;
  clusterName: string;
  clusterTitle: string;
  clusterDescription: string;
  clusterType: 'k8s' | 'docker';
  isPrivate: 0 | 1;
  allowAddressList?: {
    [address: string]: 0 | 1,
  };
  endpointConfig: endpointConfig;
  nodePools: {
    [nodePoolName: string] : nodePool,
  };
}

export type DeployParams = {
  targetAddress?: string;
  clusterName?: string;
  deployTemplateName?: string
  selectClusterOption?: selectClusterOption;
  containerInfo: containerInfo;
  requestTimeout?: number;
}

export type DeployReturn = {
  statusCode: number
  targetAddress: string
  clusterName: string
  containerId: string
  endpoint: string
  storageId?: string
}

export type RedeployParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  containerId: string;
  option?: {
    port?: object;
    replicas?: number;
    env?: object;
  }
}

export type UndeployParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  containerId: string;
}

export type CreateNamespaceParams = {
  targetAddress: string;
  clusterName: string;
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
  storagePerGb: number;
}

export type CreateStorageReturn = {
  statusCode: number;
  storageId: string;
}

export type DeleteStorageParams = {
  targetAddress: string;
  clusterName: string;
  namespaceId: string;
  storageId: string;
}

export type GetContainerInfoParams = {
  targetAddress: string;
  clusterName: string;
  containerId: string;
}

export type GetContainerInfoReturn = {
  statusCode: number
  containerImage: string
  port: object;
  env?: object;
  command?: string;
  resourceStatus: number;
}

export type GetClusterInfoParams = {
  targetAddress: string;
  clusterName: string;
}

export type GetClusterInfoReturn = {
  statusCode: number;
  clusterInfo: ClusterRegisterParams;
}

export type GetClusterListParams = {
  targetAddress?: string;
  clusterOption?: selectClusterOption;
}

export type GetClusterListReturn = {
  statusCode: number;
  clusterInfo: ClusterRegisterParams[];
}

export type GetHistoryParams = {
  address: string;
}

export type GetHistoryReturn = {
  createdAt: string;
  finishedAt: string;
  requestId: string;
  clusterName: string;
  workerAdress: string;
  price: number;
  statusCode: number;
  reverseAmount: string;
}
