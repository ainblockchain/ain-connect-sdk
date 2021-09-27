export const ROOT_PATH = '/workers';

export const WORKER_LIST_PATH = `${ROOT_PATH}/list`;

const PREFIX_PATH = '/apps/collaborative_ai';

export const getWorkerId = (name: string, address: string) => `${name}@${address}`;

export const getWorkerStatusPath = (
  name: string,
  address: string,
) => `${WORKER_LIST_PATH}/${getWorkerId(name, address)}/status`;

export const getContainerStatusPath = (
  name: string,
  address: string,
  containerId: string,
) => `${getWorkerStatusPath(name, address)}/containerStatus/${containerId}`;

export const getWorkerRegisterWithPrefixPath = (
  name: string,
  address: string,
) => `${PREFIX_PATH}${WORKER_LIST_PATH}/${getWorkerId(name, address)}`;

export const getWorkerStatusWithPrefixPath = (
  name: string,
  address: string,
) => `${PREFIX_PATH}${getWorkerStatusPath(name, address)}`;

export const getWorkerRequestQueuePath = (
  name: string,
  address: string,
) => `${ROOT_PATH}/request_queue/${getWorkerId(name, address)}`;

export const getWorkerRequestQueuePathWithPrefixPath = (
  name: string,
  address: string,
) => `${PREFIX_PATH}${ROOT_PATH}/request_queue/${getWorkerId(name, address)}`;

export const getUserResponseQueuePath = (
  userAddress: string,
) => `${ROOT_PATH}/response_queue/${userAddress}`;

export const getUserResponseQueueWithPrefixPath = (
  userAddress: string,
) => `${PREFIX_PATH}${ROOT_PATH}/response_queue/${userAddress}`;
