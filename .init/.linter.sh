#!/bin/bash
cd /home/kavia/workspace/code-generation/decision-insight-platform-325145-325154/decision_replay_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

