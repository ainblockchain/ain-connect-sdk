export type ListenMethodList = 'createResource' | 'deleteResource' | 'getResourceStatus' | 'setResourceConfig';

export type workerListenMethod = {
  [type in ListenMethodList]: Function;
};

export type ClusterRegisterParams = {
  clusterName: string;
  clusterTitle: string;
  clusterDescription: string;
  isSingleNode: 0 | 1;
  isPrivate: 0 | 1;
  allowAddressList?: string[]
  endpointConfig: {
    https: 0 | 1;
    domainName?: string
    ip?: string
    istio: 0 | 1;
  }
  nodePool: {
    nodePoolName: string
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
}

export type CreateResourceParams = {
  workerAddress: string;
  clusterName: string;
  type: 'deploy' | 'redeploy' | 'storage';
  deployTemplateName?: string
  selectClusterOption?: {
    isSingleNode: boolean;
    isPrivate: boolean;
    https: boolean;
    istio: boolean;
    hwSpec: {
      isGpu?: boolean;
      isStorage?: boolean;
    };
  }
  containerInfo: {
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
  requestTimeout?: number;
  runningTimeout?: number;
}

export type CreateResourceReturn = {
  statusCode: number;
  containerId: string;
  storageId?: string;
  endpoint?: string;
}

export type DeleteResourceParams = {
  workerAddress: string;
  clusterName: string;
  type: 'deploy' | 'storage';
  id: string;
}

export type GetResourceStatusParams = {
  workerAddress: string;
  clusterName: string;
  type: 'deploy' | 'storage';
  id: string;
}

export type GetResourceStatusReturn = {
  statusCode: number
  containerInfo?: {
    containerImage: string
    port: object;
    env: object;
    command: string;
  }
  resourceStatus: number;
}

export type SetResourceConfigParams = {
  workerAddress: string;
  clusterName: string;
  containerId: string;
  config: {
    port?: object;
    replicas?: number;
    env?: object;
  }
}

export type GetClusterInfoParams = {
  workerAddress?: string;
  workerName?: string;
  clusterName?: string
  option: {
    isSingleNode: boolean
    isPrivate: boolean
    https: boolean
    istio: boolean
    hwSpec: {
      isGpu?: boolean
      isStorage?: boolean
    }
  }
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
