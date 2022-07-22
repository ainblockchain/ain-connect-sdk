export const getWorkerId = (name: string, address: string) => `${name}@${address}`;

export const getWorkerListPath = (
  appName: string,
) => `/apps/${appName}/worker_info`;

export const getWorkerRegisterPath = (
  appName: string,
  name: string,
  address: string,
) => `${getWorkerListPath(appName)}/${getWorkerId(name, address)}`;

export const getWorkerStatusPath = (
  appName: string,
  name: string,
  address: string,
) => `${getWorkerRegisterPath(appName, name, address)}/status`;

export const getContainerStatusPath = (
  appName: string,
  name: string,
  address: string,
  containerId: string,
) => `${getWorkerStatusPath(appName, name, address)}/containerStatus/${containerId}`;

export const getWorkerRequestQueuePath = (
  appName: string,
  name: string,
  address: string,
) => `/apps/${appName}/worker_request_queue/${getWorkerId(name, address)}`;

export const getUserResponsesPath = (
  appName: string,
  userAddress: string,
) => `/apps/${appName}/user_responses/${userAddress}`;
