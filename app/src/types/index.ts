// App-specific type definition go here
import { Grant } from '@dgrants/types';
import { TokenInfo } from '@uniswap/token-lists';

// Cart info saved in localStorage
export type CartItemOptions = {
  grantId: string;
  contributionTokenAddress: string; // store address instead of TokenInfo to reduce localStorage size used
  contributionAmount: number; // store as a human-readable number for better form UX
};

// Cart info used by the main Cart component
export type CartItem = Omit<CartItemOptions, 'contributionTokenAddress'> & Grant & { contributionToken: TokenInfo };
