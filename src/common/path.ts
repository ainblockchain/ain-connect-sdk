const PATH_PREFIX='/apps/collaborative_ai/workers';

export const getWorkerRegisterPath =
    (name: string, address: string) => {
  const workerId = `${name}@${address}`;
  return `${PATH_PREFIX}/list/${workerId}`;
}

export const getWorkerStatusPath = (workerId: string) => {
  return `${PATH_PREFIX}/list/${workerId}/status`;
}

export const getWorkerRequestQueuePath = (workerId: string) => {
  return `${PATH_PREFIX}/request_queue/${workerId}`;
}