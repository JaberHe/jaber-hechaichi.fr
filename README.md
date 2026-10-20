# Portfolio · Jaber Hechaichi

Site personnel statique d'une seule page. Il n'utilise ni framework ni étape de build, et peut être hébergé tel quel sur GitHub Pages ou Netlify.

## Structure

```
index.html            Contenu de la page, découpé en sections commentées
assets/css/style.css  Styles, avec un sommaire en tête de fichier
assets/js/main.js     Circuit animé, menu actif, copie de l'email, pop-up Cal.com
cv.pdf                CV proposé au téléchargement
```

## Réutiliser le site

- **Textes** : tout le contenu se trouve dans `index.html`. Chaque section est précédée d'un commentaire `<!-- ===== ... ===== -->`.
- **Couleurs** : les variables sont en tête de `style.css`. Il faut modifier `--accent` dans le thème clair et dans le thème sombre.
- **Email et Cal.com** : ils se règlent dans l'objet `CONFIG`, en tête de `main.js`. L'email apparaît aussi dans la section Contact de `index.html`.
- **Bandeau de compétences** : la liste est écrite deux fois dans `index.html`, pour que le défilement boucle sans coupure. Il faut modifier les deux listes de la même façon.
- **Circuit** : sa forme se règle avec les tableaux `WAY` (piste principale) et `BRANCHES` (dérivations) dans `main.js`.

## Aperçu en local

Ouvrir `index.html` dans un navigateur. Le pop-up Cal.com ne fonctionne qu'une fois le site en ligne : en local, le lien ouvre la page Cal.com dans un nouvel onglet.
