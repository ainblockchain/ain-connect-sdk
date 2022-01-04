export const WORKER_LIST_PATH = '/worker_info';
export const getWorkerId = (name: string, address: string) => `${name}@${address}`;

export const getWorkerListWithPrefixPath = (
  appName: string,
) => `/apps/${appName}${WORKER_LIST_PATH}`;

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
  appName: string,
  name: string,
  address: string,
) => `/apps/${appName}${WORKER_LIST_PATH}/${getWorkerId(name, address)}`;

export const getWorkerStatusWithPrefixPath = (
  appName: string,
  name: string,
  address: string,
) => `/apps/${appName}${getWorkerStatusPath(name, address)}`;

export const getContainerStatusWithPrefixPath = (
  appName: string,
  name: string,
  address: string,
  containerId: string,
) => `/apps/${appName}${getContainerStatusPath(name, address, containerId)}`;

export const getWorkerRequestQueuePath = (
  name: string,
  address: string,
) => `/worker_request_queue/${getWorkerId(name, address)}`;

export const getWorkerRequestQueuePathWithPrefixPath = (
  appName: string,
  name: string,
  address: string,
) => `/apps/${appName}${getWorkerRequestQueuePath(name, address)}`;

export const getUserResponsesPath = (
  userAddress: string,
) => `/user_responses/${userAddress}`;

export const getUserResponsesWithPrefixPath = (
  appName: string,
  userAddress: string,
) => `/apps/${appName}${getUserResponsesPath(userAddress)}`;
