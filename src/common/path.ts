export const ROOT_PATH = '/workers';

export const WORKER_INFO = '/worker_info';

const PREFIX_PATH = '/apps/collaborative_ai';

export const getWorkerId = (name: string, address: string) => `${name}@${address}`;

export const getWorkerStatusPath = (
  name: string,
  address: string,
) => `${WORKER_INFO}/${getWorkerId(name, address)}/status`;

export const getContainerStatusPath = (
  name: string,
  address: string,
  containerId: string,
) => `${getWorkerStatusPath(name, address)}/containerStatus/${containerId}`;

export const getWorkerRegisterWithPrefixPath = (
  name: string,
  address: string,
) => `${PREFIX_PATH}${WORKER_INFO}/${getWorkerId(name, address)}`;

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
) => `${PREFIX_PATH}/worker_request_queue/${getWorkerId(name, address)}`;

export const getUserResponseQueuePath = (
  userAddress: string,
) => `${ROOT_PATH}/user_responses/${userAddress}`;

export const getUserResponseQueueWithPrefixPath = (
  userAddress: string,
) => `${PREFIX_PATH}/user_responses/${userAddress}`;
