import { Rational } from '../utils/inteface.js';


export interface FermatAttackResult {
  success: boolean;
  factors: [bigint, bigint] | null;
  attempts: number;
}

export interface WienerAttackResult {
  success: boolean;
  privateExponent: bigint | null;
  phi: bigint | null;
  convergents: Rational[];
}