const PREFIX_PATH = '/apps/collaborative_ai';

export const WORKER_LIST_PATH = '/worker_info';
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
) => `/worker_request_queue/${getWorkerId(name, address)}`;

export const getWorkerRequestQueuePathWithPrefixPath = (
  name: string,
  address: string,
) => `${PREFIX_PATH}${getWorkerRequestQueuePath(name, address)}`;

export const getUserResponsesPath = (
  userAddress: string,
) => `/user_responses/${userAddress}`;

export const getUserResponsesWithPrefixPath = (
  userAddress: string,
) => `${PREFIX_PATH}/user_responses/${userAddress}`;
