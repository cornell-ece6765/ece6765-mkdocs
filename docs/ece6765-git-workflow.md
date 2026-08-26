Git Workflow for Group Repos
==========================================================================

Every project group is given a private repository named `project-gNN` in
the [cornell-ece6765](https://github.com/cornell-ece6765) GitHub
organization, where `NN` is your group number. All three members are added
as collaborators with push access. This page covers how to use it.

!!! danger "The repo is the only copy of your work that survives"

    The course servers can crash at any time, and in the worst case may need
    to be **reformatted**, destroying everything on them -- code, environment,
    configuration, and results alike. There is no backup.

    Push early and push often. See [The Server Is Not
    Storage](ece6765-server-guide.md#2-the-server-is-not-storage) for what
    that means in practice and what belongs in the repo beyond source code.

1. One-Time Setup
--------------------------------------------------------------------------

If you have not used GitHub from the command line before, first make sure
you have an SSH key registered with your GitHub account:

```bash
% ls ~/.ssh/id_ed25519.pub || ssh-keygen -t ed25519 -C "netid@cornell.edu"
% cat ~/.ssh/id_ed25519.pub
```

Paste that public key into <https://github.com/settings/keys>. Then verify:

```bash
% ssh -T git@github.com
```

Clone your group repository:

```bash
% mkdir -p ${HOME}/ece6765
% cd ${HOME}/ece6765
% git clone git@github.com:cornell-ece6765/project-gNN
% cd project-gNN
```

Set your identity so commits are attributed correctly:

```bash
% git config user.name  "Your Name"
% git config user.email "netid@cornell.edu"
```

2. Repository Layout
--------------------------------------------------------------------------

Keep the top level of the repo predictable, since the milestone files are
collected automatically:

```
project-gNN/
  README.md          one-line project description + group members
  m1.md              milestone 1 submission
  m2.md              milestone 2 submission
  m3.md              milestone 3 submission
  m4.md              milestone 4 submission
  img/               figures referenced from the milestone files
  src/               your code
  results/           small result files (CSV, JSON) -- not raw datasets
  README-data.md     where large datasets live and how to regenerate them
```

The milestone files must sit at the repo root with exactly those names.
Feedback is pushed back alongside them as `mN-feedback-<DATE>.md`.

!!! warning "Do not commit large files"

    GitHub rejects individual files over 100 MB and the org has a shared
    storage quota. Commit the scripts that produce your data and a small
    summarized result file, not multi-gigabyte traces or checkpoints. If you
    need to share large artifacts within your group, use Cornell Box and
    link to it from `README-data.md`.

3. Working Together
--------------------------------------------------------------------------

Three people pushing to one branch will conflict. The lightest workflow
that avoids most of the pain:

**Pull before you start, push when you stop.** The push is not optional --
work that exists only in a local clone on a server is work you can lose.

```bash
% git pull --rebase
# ... do work ...
% git add -A
% git commit -m "Describe what changed"
% git push
```

**Use branches for anything that takes more than a session.**

```bash
% git checkout -b experiment-tail-latency
# ... work, commit ...
% git push -u origin experiment-tail-latency
```

Then open a pull request on GitHub and have another group member review it
before merging to `main`. This is also the easiest way for your group to
keep track of what everyone else is doing.

**Split the writeup by section.** Merge conflicts in prose are more painful
than in code. Agree on who owns which section of `mN.md`, or draft sections
in separate files and concatenate them near the deadline.

4. How Submissions Are Collected
--------------------------------------------------------------------------

After each deadline, the course staff fetch your repository and take the
**last commit on `main` at or before the deadline timestamp**. Concretely,
the equivalent of:

```bash
% git rev-list -1 --before="<deadline>" origin/main
```

Practical consequences:

 - Work on a branch that is never merged into `main` **is not submitted**.
   Merge before the deadline.
 - Pushing after the deadline does not replace your submission; the earlier
   commit is what gets graded, and the late push is recorded.
 - Committing locally is not enough. **You must push.** Verify with:

```bash
% git log origin/main -1 --format='%h %ci %s'
```

If that command shows the commit you expect, your submission is in.

5. Common Problems
--------------------------------------------------------------------------

??? question "`Permission denied (publickey)` when cloning"

    Your SSH key is not registered with GitHub, or you are using a different
    key than the one you registered. Run `ssh -T git@github.com` to test. If
    it fails, revisit step 1.

??? question "`Updates were rejected because the remote contains work that you do not have locally`"

    Someone else pushed since your last pull. Run `git pull --rebase`,
    resolve any conflicts, then push again.

??? question "I committed a huge file and now pushes fail"

    The file is in your history, so deleting it in a new commit is not
    enough. Ask on the course discussion board before attempting a history
    rewrite -- `git filter-repo` on a shared repo needs everyone to
    re-clone, and it is easy to lose work.

??? question "We want to add a fourth collaborator / change groups"

    Group changes must be approved by the instructor. Post privately on the
    course discussion board.
