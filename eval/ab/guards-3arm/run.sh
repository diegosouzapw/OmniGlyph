#!/bin/bash
# 3-arm guard eval runner. usage: ./run.sh A|B|C [parallelism]
#   A = IDS rows in image + fact sheet in prompt (production)
#   B = plain image + fact sheet in prompt
#   C = plain image, no fact sheet
set -u
cd "$(dirname "$0")/work"
ARM=${1:?arm A|B|C}
PAR=${2:-3}
# Claude Code CLI ($0 on a subscription). Override with CLAUDE_BIN.
CLAUDE=${CLAUDE_BIN:-$(command -v claude || echo "$HOME/.claude/local/claude")}
python3 -c "
import json
for t in json.load(open('trials.json')):
    print(t['i'], t['page'], t['stratum'], t['dur'], t['gold'])
" > trials.txt
run_one() {
  local i=$1 page=$2 stratum=$3 dur=$4 gold=$5
  local img prompt ans
  if [ "$ARM" = "A" ]; then img="$PWD/pageA${page}.png"; else img="$PWD/pageP${page}.png"; fi
  prompt="Read the image at ${img}. Find the JSON line whose dur_ms is exactly ${dur} and report ONLY its 'id' field value (12 hex chars), nothing else. Read it visually from the image; do not use code."
  if [ "$ARM" != "C" ]; then
    # Fact sheet exactly as production emits it (factSheetText), no extra coaching.
    prompt="${prompt}
$(cat "factsheet${page}.txt")"
  fi
  ans=$("$CLAUDE" -p --model claude-fable-5 "$prompt" 2>/dev/null | tr -d '[:space:]' | grep -oE '[0-9a-f]{12}' | head -1)
  if [ "$ans" = "$gold" ]; then
    echo "HIT  arm=$ARM trial=$i page=$page stratum=$stratum dur=$dur gold=$gold"
  else
    echo "MISS arm=$ARM trial=$i page=$page stratum=$stratum dur=$dur gold=$gold got=${ans:-EMPTY}"
  fi
}
export -f run_one
export ARM CLAUDE
xargs -P "$PAR" -L 1 bash -c 'run_one "$@"' _ < trials.txt | tee "results-${ARM}.log"
echo "arm ${ARM}: $(grep -c '^HIT' "results-${ARM}.log")/$(wc -l < "results-${ARM}.log" | tr -d ' ') hits"
