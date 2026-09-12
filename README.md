# Jardin de Jade

Mahjong solitaire en français, écrit en TypeScript avec React. La promenade principale réunit quinze jardins aux silhouettes propres, de 20 à 102 tuiles et de une à quatre couches. Seule la Clairière I est accessible au départ. Sa réussite ouvre deux voies, Papillon I et Serpent de bambou I. Les chemins proposent ensuite ponts, ailes, sanctuaires, spirales, îles et labyrinthe avant de converger vers le Palais de jade. Sa réussite ouvre un parcours expert facultatif de cinq nouveaux défis, comptant jusqu’à 120 tuiles. Les jardins déjà débloqués peuvent être rejoués.

Le jeu utilise les **42 motifs** du Mahjong : cercles, bambous et caractères de 1 à 9, quatre vents, trois dragons, quatre fleurs et quatre saisons. Les inscriptions visibles sur les tuiles sont chinoises ; leurs noms français restent annoncés par l’interface et les lecteurs d’écran. Comme dans le Mahjong solitaire traditionnel, toutes les fleurs s’associent entre elles, de même que toutes les saisons.

## Jouer

- L’écran titre permet de reprendre la partie sauvegardée, de choisir une nouvelle partie sur la carte ou de lancer directement le défi du jour. Le didacticiel, les statistiques, les réglages de confort et l’installation restent accessibles depuis ce menu.
- Cliquez ou touchez deux tuiles identiques. Une tuile est libre si aucune autre ne la recouvre et si son côté gauche ou droit est dégagé.
- Les tuiles libres sont plus lumineuses. La sélection et les indices sont entourés d’or.
- **Indice** est limité à **5 utilisations par partie**, avec **10 secondes de pénalité** chacune. Il montre une paire jouable. Ce n’est pas une garantie que tous les choix suivants permettront de terminer.
- **Annuler** restaure le dernier coup ou le dernier mélange, sans rendre les aides utilisées ni annuler leurs pénalités.
- **Mélanger** est limité à **3 utilisations** dans les jardins 1 à 5, **2** dans les jardins 6 à 10, puis **1 seule** à partir du jardin 11 et dans le parcours expert. Chaque mélange ajoute **30 secondes de pénalité** au chronomètre. Le bouton affiche le quota du jardin et son coût. Annuler ne rend pas de mélange et ne supprime pas la pénalité. Recommencer une partie réinitialise le quota et le temps. Le mélange conserve les motifs restants et garantit une nouvelle solution. Si la géométrie est devenue impossible, les tuiles restantes sont remises à plat.
- Trois étoiles sans aide, deux avec des indices, une après un mélange. Annuler ne coûte pas d’étoile. Aucun temps limite.
- Quatre médailles secondaires peuvent être réunies au fil des parties : terminer sans indice, sans mélange, avant le temps cible et sans annuler. Elles sont conservées séparément pour chaque jardin.
- Le **défi du jour** propose la même distribution pendant toute la journée. Son jardin et son tirage sont calculés à partir de la date, sans serveur. Le meilleur temps, les étoiles et les séries quotidiennes restent enregistrés dans ce navigateur.
- Un **didacticiel interactif** apprend à former une paire, à distinguer une tuile libre d’une tuile bloquée et à associer librement les fleurs ou les saisons. Il s’ouvre à la première visite et peut être relancé depuis l’aide.
- Le tableau des **statistiques locales** réunit les parties terminées, les jardins parfaits, le temps de jeu, les aides, les médailles et les défis quotidiens.
- Les réglages de **confort** permettent d’agrandir les tuiles, de renforcer le contraste ou de masquer l’affichage du chronomètre pendant la partie. Le temps continue alors d’être mesuré pour les records.
- Pause manuelle et arrêt du temps lorsque l’onglet est masqué. Bruitages discrets de porcelaine et de cloche pour les tuiles, les paires, les indices, le mélange, l’annulation et la victoire. Le petit haut-parleur en haut à droite permet de les activer ou couper immédiatement. Le choix est mémorisé ; le son est activé par défaut pour une nouvelle installation.
- Tab ou flèches pour parcourir les tuiles libres, Entrée/Espace pour sélectionner, Échap pour désélectionner.

