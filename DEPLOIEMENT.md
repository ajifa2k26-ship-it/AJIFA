# AJIFA — Site vitrine & administration

Site vitrine élégant pour la maison de mode **AJIFA** (Dakar, Sénégal), avec un panneau d'administration
simple pour ajouter, modifier ou masquer les articles depuis un ordinateur **ou un téléphone**.

```
AJIFA/
├── backend/    API Node.js (Express + MongoDB)  →  hébergée sur Render
├── frontend/   Site Next.js + admin (/admin)    →  hébergé sur Vercel
├── render.yaml Déploiement automatique de l'API sur Render
└── assets/     Logo d'origine
```

## Fonctionnement

| Élément | Service | Coût |
|---|---|---|
| Site public + admin | Vercel (offre Hobby) | Gratuit |
| API | Render (Web Service) | Gratuit (mise en veille) ou 7 $/mois |
| Base de données | MongoDB Atlas M0 | Gratuit (512 Mo, des milliers d'articles) |
| Photos | Cloudinary | Gratuit (25 crédits/mois, largement suffisant) |
| Nom de domaine | Registraire (voir plus bas) | Payant, annuel |

- Les clientes **commandent via WhatsApp** : le bouton ouvre une conversation avec un message pré-rempli
  (nom de l'article, prix, taille, couleur et lien). Le e-commerce pourra être ajouté plus tard.
- Les pages sont **pré-générées et mises en cache** par Vercel : le site reste rapide même si l'API Render
  est en veille. Après chaque modification dans l'admin, le site se met à jour en quelques secondes.
- Les photos envoyées depuis un téléphone sont **compressées automatiquement** avant l'envoi
  (pratique avec une connexion mobile), puis converties et redimensionnées par Cloudinary.

---

## 1. Créer les comptes (une seule fois)

### MongoDB Atlas (base de données)
1. Créez un compte sur <https://www.mongodb.com/cloud/atlas/register>.
2. Créez un cluster **M0 (Free)**, fournisseur AWS, région **Frankfurt (eu-central-1)** (proche de Render Frankfurt).
3. *Database Access* → ajoutez un utilisateur avec mot de passe.
4. *Network Access* → ajoutez `0.0.0.0/0` (Render n'a pas d'adresse IP fixe sur l'offre gratuite).
5. *Connect → Drivers* → copiez l'URI et ajoutez `/ajifa` avant le `?` :
   `mongodb+srv://user:motdepasse@cluster0.xxxx.mongodb.net/ajifa?retryWrites=true&w=majority`

### Cloudinary (photos)
1. Créez un compte sur <https://cloudinary.com/users/register_free>.
2. Dans le *Dashboard*, notez **Cloud name**, **API Key** et **API Secret**.

### GitHub
Poussez ce dossier dans un dépôt GitHub (privé conseillé) : Render et Vercel déploient depuis GitHub.

```bash
git init
```

```bash
git add . && git commit -m "Site AJIFA"
```

Puis créez le dépôt sur GitHub et suivez les instructions « push an existing repository ».

---

## 2. Déployer l'API sur Render

1. <https://dashboard.render.com> → **New → Blueprint** → choisissez le dépôt. Render lit `render.yaml`.
2. Renseignez les variables secrètes demandées :
   - `MONGODB_URI` : l'URI Atlas ci-dessus
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` : identifiants de l'administratrice (compte créé au 1er démarrage)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
3. Une fois déployé, ouvrez `https://ajifa-api.onrender.com/health` → doit afficher `{"ok":true,"db":true}`.
4. Dans *Environment*, **copiez la valeur générée de `REVALIDATE_SECRET`** (à reporter sur Vercel).
5. Mettez `CORS_ORIGINS` à jour si votre domaine n'est pas `ajifa.sn`.

> **Mise en veille (offre gratuite)** : après 15 min sans visite, l'API s'endort et met ~30-50 s à se réveiller.
> Le site public n'est presque pas affecté (pages en cache), mais la première connexion à l'admin peut être lente.
> Solutions : passer au plan *Starter* (7 $/mois, recommandé une fois le site lancé), ou créer un « ping »
> gratuit toutes les 10 minutes vers `/health` avec <https://cron-job.org> ou UptimeRobot.

---

## 3. Déployer le site sur Vercel

1. <https://vercel.com/new> → importez le dépôt GitHub.
2. **Root Directory : `frontend`** (Framework : Next.js, détecté automatiquement).
3. Variables d'environnement :
   - `NEXT_PUBLIC_SITE_URL` = `https://ajifa.sn` (votre domaine final)
   - `NEXT_PUBLIC_API_URL` = `https://ajifa-api.onrender.com` (l'adresse Render)
   - `REVALIDATE_SECRET` = la valeur copiée depuis Render
4. **Deploy**. Le site est accessible sur `xxx.vercel.app` en attendant le domaine.

> Astuce : réveillez l'API (ouvrez `/health`) juste avant de lancer un déploiement Vercel.

---

## 4. Nom de domaine

**Recommandation : `ajifa.sn`** — l'extension sénégalaise inspire confiance localement et aide
le référencement sur les recherches faites au Sénégal. Si possible, réservez aussi `ajifa.com`
(et redirigez-le vers `ajifa.sn`) pour protéger la marque.

- `.sn` : à acheter chez un **registraire accrédité par le NIC Sénégal** (liste sur <https://www.nic.sn>).
- `.com` : chez Cloudflare Registrar, Namecheap, OVH, Gandi…

### Brancher le domaine sur Vercel
1. Vercel → projet → *Settings → Domains* → ajoutez `ajifa.sn` **et** `www.ajifa.sn`
   (choisissez de rediriger `www` vers `ajifa.sn`).
2. Chez votre registraire, créez les enregistrements DNS **affichés par Vercel**, en général :
   - `A` sur `@` → `76.76.21.21`
   - `CNAME` sur `www` → `cname.vercel-dns.com`
3. Le certificat HTTPS est créé automatiquement (quelques minutes à quelques heures).

Si vous utilisez un autre domaine que `ajifa.sn`, mettez à jour : `NEXT_PUBLIC_SITE_URL` (Vercel),
`CORS_ORIGINS` et `FRONTEND_REVALIDATE_URL` (Render), puis redéployez.

### Adresse e-mail professionnelle (optionnel)
`contact@ajifa.sn` : Zoho Mail (offre gratuite), Google Workspace ou la messagerie du registraire.

---

## 5. Référencement (indexation Google)

Déjà intégré au site :
- `sitemap.xml` automatique (articles, catégories, pages) et `robots.txt` (l'admin est exclu)
- Titres et descriptions par page, champs SEO personnalisables pour chaque article
- Données structurées Google : boutique (`ClothingStore`), produits avec prix en FCFA et disponibilité, fil d'Ariane
- Images de partage (WhatsApp, Facebook, Instagram) générées automatiquement
- Langue `fr`, région `fr_SN`, URLs lisibles (`/produit/robe-ndeye-bazin`), pages ultra-rapides
- Les adresses de prévisualisation Vercel ne sont pas indexées (pas de contenu dupliqué)

À faire une fois le domaine en ligne :
1. **Google Search Console** (<https://search.google.com/search-console>) → ajoutez la propriété
   *Domaine* `ajifa.sn` (vérification par DNS chez le registraire) — ou la méthode *balise HTML* en mettant
   le code dans `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` sur Vercel.
   Puis *Sitemaps* → soumettez `https://ajifa.sn/sitemap.xml`.
2. **Google Business Profile** (<https://business.google.com>) : fiche AJIFA à Dakar avec adresse,
   horaires, photos, WhatsApp et lien du site. C'est **le levier n°1** pour les recherches locales
   (« boutique robe Dakar »…).
3. **Bing Webmaster Tools** : importez simplement la configuration depuis Search Console.
4. Mettez le lien du site dans la bio Instagram / TikTok / Facebook et sur le statut WhatsApp Business.
5. Pour chaque article : un nom descriptif (« Robe longue en bazin brodé bordeaux » plutôt que « Modèle 12 »),
   une vraie description, et de belles photos.

---

## 6. Utiliser l'administration

Rendez-vous sur **`https://ajifa.sn/admin`** et connectez-vous avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
Changez ensuite le mot de passe dans **Réglages**.

1. **Réglages** : numéro WhatsApp (ex : `221771234567`), téléphone, adresse, horaires, réseaux sociaux,
   textes et photo de la page d'accueil.
2. **Catégories** : Robes, Ensembles, Boubous, Accessoires… (avec une photo chacune).
3. **Articles → Ajouter** : photos (la 1ʳᵉ = couverture), nom, prix en FCFA (vide = « prix sur demande »),
   ancien prix pour afficher une promotion, tailles, couleurs, matière.
   - *Publié* : visible ou non sur le site
   - *Disponible* : sinon affiché « Épuisé » (la cliente peut demander à être prévenue)
   - *Coup de cœur* : mis en avant sur l'accueil
   - *Nouveauté* : badge « Nouveauté »

### Boutique : panier et commandes

Les clientes ajoutent des articles au panier (taille, couleur, quantité) puis commandent sur `/commande`
en indiquant **nom, téléphone, ville et adresse de livraison**. Chaque commande reçoit un numéro (`AJ-1001`…)
consultable sur `/suivi-commande` avec le téléphone utilisé.

- **Réglages → Paiement** : paiement à la livraison (activé par défaut). Orange Money, Wave et Free Money / Mixx
  apparaissent dès que leur numéro est renseigné. Un lien marchand Wave Business (optionnel) ajoute un bouton
  « Payer avec Wave » avec le montant pré-rempli.
- **Réglages → Livraison** : frais Dakar et banlieue, frais régions, seuil de livraison offerte.
- **Commandes** : liste filtrable, fiche détaillée (appel / WhatsApp de la cliente), changement de statut
  (Nouvelle → Confirmée → En livraison → Livrée, ou Annulée) et du paiement (En attente / Payée).

Paiements mobiles : la cliente envoie le montant au numéro affiché puis saisit l'identifiant de transaction
reçu par SMS. **Vérifiez la réception sur votre compte avant de marquer la commande « Payée »** — il n'y a
pas encore de vérification automatique (elle nécessiterait un compte marchand API Wave / Orange Money).

Les prix sont toujours recalculés par l'API à partir de la base : un panier modifié dans le navigateur ne
peut pas changer le montant d'une commande.

Astuce téléphone : ouvrez `/admin` dans Chrome/Safari puis « Ajouter à l'écran d'accueil »
pour l'utiliser comme une application.

---

## 7. Développement en local

Prérequis : Node.js 20+.

```bash
cd backend && cp .env.example .env && npm install && npm run dev
```

```bash
cd frontend && cp .env.example .env.local && npm install && npm run dev
```

Dans `frontend/.env.local`, mettez `NEXT_PUBLIC_SITE_URL=http://localhost:3000` et
`NEXT_PUBLIC_API_URL=http://localhost:4000`. Le site est sur <http://localhost:3000>, l'admin sur `/admin`.

## Évolutions possibles
- Paiement en ligne vérifié automatiquement (API Wave Business, Orange Money, ou carte via PayDunya / CinetPay)
- Notification (e-mail / SMS) à chaque nouvelle commande
- Gestion des stocks par taille
- Plusieurs comptes administrateurs
- Version anglaise du site
- Formulaire de rendez-vous pour essayage / sur-mesure
