# Jardin de Jade

Mahjong solitaire en français, écrit en TypeScript avec React. Quinze jardins aux silhouettes propres, de 20 à 102 tuiles et de une à quatre couches. Seule la Clairière I est accessible au départ. Sa réussite ouvre deux voies : Clairière II et Papillon I. Les chemins proposent ensuite ponts, ailes, sentiers, sanctuaires, spirales, îles et labyrinthe avant de converger vers le Palais de jade. Les jardins déjà débloqués peuvent être rejoués.

## Jouer

- Cliquez ou touchez deux tuiles identiques. Une tuile est libre si aucune autre ne la recouvre et si son côté gauche ou droit est dégagé.
- Les tuiles libres sont plus lumineuses. La sélection et les indices sont entourés d’or.
- **Indice** est limité à **5 utilisations par partie**, avec **10 secondes de pénalité** chacune. Il montre une paire jouable. Ce n’est pas une garantie que tous les choix suivants permettront de terminer.
- **Annuler** restaure le dernier coup ou le dernier mélange, sans rendre les aides utilisées ni annuler leurs pénalités.
- **Mélanger** est limité à **3 utilisations par partie**, avec **30 secondes de pénalité** chacune, incluses dans le chronomètre. Le bouton affiche les utilisations restantes et son coût. Annuler ne rend pas de mélange et ne supprime pas la pénalité. Recommencer une partie réinitialise le quota et le temps. Le mélange conserve les motifs restants et garantit une nouvelle solution. Si la géométrie est devenue impossible, les tuiles restantes sont remises à plat.
- Trois étoiles sans aide, deux avec des indices, une après un mélange. Annuler ne coûte pas d’étoile. Aucun temps limite.
- Pause manuelle et arrêt du temps lorsque l’onglet est masqué. Bruitages discrets de porcelaine et de cloche pour les tuiles, les paires, les indices, le mélange, l’annulation et la victoire. Le petit haut-parleur en haut à droite permet de les activer ou couper immédiatement. Le choix est mémorisé ; le son est activé par défaut pour une nouvelle installation.
- Tab ou flèches pour parcourir les tuiles libres, Entrée/Espace pour sélectionner, Échap pour désélectionner.

Le **meilleur temps de résolution** est affiché sous le nom du jardin, dans la liste des niveaux et après une victoire. Il inclut toutes les pénalités, ne concerne que les parties terminées et est conservé tant qu’une partie plus rapide ne le remplace pas.

La partie et les meilleurs résultats sont sauvegardés dans le navigateur utilisé. Ils ne sont pas synchronisés entre appareils. Le jeu continue à fonctionner si le stockage est indisponible, avec un avertissement visible.

## Installation

Le bouton **Installer** ajoute le jeu aux applications de l’ordinateur ou de l’appareil Android lorsque le navigateur le permet. Sur iPhone et iPad, ouvrez le jeu dans Safari puis choisissez **Partager → Sur l’écran d’accueil**. Après une première ouverture complète, le jeu et ses illustrations restent accessibles hors connexion. La sauvegarde reste locale à chaque appareil.

## Développement

Node.js 22.13 ou supérieur et pnpm :

```sh
pnpm install
pnpm dev
```

Adresse : http://127.0.0.1:5187/ . Le serveur écoute également sur le réseau local pour jouer depuis un téléphone ou une tablette connectés au même Wi-Fi.

## Version autonome

```sh
pnpm build
pnpm start
```

La version compilée se trouve dans `dist/client`. Le petit serveur fourni utilise uniquement Node.js. Le jeu ne dépend d’aucun service distant, police externe ou compte en ligne. La version compilée est une PWA installable ; il faut servir les fichiers par HTTP ou HTTPS, pas ouvrir directement le HTML depuis le disque.

Sur le Mac de création, `Jouer.command` démarre cette version compilée par un double-clic. Gardez la fenêtre du serveur ouverte et le Mac éveillé pour jouer depuis le réseau local.

## GitHub Pages

```sh
pnpm build:pages
```

La commande prépare la version publique dans `docs/`, avec des chemins relatifs adaptés à GitHub Pages. Dans les réglages GitHub Pages du dépôt, choisissez la branche `main` et le dossier `/docs`.

## Vérifications

```sh
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Les distributions et les mélanges associent deux positions libres tirées au hasard, sans privilégier les positions en miroir. La refonte de la campagne repart de zéro, à la demande de l’utilisateur (sauvegarde version 4).

Les tests automatisés couvrent les quinze silhouettes et leurs empilements, la non-symétrie des distributions, les quotas et pénalités des aides, les embranchements et convergences, les meilleurs temps, la réinitialisation des anciens formats, les règles de blocage, 750 distributions entièrement résolues, 180 mélanges après des choix arbitraires, les fins de partie, les étoiles, l’annulation, la reprise et le rejet des sauvegardes endommagées. Les dimensions de l’interface s’adaptent au portrait et au paysage. Les essais visuels et tactiles sur appareils réels restent à effectuer.

## Organisation

- `app/game/engine.ts` : règles, dispositions, génération avec certificat de résolution et mélange.
- `app/game/session.ts` : progression, historique et validation des sauvegardes.
- `app/game/audio.ts` : synthèse locale des bruitages, sans téléchargement de fichiers sonores.
- `app/game/tiles.tsx` : 19 motifs vectoriels de tuiles, indépendants des polices pour les cercles et bambous.
- `app/page.tsx` : interface et interactions.
- `app/globals.css` : thème, relief des pièces, animations et adaptation aux écrans.
- `public/art/garden.png` : décor original généré pour ce jeu.
- `tests/engine.test.ts` : vérifications du moteur et des sauvegardes.

La version publique est publiée sur GitHub Pages. La page porte `noindex` afin de limiter son apparition dans les moteurs de recherche, mais son adresse reste accessible à toute personne qui la connaît.
