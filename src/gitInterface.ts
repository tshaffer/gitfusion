import * as shell from 'shelljs';

import {
  LocalBranch,
  LocalBranches,
} from './gitInterfaces';

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

export function getLocalBranches(): LocalBranches {

  const branchResults = gitBranch('');

  const localBranches: LocalBranches = {
    branches: [],
    currentBranch: null
  };

  const branchResultEntities: string[] = branchResults.split('\n');
  branchResultEntities.forEach( (branchResultEntity: string) => {
    let localBranch: LocalBranch;
    if (branchResultEntity.startsWith('*')) {
      localBranch = {
        name: branchResultEntity.substring(2),
        display: true,
      }
      localBranches.currentBranch = localBranch;
      localBranches.branches.push(localBranch);
    }
    else {
      const trimmedBranchName = branchResultEntity.trim();
      if (trimmedBranchName.length > 0) {
        localBranch = {
          name: trimmedBranchName,
          display: false,
        }
        localBranches.branches.push(localBranch);
      }
    }
  });

  return localBranches;
}

export function getGitBranchCommitHistory(): any {

  // const commitFormat = '%H%n%P%n%cd%n%cn%n%B%n';
  // const commitFormat = 'commit=%HparentHashes=%PcommitDate=%cdcommiterName=%cnbody=%B';
  // const commitFormat = '{%n\"commits\": [%n{%n\"hash\": %H,%n\"parentHashes\": %P,%\"commitDate\": %cd, \"author\": %cn,%n\"message\": %B,%n}%n]%n}';
  // const jsonBeginningWrapper = '{\n\"commits\": [\n'
  // const commitFormat = '{%n\"hash\": \"%H\",%n\"parentHashes\": \"%P\",%n\"commitDate\": \"%cd\",%n\"author\": \"%cn\",%n\"message\": \"%B"\,%n},'
  // const jsonEndingWrapper = '\n]\n}';
  const jsonBeginningWrapper = '{\"commits\": ['
  const commitFormat = '{\"hash\": \"%H\",\"parentHashes\": \"%P\",\"commitDate\": \"%cd\",\"author\": \"%cn\",\"message\": \"%B"\}'
  const jsonEndingWrapper = ']}';

  // const logResults: string = gitLog("--since='2018-11-19' --parents --date=iso-strict --format='%H%n%P%n%cd%n%cn%n%B%n'");
  // const logResults: string = gitLog("--since='2018-11-19' --parents --date=iso-strict --format='" + commitFormat + "'");
  const logResults: string = gitLog("-1 --parents --date=iso-strict --format='" + commitFormat + "'");

  const newLine = '\n';
  const regex = new RegExp(newLine, 'g');
  const strippedResults = logResults.replace(regex, '');

  console.log(logResults);
  console.log(strippedResults);

  const totalHistory = jsonBeginningWrapper + strippedResults + jsonEndingWrapper;

  console.log(totalHistory);

  // const foo: any = JSON.parse(totalHistory);

  // console.log(foo);
}

/*
{
  "commits": [
    {
      "hash": <hash name>,
      "parentHashes": <parent hashes>,
      "commitDate": <commit date>,
      "author": <name>,
      "message": <commit message>,
    }
  ]
}
*/
