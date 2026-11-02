#!/usr/bin/env bash
# Compara dos carpetas de capturas con ImageMagick (issue #3).
# Uso: scripts/visual/compare.sh visual/baseline-b644219 visual/pr-<n>
# Salida: <dir2>/diff/*.png y un informe con el % de píxeles distintos por captura.
set -u
A="$1"; B="$2"; D="$B/diff"; mkdir -p "$D"
FUZZ="${FUZZ:-3%}"       # tolerancia de color (antialiasing, ruido de WebGL)
THRESH="${THRESH:-0.5}"  # % de píxeles distintos a partir del cual se marca REVISAR
printf "%-48s %10s  %s\n" "captura" "%px" "veredicto"
for f in "$A"/*.png; do
  n=$(basename "$f")
  if [ ! -f "$B/$n" ]; then printf "%-48s %10s  %s\n" "$n" "-" "FALTA"; continue; fi
  wa=$(magick identify -format "%wx%h" "$f"); wb=$(magick identify -format "%wx%h" "$B/$n")
  if [ "$wa" != "$wb" ]; then printf "%-48s %10s  %s\n" "$n" "-" "REVISAR (tamaño $wa -> $wb)"; continue; fi
  px=$(magick compare -metric AE -fuzz "$FUZZ" "$f" "$B/$n" "$D/$n" 2>&1 >/dev/null | awk '{print $1}')
  total=$(magick identify -format "%[fx:w*h]" "$f")
  pct=$(awk -v p="$px" -v t="$total" 'BEGIN{printf "%.3f", 100*p/t}')
  v=$(awk -v p="$pct" -v t="$THRESH" 'BEGIN{print (p>t)?"REVISAR":"sin cambios"}')
  printf "%-48s %10s  %s\n" "$n" "$pct" "$v"
done
