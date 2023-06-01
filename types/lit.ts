type ReturnValueTest = {
  comparator: string;
  value: string;
};

export type AccessControlCondition = {
  contractAddress: string;
  chain: string;
  standardContractType: string;
  method: string;
  parameters: string[];
  returnValueTest: ReturnValueTest;
};

export type BooleanCondition = {
  operator: 'and' | 'or';
};
