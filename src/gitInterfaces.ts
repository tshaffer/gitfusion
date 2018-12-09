export interface LocalBranch {
  name: string,
  display: boolean,
}

export interface CommitsByHash {
  [hash: string] : CommitOnBranches
};

export interface CommitOnBranches {
  branchNames: string[];
  commitData: Commit;
}

export interface Commit {
  author: string;
  commitDate: Date;
  hash: string;
  message: string;
  parentHashes: string;
  subject: string;
}

export interface BranchCommits {
  commits: Commit[];
}