Le **meilleur temps de résolution** est affiché sous le nom du jardin, dans la liste des niveaux et après une victoire. Il inclut toutes les pénalités, ne concerne que les parties terminées et est conservé tant qu’une partie plus rapide ne le remplace pas.

La difficulté de chaque jardin est calculée sur vingt distributions reproductibles. L’analyse tient compte du nombre de tuiles et de couches, des paires disponibles à chaque étape, des coups forcés et des choix qui peuvent conduire à une impasse. Le résultat est affiché sur une échelle de 1 à 5 dans le jeu et détermine l’ordre de la promenade. Dans le parcours expert, moins de motifs différents sont volontairement répétés : le joueur rencontre beaucoup plus de paires apparemment valables et doit anticiper les tuiles qu’elles libéreront. `pnpm analyze:difficulty` recalcule le rapport complet et signale les profils devenus obsolètes après une modification du moteur ou des jardins.

Le menu des jardins prend la forme d’une carte à embranchements. Les cinq régions de la campagne — bosquet, bambou, brume, lanternes et palais — disposent chacune de leur lumière et de leurs couleurs, visibles dans la carte et pendant la partie. Après le Palais, le Sentier du dragon forme un chapitre séparé avec deux branches expertes qui convergent vers le Trône céleste.

La partie, les meilleurs résultats, le défi quotidien, les statistiques et les réglages sont sauvegardés dans le navigateur utilisé. Ils ne sont pas synchronisés entre appareils. Le jeu continue à fonctionner si le stockage est indisponible, avec un avertissement visible.

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

Les distributions et les mélanges associent deux positions libres tirées au hasard, sans privilégier les positions en miroir. Le nouvel ordre, les médailles, le défi quotidien et les statistiques repartent sur une sauvegarde version 6 afin que les anciens résultats ne soient pas associés aux mauvais jardins.

Les tests automatisés couvrent les vingt silhouettes et leurs empilements, les cinq défis experts, la non-symétrie des distributions, l’ordre croissant de la promenade, ses cinq ambiances, les médailles, les quotas progressifs et les pénalités des aides, les embranchements et convergences, les meilleurs temps, le défi quotidien et ses séries, les statistiques, la réinitialisation des anciens formats, les règles de blocage, 1 000 distributions entièrement résolues, les mélanges après des choix arbitraires, les fins de partie, le comptage unique des victoires, les étoiles, l’annulation, la reprise et le rejet des sauvegardes endommagées. Les dimensions de l’interface s’adaptent au portrait et au paysage. Les essais tactiles sur appareils réels restent à effectuer.

## Organisation

- `app/game/engine.ts` : règles, dispositions, génération avec certificat de résolution et mélange.
- `app/game/session.ts` : progression, historique et validation des sauvegardes.
- `app/game/progress.ts` : défi quotidien, séries, statistiques et préférences de confort.
- `app/game/difficulty.ts` et `app/game/medals.ts` : analyse des jardins, temps cibles et récompenses secondaires.
- `app/game/audio.ts` : synthèse locale des bruitages, sans téléchargement de fichiers sonores.
- `app/game/tiles.tsx` : 19 motifs vectoriels de tuiles, indépendants des polices pour les cercles et bambous.
- `app/page.tsx` : interface et interactions.
- `app/globals.css` : thème, relief des pièces, animations et adaptation aux écrans.
- `public/art/garden.png` : décor original généré pour ce jeu.
- `tests/engine.test.ts` : vérifications du moteur et des sauvegardes.

La version publique est publiée sur GitHub Pages. La page porte `noindex` afin de limiter son apparition dans les moteurs de recherche, mais son adresse reste accessible à toute personne qui la connaît.
