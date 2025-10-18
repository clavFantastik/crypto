export interface IProbabilisticPrimalityTest {
  isPrimary(n: bigint, probability: number): boolean;
}