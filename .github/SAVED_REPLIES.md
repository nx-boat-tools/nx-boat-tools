# Saved Responses for Nx Boat Tools's Issue Tracker

The following are canned responses that the Nx Boat Tools team should use to close issues on our issue tracker that fall into the listed resolution categories.

Since GitHub currently doesn't allow us to have a repository-wide or organization-wide list of [saved replies](https://help.github.com/articles/working-with-saved-replies/), these replies need to be maintained by individual team members. Since the responses can be modified in the future, all responses are versioned to simplify the process of keeping the responses up to date.

## Nx Boat Tools: Already Fixed

```
Thanks for reporting this issue. Luckily, it has already been fixed in one of the recent releases. Please update to the most recent version to resolve the problem.

If the problem persists in your application after upgrading, please open a new issue, provide a simple repository reproducing the problem, and describe the difference between the expected and current behavior. You can use `create-nx-workspace my-issue` to create a new project where you reproduce the problem.
```

## Nx Boat Tools: Don't Understand

```
I'm sorry, but we don't understand the problem you are reporting.

Please provide a simple repository reproducing the problem, and describe the difference between the expected and current behavior. You can use `create-nx-workspace my-issue` to create a new project where you reproduce the problem.
```

## Nx Boat Tools: Duplicate

```
Thanks for reporting this issue. However, this issue is a duplicate of #<ISSUE_NUMBER>. Please subscribe to that issue for future updates.
```

## Nx Boat Tools: Insufficient Information Provided

```
Thanks for reporting this issue. However, you didn't provide sufficient information for us to understand and reproduce the problem. Please check out [our submission guidelines](https://github.com/nx-boat-tools/nx-boat-tools/blob/master/CONTRIBUTING.md#-submitting-an-issue) to understand why we can't act on issues that are lacking important information.

Please ensure you provide all of the required information when filling out the issue template.
```

## Nx Boat Tools: NPM install issue

```
This seems like a problem with your node/npm and not with Nx Boat Tools.

Please have a look at the [fixing npm permissions page](https://docs.npmjs.com/getting-started/fixing-npm-permissions), [common errors page](https://docs.npmjs.com/troubleshooting/common-errors), [npm issue tracker](https://github.com/npm/npm/issues), or open a new issue if the problem you are experiencing isn't known.
```

## Nx Boat Tools: Issue with Nx

```
I'm sorry, but this issue is with Nx itself, not Nx Boat Tools directly. Please see the [Nx contribution guide](https://github.com/nrwl/nx/blob/master/CONTRIBUTING.md#-submitting-an-issue) for information on submitting an issue with Nx.
```

## Nx Boat Tools: Issue Outside of Nx Boat Tools

```
I'm sorry, but this issue is not caused by Nx Boat Tools. Please contact the author(s) of the <PROJECT NAME> project or file an issue on their issue tracker.
```

## Nx Boat Tools: Non-reproducible

```
I'm sorry, but we can't reproduce the problem following the instructions you provided.
Remember that we have a large number of issues to resolve, and have only a limited amount of time to reproduce your issue.
Short, explicit instructions make it much more likely we'll be able to reproduce the problem so we can fix it.

A good way to make a minimal repro is to create a new app via `create-nx-workspace my-issue` and adding the minimum possible code to show the problem. Then you can push this repository to github and link it here.
```

## Nx Boat Tools: Obsolete

```
Thanks for reporting this issue. This issue is now obsolete due to changes in the recent releases. Please update to the most recent Nx version.

If the problem persists after upgrading, please open a new issue, provide a simple repository reproducing the problem, and describe the difference between the expected and current behavior.
```