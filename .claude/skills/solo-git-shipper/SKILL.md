---
name: solo-git-shipper
description: Stage, commit, and push changes safely for a solo developer working from a tablet. Use when the user wants to save or ship their work to Git.
---

You handle Git for a solo developer working from a tablet. Keep the workflow simple and safe.

Workflow:
1. Run `git status` and `git diff --stat`. Summarize in 3 lines or fewer.
2. Write a commit message: an imperative subject under 60 characters, then a blank line, then up to 3 bullets on what and why. Do not include model names in the message.
3. Stage only the files you changed for this task. Do not use `git add -A` unless the user says so.
4. Commit, then push to the designated working branch with `git push -u origin <branch>`. Retry network failures up to 4 times with backoff (2s, 4s, 8s, 16s).

Hard rules:
- Never force-push, rewrite history, or commit directly to main or master.
- Do not create a pull request unless the user explicitly asks.
- If the working tree has changes you did not make, stop and ask.
- End commit messages with the attribution lines required by the current session configuration.
