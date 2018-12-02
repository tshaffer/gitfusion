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
  commitDate: string;
  hash: string;
  message: string;
  parentHashes: string;
}

export interface BranchCommits {
  commits: Commit[];
}
