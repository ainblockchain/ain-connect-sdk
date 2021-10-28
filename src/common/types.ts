export type NetworkType = 'MAINNET' | 'TESTNET';

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

export type ContainerSpec = {
  cpu: {
    name: string;
    vcpu: number;
  };
  gpu: {
    name: string;
    memoryGB: number;
    count: number;
  } | null;
  memory: {
    maxGB: number;
  };
  storage: {
    maxGB: number;
  };
  maxNumberOfContainer: number;
}

export type WorkerRegisterLabel = {
  [key: string]: string;
}

export type WorkerRegisterParams = {
  ethAddress: string;
  containerSpec: ContainerSpec | null;
  labels: WorkerRegisterLabel | null;
}

export type WorkerInfo = {
  [workerId: string]: WorkerRegisterParams;
}

export type WorkerStatusParams = {
  currentNumberOfContainer: number;
  containerInfo: {
    [containerId: string]: {
      status: string;
      exitCode?: number;
      imagePath: string;
      ports: number[];
    };
  },
}

export type EventCallback = (ref: string, value: any) => void;

export type SendRequestValue = {
  requestType: string;
  params: any;
}

export type ListenRequestQueueValue = SendRequestValue & { userAinAddress: string };

export type RequestEventCallback = (ref: string, value: ListenRequestQueueValue) => void;

export type SendResponseValue = {
  data?: any,
  errorMessage?: string,
}

export type ListenResponseQueueValue = SendResponseValue & { workerId: string };

export type ResponseEventCallback = (ref: string, value: ListenResponseQueueValue) => void;
