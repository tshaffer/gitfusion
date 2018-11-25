import { MapsLocalBar } from "material-ui/svg-icons";

export interface LocalBranch {
  name: string,
  display: boolean,
}

export interface LocalBranches {
  currentBranch: LocalBranch;
  branches: LocalBranch[];
}

export interface CommitsByHash {
  [hash: string] : CommitOnBranches
};

export interface CommitOnBranches {
  branchNames: string[];
  commitData: ListLogLine;
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









// simple git interfaces
export interface ListLogSummary {
  all: ListLogLine[];
  latest: ListLogLine;
}

export interface ListLogLine {
  author_email: string;
  author_name: string;
  date: string;
  hash: string;
  message: string;
}

