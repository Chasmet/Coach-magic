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

## APK

Après chaque push sur `main`, le workflow **Build Android APK** fabrique un APK debug.

Chemin de l'artifact dans GitHub Actions :

`Coach-Magic-debug-apk`

## GitHub Pages

Le workflow **Deploy GitHub Pages** publie l'application web.
