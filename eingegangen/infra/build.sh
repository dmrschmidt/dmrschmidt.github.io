#!/usr/bin/env bash
# Builds the AWS version of "Das Haus gegenüber" into a flat folder (default: dist/eingegangen):
# the page at the root, its scripts and the founders' pictures beside it, and the API switched on.
# On GitHub Pages the same page keeps running without a server.
#   eingegangen/infra/build.sh [out-dir]
set -euo pipefail
cd "$(dirname "$0")/../.."
out="${1:-dist/eingegangen}"
rm -rf "$out"
mkdir -p "$out"

cp eingegangen/gemeinsam.js eingegangen/gemeinsam.css tote-maenner/pflanzen.js "$out/"
cp -R tote-maenner/sticker tote-maenner/img "$out/"

# same-origin API, pictures next to the page, flat script paths, no link back to the other drafts
sed -e 's#<script src="../../tote-maenner/pflanzen.js"></script>#<script>window.EG_API = "/api"; window.EG_TOTE = "./";</script>\n<script src="pflanzen.js"></script>#' \
    -e 's#src="../gemeinsam.js"#src="gemeinsam.js"#' \
    -e '/<a href="..\/">← Entwürfe<\/a>/d' \
    -e 's#href="../gemeinsam.css"#href="gemeinsam.css"#' \
    -e 's#<meta name="description" content="[^"]*">#<meta name="description" content="Ein Wohnblock bei Nacht. Hinter jedem Fenster steht ein eingegangener Topf und guckt. Stell eine Kerze dazu.">#' \
    eingegangen/gegenueber/index.html > "$out/index.html"

cat > "$out/404.html" <<'HTML'
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Hier wohnt niemand</title>
<style>
  body { margin: 0; min-height: 100svh; display: grid; place-content: center; gap: 1rem; padding: 2rem; background: #12231a; color: #f1ead6; font: 1.125rem/1.6 Georgia, serif; text-align: center; }
  h1 { margin: 0; font-size: clamp(2.5rem, 9vw, 5rem); line-height: 1; }
  p { margin: 0; }
  a { color: #ffd27a; }
</style>
</head>
<body>
<h1>Hier wohnt niemand.</h1>
<p>Nicht einmal ein toter Topf. <a href="/">Zurück zum Haus</a></p>
</body>
</html>
HTML

# the build must not leave a path that points out of the folder, and the API must be on
if grep -n '"\.\./' "$out/index.html"; then echo "build: a ../ path survived in index.html" >&2; exit 1; fi
grep -q 'window.EG_API = "/api"' "$out/index.html" || { echo "build: API switch missing in index.html" >&2; exit 1; }
echo "built $out"
