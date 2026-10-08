export type CreatorSession = {
  accountLabel: string;
  workspaceName: string;
  userInitial: string;
  responseLimit: number;
  responsesCollected: number;
};

export const mockSession: CreatorSession = {
  accountLabel: "sample user",
  workspaceName: "My workspace",
  userInitial: "S",
  responseLimit: 10,
  responsesCollected: 0
};
