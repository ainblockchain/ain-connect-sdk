const PATH_PREFIX = '/apps/collaborative_ai/workers';

export const getWorkerListPath = () => `${PATH_PREFIX}/list`;

export const getWorkerRegisterPath = (
  name: string,
  address: string,
) => {
  const workerId = `${name}@${address}`;
  return `${getWorkerListPath()}/${workerId}`;
};

export const getWorkerStatusPath = (
  workerId: string,
) => `${getWorkerListPath()}/${workerId}/status`;

export const getWorkerRequestQueuePath = (
  workerId: string,
) => `${PATH_PREFIX}/request_queue/${workerId}`;

export const getUserResponseQueuePath = (
  userAddress: string,
) => `${PATH_PREFIX}/response_queue/${userAddress}`;
