import { GetOptions, TransactionInput } from '@ainblockchain/ain-js/lib/types';
import Connect from './connect';
import * as Types from '../common/types';
import * as Path from '../common/path';

export default class Worker {
  private name: string;
  private appName: string;
  private connect: Connect;

  constructor(
    network: Types.NetworkType | string,
    mnemonic: string,
    name: string,
    appName: string,
  ) {
    this.connect = new Connect(network, mnemonic);
    this.name = name;
    this.appName = appName;
  }

  public register = async (
    params: Types.WorkerRegisterParams,
  ) => {
    const timestamp = Date.now();
    const address = this.connect.getAddress();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerRegisterPath(
          this.appName, this.name, address,
        ),
        value: {
          ...params,
          createdAt: timestamp,
        },
      },
      address,
      timestamp,
    };
    await this.connect.sendTransaction(txInput);
  }

  public terminate = async () => {
    const timestamp = Date.now();
    const address = this.connect.getAddress();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerStatusPath(
          this.appName, this.name, address,
        ),
        value: {
          workerStatus: 'terminated',
          updatedAt: timestamp,
        },
      },
      address,
      timestamp,
    };
    await this.connect.sendTransaction(txInput);
  }

  public updateStatus = async (
    status: Types.WorkerStatusParams,
  ) => {
    if (status.containerInfo) {
      if (Object.keys(status.containerInfo).length !== status.currentNumberOfContainer) {
        throw new Error('Invalid status parameters');
      }
    } else if (status.currentNumberOfContainer !== 0) {
      throw new Error('Invalid status parameters');
    }
    const timestamp = Date.now();
    const address = this.connect.getAddress();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET_VALUE',
        ref: Path.getWorkerStatusPath(
          this.appName, this.name, address,
        ),
        value: {
          ...status,
          updatedAt: timestamp,
        },
      },
      address,
      timestamp,
    };
    await this.connect.sendTransaction(txInput);
  }

  public listenRequestQueue = (
    callback: Types.RequestEventCallback,
    getOptions?: GetOptions,
  ) => {
    const path = Path.getWorkerRequestQueuePath(
      this.appName, this.name, this.connect.getAddress(),
    );
    this.connect.addEventListener(path, async (ref, value) => {
      const requestId = ref.split('/').reverse()[0];
      const responsePath = Path.getUserResponsesPath(this.appName, value.userAinAddress);
      const responseData = await this.connect.get(`${responsePath}/${requestId}`, getOptions);
      if (!responseData) {
        callback(ref, value);
      }
    });
  }

  public sendResponse = async (
    requestId: string,
    requestAddress: string,
    value: Types.SendResponseValue,
  ) => {
    const timestamp = Date.now();
    const txInput: TransactionInput = {
      operation: {
        type: 'SET',
        op_list: [{
          type: 'SET_VALUE',
          ref: `${Path.getUserResponsesPath(
            this.appName, requestAddress,
          )}/${requestId}`,
          value: {
            ...value,
            workerId: `${this.name}@${this.connect.getAddress()}`,
            createdAt: timestamp,
          },
        }, {
          type: 'SET_VALUE',
          ref: `${Path.getWorkerRequestQueuePath(
            this.appName, this.name, requestAddress,
          )}/${requestId}`,
          value: null,
        }],
      },
      address: this.connect.getAddress(),
      timestamp,
    };
    await this.connect.sendTransaction(txInput);
  }

  public removeHandledRequest = async (
    requestId: string,
    requestAddress: string,
  ): Promise<boolean> => {
    const timestamp = Date.now();
    const ref = Path.getUserResponsesPath(this.appName, requestAddress);
    const response = await this.getConnect().get(`${ref}/${requestId}`, { is_global: true });
    if (response) {
      const txInput: TransactionInput = {
        operation: {
          type: 'SET_VALUE',
          ref: `${Path.getWorkerRequestQueuePath(
            this.appName,
            this.name,
            requestAddress,
          )}/${requestId}`,
          value: null,
        },
        address: this.connect.getAddress(),
        timestamp,
      };
      await this.connect.sendTransaction(txInput);
    }
    return false;
  }

  public getRequestQueue = async (
    getOptions?: GetOptions,
  ) => {
    const address = this.connect.getAddress();
    const path = Path.getWorkerRequestQueuePath(
      this.appName, this.name, address,
    );
    const queue = await this.connect.get(path, getOptions);

    return queue;
  }

  public getConnect = () => this.connect;

  public getWorkerId = () => Path.getWorkerId(this.name, this.connect.getAddress());
}
