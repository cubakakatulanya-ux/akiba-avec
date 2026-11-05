/* Manuel — deuxième partie : l'organisation, le téléphone du groupe, et la réunion. */
module.exports = [

['h1', '4. L’organisation'],
['p', 'Le compte d’organisation est ouvert par Ubora ; une ONG ne se déclare pas elle-même. Le responsable écrit d’abord qui est l’organisation, Ubora vérifie et renvoie un code de validation pour ce téléphone, et le responsable choisit son code secret à la toute fin.'],
['fig', 'suivi/ordi-o-home', 'Le tableau de bord de l’organisation : alertes, épargne et crédits par AVEC, AVEC à valider.'],

['h2', '4.1 Valider une AVEC'],
['p', 'Un groupe créé par un animateur arrive **en attente**. Il ne peut pas tenir sa première réunion avant que l’organisation l’ait validé. Deux chemins.'],
['h3', 'Avec réseau'],
['p', 'Le groupe touche **Envoyer maintenant**. L’organisation voit le groupe dans **AVEC à valider**, vérifie le nom, le village et le bureau, et valide. Le groupe devient actif au prochain envoi.'],
['h3', 'Sans réseau — un simple appel'],
['ol', [
  'Le président ou l’animateur appelle et lit le **code de demande** de six signes affiché sur son écran.',
  'L’organisation ouvre **Outils › Valider par téléphone**, entre ce code, et vérifie le nom du groupe et le village qui s’affichent.',
  'Akiba calcule un **code d’activation de huit chiffres**. L’organisation le dicte chiffre par chiffre.',
  'Le groupe le tape dans **Code d’activation**, et l’AVEC devient active.',
]],
['tip', 'Ce code ne marche que pour ce groupe-là. Il ne sert pas deux fois ailleurs, et il ne donne accès à rien d’autre.'],
['fig', 'suivi/ordi-o-review', 'L’écran de validation : ce que l’organisation vérifie avant de dire oui.'],

['h2', '4.2 Débloquer un membre qui a perdu son code'],
['ol', [
  'Sur le téléphone du groupe, le membre touche **J’ai oublié mon code secret**. Un code de six signes s’affiche.',
  'Le bureau appelle l’organisation et lit ce code, après avoir vérifié que c’est bien la bonne personne : nom, groupe, une question sur son épargne.',
  'L’organisation ouvre **Débloquer un membre**, entre le code reçu et dicte le code de déblocage.',
  'Le membre choisit alors un nouveau code secret.',
]],
['p', 'Si l’organisation est injoignable, le groupe a une **carte de secours** de six codes, rangée dans le coffre. Chaque code sert une seule fois.'],

['h2', '4.3 Les animateurs'],
['ul', [
  '**Ajouter un animateur** : nom, sexe, zone, téléphone. Akiba affiche son code secret une fois.',
  '**Code oublié d’un animateur** : l’organisation choisit l’animateur, confirme avec son propre code, et Akiba affiche le nouveau code une seule fois.',
  'Chaque animateur ne voit que ses propres groupes ; l’organisation les voit tous.',
]],

['h2', '4.4 Rapports et impact'],
['ul', [
  '**Exporter vers Excel** : huit feuilles — synthèse, AVEC, membres, réunions, crédits, crédits extérieurs, formation, alertes. Jamais de téléphone ni d’adresse dans l’export destiné à un partenaire.',
  '**Impact** : épargne mobilisée, crédits accordés, taux de remboursement, présence, part des femmes. Les chiffres sont calculés sur les journaux scellés reçus — pas sur des déclarations.',
  '**Dossier IMF** : la liste des critères qu’une institution financière regarde, et où en est chaque groupe.',
]],
['fig', 'suivi/ordi-o-impact', 'L’écran d’impact : ce que l’organisation peut montrer à un bailleur.'],

['h1', '5. Le téléphone du groupe'],
['h2', '5.1 Valider le téléphone'],
['p', 'Un téléphone qui porte de vraies données doit être validé par Ubora. L’écran de validation affiche le **code de ce téléphone** : huit signes, propres à l’appareil.'],
['ol', [
  'Envoyer ce code à Ubora par WhatsApp, ou le lire au téléphone.',
  'Ubora répond avec un **code de validation**, lui aussi de huit signes.',
  'Le taper dans le champ du bas, et toucher **Valider ce téléphone**.',
]],
['p', 'Le code de validation ne fonctionne sur aucun autre appareil. Il porte une date de fin ; Akiba prévient trente jours à l’avance.'],
['fig', 'avec/ordi-lic-gate', 'L’écran de validation du téléphone, en trois pas.'],

['h2', '5.2 Recevoir le cahier'],
['p', 'Voir le chapitre 3.3 pour les deux chemins — par image ou par fichier. Une fois le cahier reçu, le téléphone quitte la démonstration : la couverture affiche le vrai groupe, et les faux groupes d’entraînement disparaissent.'],
['attention', 'Avant de recevoir un cahier, assurez-vous que c’est bien le téléphone destiné au groupe. Un cahier reçu sur le mauvais appareil se renvoie, mais le groupe aura perdu une journée.'],

['h2', '5.3 La couverture et la connexion'],
['p', 'La couverture est la première chose que voit le groupe : l’emblème du groupe, son nom, la semaine du cycle, l’état du cahier, et un grand bouton doré qui dit le geste du jour — **Ouvrir le cahier**, ou **Continuer la réunion n°15** si une séance est en cours.'],
['p', 'Chaque membre touche son nom puis tape son code secret de quatre chiffres. Le bureau voit tout le cahier ; un membre ordinaire voit son propre compte, son livret, et le journal.'],
['fig', 'avec/tel-login', 'La couverture du cahier, sur le téléphone du groupe.'],
['fig', 'avec/tel-l-member', 'La connexion : chacun touche son nom.'],

['h1', '6. La réunion, étape par étape'],
['p', 'La réunion est le cœur d’Akiba. Elle se tient en huit étapes, dans l’ordre, et l’application ne laisse pas sauter une étape qui engage de l’argent. Le secrétaire tient le téléphone ; les montants se disent à haute voix.'],
['tip', 'Une réunion interrompue n’est pas perdue : elle reste ouverte. Rallumez le téléphone, rouvrez le cahier, et le grand bouton doré propose **Continuer la réunion**.'],

['h2', 'Étape 1 — Les présences'],
['p', 'Pour chaque membre : **Là**, **Retard** ou **Absent**. Les amendes ne sont pas proposées ici : elles viendront à l’étape 7, une fois qu’on saura qui a payé quoi.'],
['p', 'Un deuil, une maladie, un accouchement, une route coupée : touchez **Donner un motif** sous le nom de la personne. L’amende ne sera pas proposée, et le motif entre dans le journal scellé.'],
['fig', 'reunion/tel-etape-1', 'Étape 1 : qui est là.'],

['h2', 'Étape 2 — Le comptage d’ouverture'],
['p', 'Les trois porte-clés ouvrent le coffre devant tout le monde. Les compteurs comptent l’argent à haute voix, et le secrétaire entre le montant compté. Akiba affiche ce que dit le cahier et calcule l’écart.'],
['p', 'Un écart n’empêche pas la réunion, mais il doit être **expliqué par écrit** : l’explication reste dans le journal et remonte à l’organisation.'],
['fig', 'reunion/tel-etape-2', 'Étape 2 : l’argent compté, confronté au cahier.'],

['h2', 'Étape 3 — La caisse sociale'],
['p', 'Chaque membre présent verse le montant voté. Akiba les propose tous ; retirez ceux qui n’ont pas payé. Deux gestes de plus sont possibles ici : **Donner une aide sociale** à un membre en difficulté — avec une raison écrite et la validation d’un deuxième membre du bureau — et **Dépense du groupe** pour un cahier, un cadenas, du savon.'],
['fig', 'reunion/tel-etape-3', 'Étape 3 : la caisse de solidarité.'],

['h2', 'Étape 4 — L’épargne en parts'],
['p', 'Chaque membre achète de une à N parts, N étant ce que l’assemblée a voté. Le bouton **1 part à ceux à 0** va vite quand presque tout le monde prend le minimum ; les boutons **−** et **+** ajustent ensuite, membre par membre. Le total en parts et en argent s’affiche en bas.'],
['fig', 'reunion/tel-etape-4', 'Étape 4 : les parts achetées.'],

['h2', 'Étape 5 — Les remboursements'],
['p', 'Akiba liste les crédits en cours avec ce qui reste dû, les intérêts du mois et, s’il y a lieu, la pénalité de retard. Le membre peut payer tout ou partie. Un crédit soldé disparaît de la liste et entre dans l’historique.'],
['fig', 'reunion/tel-etape-5', 'Étape 5 : qui rembourse, et combien.'],

['h2', 'Étape 6 — Les nouveaux crédits'],
['p', 'L’assemblée écoute chaque demande. Akiba affiche l’argent disponible pour prêter et, pour chaque membre, le plafond calculé selon la règle votée — un multiple de son épargne.'],
['ul', [
  'Un crédit demande **deux validations** : celui qui enregistre, et un deuxième membre du bureau avec son code.',
  'Un crédit plus long que ce qui reste du cycle est **refusé** : l’argent doit être rentré avant le partage.',
  'Une demande qu’on ne peut pas servir se note en **liste d’attente**, dans l’ordre d’arrivée.',
]],
['fig', 'reunion/tel-etape-6', 'Étape 6 : accorder un crédit.'],

['h2', 'Étape 7 — Les amendes'],
['p', 'Akiba propose les amendes selon les présences : retard, absence, et les autres amendes du règlement (bavardage, téléphone, oubli). Un absent ne paie pas aujourd’hui : son amende est notée comme **dette** et reproposée à son retour.'],
['fig', 'reunion/tel-etape-7', 'Étape 7 : les amendes proposées.'],

['h2', 'Étape 8 — La clôture à trois clés'],
['p', 'Les compteurs recomptent tout l’argent. Akiba affiche le détail de la séance — épargne, caisse sociale, remboursements, amendes, crédits sortis — et le montant attendu. Puis **chacun des trois porte-clés confirme avec son propre code**.'],
['p', 'Si un porte-clé est absent, l’assemblée désigne un remplaçant pour cette réunion seulement ; le nom du remplaçant reste dans le journal scellé et s’imprime sur le reçu. À la réunion suivante, le porte-clé retrouve sa clé sans rien faire.'],
['p', 'Une fois scellée, la réunion ne se modifie plus. Une erreur se corrige par une **annulation**, qui laisse les deux lignes visibles.'],
['fig', 'reunion/tel-etape-8', 'Étape 8 : fermer la caisse à trois clés.'],
['fig', 'reunion/ordi-etape-8', 'La même étape sur un ordinateur.'],

['h2', 'Après la réunion'],
['p', 'L’écran de clôture propose, dans cet ordre :'],
['ol', [
  '**Imprimer le journal de la séance** — toutes les écritures dans l’ordre, les totaux, la situation du groupe après la séance, les clés et le sceau. Environ 32 cm de papier.',
  '**Reçus des membres** — un reçu par membre présent.',
  '**Montrer à l’animateur** — la séance en images, à photographier.',
  '**Retour à l’accueil**.',
]],
['fig', 'reunion/ordi-feuille-journal-seance', 'Le journal de la séance, tel qu’il sortira de l’imprimante.'],
['tip', 'Classez les journaux de séance dans une pochette gardée **dans le coffre**, dans l’ordre des numéros. Si le téléphone disparaît, ces papiers remis bout à bout redonnent tout le cahier.'],

];
