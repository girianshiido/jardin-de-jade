#!/bin/zsh
cd -- "$(dirname -- "$0")"
JADE_NODE="$(command -v node)"
if [[ -z "$JADE_NODE" ]]; then
  JADE_NODE="/Users/girianshiido/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$JADE_NODE" ]]; then
  echo "Installez Node.js 22 ou supérieur pour lancer le jeu."
  read -r '?Appuyez sur Entrée pour fermer.'
  exit 1
fi
if [[ ! -f dist/client/index.html ]]; then
  echo "La version compilée est absente. Exécutez pnpm install puis pnpm build."
  read -r '?Appuyez sur Entrée pour fermer.'
  exit 1
fi
open 'http://127.0.0.1:5187/'
"$JADE_NODE" scripts/serve.mjs
