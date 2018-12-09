import * as shell from 'shelljs';

import {
  BranchCommits,
  Commit,
  LocalBranch,
} from './gitInterfaces';

import * as dateformat from 'dateformat';

export function shellInit() {
  shell.config.execPath = shell.which('node')
}

export function cd(dirName: string) {
  shell.cd(dirName);
}

export function gitStatus(): string {
  return shell.exec('git status').stdout;
}

export function gitFetch(): string {
  return shell.exec('git fetch').stdout;
}

export function gitCheckout(branchName: string): string {
  return shell.exec('git checkout ' + branchName).stdout;
}

export function gitLog(optionSpec: string): string {
  return shell.exec('git log ' + optionSpec).stdout;
}

export function gitBranch(options: string): string {
  const results = shell.exec('git branch' + options);
  return results.stdout;
}

export function getLocalBranches(): LocalBranch[] {

  const branchResults = gitBranch('');

  const localBranches: LocalBranch[] = [];

  const branchResultEntities: string[] = branchResults.split('\n');
  branchResultEntities.forEach((branchResultEntity: string) => {
    let localBranch: LocalBranch;
    if (branchResultEntity.startsWith('*')) {
      localBranch = {
        name: branchResultEntity.substring(2),
        display: true,
      }
      localBranches.push(localBranch);
    }
    else {
      const trimmedBranchName = branchResultEntity.trim();
      if (trimmedBranchName.length > 0) {
        localBranch = {
          name: trimmedBranchName,
          display: false,
        }
        localBranches.push(localBranch);
      }
    }
  });

  return localBranches;
}

function addDays(date: Date, days: number): Date {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getBranchCommits(): BranchCommits {

  const commitFormat = 'hash&&%H||parentHashes&&%P||commitDate&&%cd||author&&%cn||subject&&%s||message&&%B&&&&';

  const now: Date = new Date();
  const beginningDate: Date = addDays(now, -22);

  const sinceDate: string = dateformat(beginningDate, 'isoDate')
  // TODO - for debugging purposes
  // const sinceDate = '2018-11-18';

  const gitLogSpec: string = "--since='" + sinceDate + "' --parents --date=iso-strict --format='" + commitFormat + "'";
  const logResults: string = gitLog(gitLogSpec);

  const newLine = '\n';
  const newLineRegex = new RegExp(newLine, 'g');
  const strippedResults = logResults.replace(newLineRegex, '');

  const commitLines = strippedResults.split('&&&&').slice(0, -1);

  const commitLinesByProperty = commitLines.map((commitLine: string) => {
    return commitLine.split('||');
  })
  console.log(commitLinesByProperty);

  const branchCommits: BranchCommits = {
    commits: []
  };

  branchCommits.commits = commitLinesByProperty.map((commitSpec: any[]) => {
    let author: string;
    let commitDate: Date;
    let hash: string;
    let message: string;
    let parentHashes: string;
    let subject: string;

    commitSpec.forEach((commitProperty) => {
      const commitPropertyComponents = commitProperty.split('&&');
      switch (commitPropertyComponents[0]) {
        case 'hash':
          hash = commitPropertyComponents[1];
          break;
        case 'commitDate':
          commitDate = new Date(commitPropertyComponents[1])
          break;
        case 'author':
          author = commitPropertyComponents[1];
          break;
        case 'message':
          message = commitPropertyComponents[1];
          break;
        case 'parentHashes':
          parentHashes = commitPropertyComponents[1];
          break;
        case 'subject':
          subject = commitPropertyComponents[1];
          break;
      }
    });

    return {
      author,
      commitDate,
      hash,
      message,
      parentHashes,
      subject
    };
  });

  console.log(branchCommits);

  return branchCommits;
}
