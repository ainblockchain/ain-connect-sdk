import { NetworkType } from './types';

export const PROVIDER_URL: {[key: string]: string} = {
  [NetworkType.MAINNET]: '',
  [NetworkType.TESTNET]: 'https://testnet-api.ainetwork.ai',
  [NetworkType.DEVNET]: 'https://dev-api.ainetwork.ai',
  [NetworkType.LOCAL]: 'https://localhost',
};

export const FIREBASE_CONFIG: {[key: string]: any} = {
  [NetworkType.MAINNET]: {
    apiKey: 'AIzaSyCaNna60wsEWDYhAleGVj5jjp3-24GCtN0',
    authDomain: 'gpt2-ainetwork-prod.firebaseapp.com',
    databaseURL: 'https://gpt2-ainetwork-prod.firebaseio.com',
    projectId: 'gpt2-ainetwork-prod',
    storageBucket: 'gpt2-ainetwork-prod.appspot.com',
    messagingSenderId: '983388933112',
    appId: '1:983388933112:web:50fe344b8afb049f9e240d',
    measurementId: 'G-Q2GFZYSWVW',
  },
  [NetworkType.TESTNET]: {
    apiKey: 'AIzaSyDFdzVaMN1BzEEYtIw0i36do_7ojaGtPPo',
    authDomain: 'gpt2-ainetwork-staging.firebaseapp.com',
    databaseURL: 'https://gpt2-ainetwork-staging-default-rtdb.firebaseio.com',
    projectId: 'gpt2-ainetwork-staging',
    storageBucket: 'gpt2-ainetwork-staging.appspot.com',
    messagingSenderId: '413933589405',
    appId: '1:413933589405:web:73b59c581df50e5d729574',
    measurementId: 'G-SNCK4FLQBN',
  },
  [NetworkType.DEVNET]: {
    apiKey: 'AIzaSyA_ss5fiOD6bckPQk7qnb_Ruwd29OVWXE8',
    authDomain: 'gpt2-ainetwork.firebaseapp.com',
    databaseURL: 'https://gpt2-ainetwork.firebaseio.com',
    projectId: 'gpt2-ainetwork',
    storageBucket: 'gpt2-ainetwork.appspot.com',
    messagingSenderId: '1045334268091',
    appId: '1:1045334268091:web:c0490dfa3e8057a078f19e',
    measurementId: 'G-MVG9QTFBG8',
  },
  [NetworkType.LOCAL]: {},
};

// temporary
export const MAINNET_FIREBASE_ENDPOINT = '';
export const TESTNET_FIREBASE_ENDPOINT = 'https://us-central1-gpt2-ainetwork-staging.cloudfunctions.net';
export const DEVNET_FIREBASE_ENDPOINT = 'https://us-central1-gpt2-ainetwork.cloudfunctions.net';
