export interface CommitsByHash {
  [hash: string] : CommitOnBranches
};

export interface CommitOnBranches {
  branchNames: string[];
  commitData: ListLogLine;
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

