# Coach Magic

Application mobile familiale pour suivre :

- le programme de Cheikh,
- les séances de Yvane,
- les missions de Nelvyn,
- la nutrition et l'hydratation,
- le suivi semaine par semaine.

## Fonctionnement

L'application fonctionne sans serveur. Les données sont sauvegardées sur le téléphone avec le stockage local du navigateur.

## Compatibilité

- Mobile Android.
- GitHub Pages.
- Installation PWA depuis le navigateur.
- APK Android généré par GitHub Actions.

## APK Android

Le workflow à ouvrir est **Build Android APK**.

Ne pas ouvrir **Deploy GitHub Pages** pour l'APK : ce workflow publie seulement le site web.

Quand **Build Android APK** est vert, aller tout en bas dans **Artifacts** puis télécharger :

`Coach-Magic-APK`

Le fichier à installer dans le ZIP s'appelle :

`Coach-Magic.apk`

## Déclenchement APK

Chaque push sur `main` relance automatiquement le build APK.

Dernier déclenchement forcé : correction interface base / spécificités / ajouts.
