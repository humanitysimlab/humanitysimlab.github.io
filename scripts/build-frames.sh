#!/bin/bash
# Rebuilds content/frames/epNN/1..4.jpg (960×540) from each episode's final film.
# Times match `frames` in src/data/experiments.ts. Each frame was checked by eye: no baked-in UI cards.
# Where the film's corner counter card sits in the shot, the frame is a 1440×810 crop that leaves it out.
# Run from the site folder: bash scripts/build-frames.sh
set -e
H="$(cd "$(dirname "$0")/../.." && pwd)"; OUT="$(cd "$(dirname "$0")/.." && pwd)/content/frames"
grab() { # ep n seconds [crop]
  local vf="scale=960:-2"; [ -n "$4" ] && vf="crop=$4,scale=960:-2"
  mkdir -p "$OUT/ep0$1"
  ffmpeg -v error -ss "$3" -i "$H/ep0$1/humanity_simulated_ep0$1_8min.mp4" -frames:v 1 -vf "$vf" -q:v 3 -y "$OUT/ep0$1/$2.jpg"
}
grab 1 1 8;   grab 1 2 113; grab 1 3 164; grab 1 4 217
grab 2 1 8;   grab 2 2 119; grab 2 3 245; grab 2 4 376
grab 3 1 8;   grab 3 2 90;  grab 3 3 226; grab 3 4 316
grab 4 1 47;  grab 4 2 105; grab 4 3 227; grab 4 4 348
grab 5 1 52;  grab 5 2 148; grab 5 3 257; grab 5 4 363
grab 6 1 48;  grab 6 2 96;  grab 6 3 166.5; grab 6 4 340   # 166.5: after Ella's bar fades, before the chart note appears
grab 7 1 45;  grab 7 2 249; grab 7 3 303; grab 7 4 444
grab 8 1 8 1440:810:200:180; grab 8 2 42 1440:810:0:200; grab 8 3 138; grab 8 4 337
grab 9 1 30;  grab 9 2 70 1440:810:0:100; grab 9 3 264; grab 9 4 330 1440:810:0:180
echo "36 frames → $OUT"
