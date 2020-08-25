export type ClusterRegisterParams = {
  clusterName: string;
  clusterTitle: string;
  clusterDescription: string;
  price: number;
  isPrivate: 0 | 1;
  allowAddress?: string[];
  isHttps: 0 | 1;
  domain?: string;
  isSubdomainMethod: 0 | 1;
  clusterType: 'k8s' | 'docker';
}
