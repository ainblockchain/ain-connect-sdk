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

export type EventCallback = (ref: string, value: any) => void;

export type ContainerSpec = {
  cpu: {
    name: string;
    vcpu: number;
  };
  gpu: {
    name: string;
    memory: number;
    count: number;
  };
  memory: {
    max: number;
  };
  storage: {
    max: number;
  };
  maxNumberOfContainer: number;
}
export type WorkerRegisterLabel = {
  managedBy?: string;
}
export type WorkerRegisterParams = {
  ainAddress: string;
  ethAddress: string;
  containerSpec: ContainerSpec;
  labels?: WorkerRegisterLabel;
}

export type WorkerStatusParams = {
  currentNumberOfContainer: number;
}