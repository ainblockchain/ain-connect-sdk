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

export type EventCallback = (value: any) => void;