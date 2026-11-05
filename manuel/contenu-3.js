/* Manuel — troisième partie : le guichet, les crédits, les membres, les papiers. */
module.exports = [

['h1', '7. Le guichet entre les réunions'],
['p', 'Le guichet est **facultatif**. L’assemblée le vote à la création, et peut l’ouvrir plus tard dans **Plus › Règlement**. Sans lui, l’argent ne bouge qu’en réunion, comme toujours.'],
['p', 'Avec lui, un membre peut **confier de l’argent** ou **le reprendre** un autre jour, au village, sans attendre la réunion. C’est utile là où la réunion est hebdomadaire et le marché quotidien.'],
['fig', 'avec/ordi-a-guichet', 'L’écran du guichet : ce qui est déposé, ce qu’il y a dans la caisse, et les quatre gestes.'],

['h2', '7.1 Les deux promesses du guichet'],
['ul', [
  '**L’argent déposé n’est jamais prêté.** Il dort dans la caisse et se reprend n’importe quel jour d’ouverture. Les crédits se font avec l’épargne en parts, pas avec les dépôts. Akiba tient les deux sommes séparées et ne les mélange jamais.',
  '**Un retrait demande le code du membre lui-même.** Personne ne sort l’argent d’un autre, pas même le bureau.',
]],

['h2', '7.2 Tenir une séance de guichet'],
['ol', [
  '**Ouvrir le guichet** : compter l’argent de la caisse devant un deuxième membre du bureau, comme au début d’une réunion. L’écart, s’il y en a un, s’explique par écrit.',
  '**Servir les membres** : Dépôt, Retrait, Remboursement d’un crédit, ou Transfert d’un compte à un autre.',
  '**Recompter et fermer** : l’argent est recompté, un deuxième membre du bureau confirme avec son code, et la séance est scellée.',
]],
['p', 'Le guichet ne s’ouvre pas pendant une réunion, et une réunion ne s’ouvre pas pendant le guichet : il n’y a jamais deux comptages en cours sur la même caisse.'],
['fig', 'avec/ordi-feuille-guichet-depot', 'Un dépôt : le membre, le montant, et rien d’autre.'],
['tip', 'Un dépôt n’est pas de l’épargne en parts : il ne donne pas droit à un crédit plus grand et ne compte pas au partage. C’est l’argent du membre, gardé par le groupe.'],

['h2', '7.3 Corriger une erreur de guichet'],
['p', 'Une opération s’annule depuis le reçu du guichet, tant que la séance n’est pas close. Akiba refuse une annulation qui rendrait un compte négatif, et une annulation de transfert emporte **les deux côtés** : on ne crée pas d’argent en annulant la moitié d’un virement.'],

['h1', '8. Les crédits'],
['fig', 'avec/ordi-a-loans', 'L’écran des crédits : en cours, en retard, soldés, et la liste d’attente.'],

['h2', '8.1 Les règles qu’Akiba fait respecter'],
['tbl', ['Règle', 'Ce qu’Akiba fait'], [
  ['Crédit maximum', 'Le plafond de chaque membre s’affiche en face de son nom : un multiple de son épargne, voté par l’assemblée.'],
  ['Durée maximum', 'Un crédit qui finirait après la fin du cycle est refusé, avec la raison.'],
  ['Deux validations', 'Celui qui enregistre, plus un deuxième membre du bureau avec son code.'],
  ['Intérêt', 'Calculé au mois sur le montant prêté, selon le taux voté.'],
  ['Pénalité de retard', 'Calculée sur le **reste dû**, pas sur le montant d’origine, et seulement si l’assemblée l’a votée.'],
  ['Échéance', 'Toujours un jour de réunion : on ne demande pas à quelqu’un de venir payer un jour où personne n’est là.'],
]],

['h2', '8.2 Pendant la vie du crédit'],
['ul', [
  '**Rembourser** : à l’étape 5 de la réunion, ou au guichet si le groupe en tient un. Tout ou partie.',
  '**Solder avant l’échéance** : accepté ; les intérêts ne courent que jusqu’au jour du paiement.',
  '**Retard** : le crédit passe en rouge, la pénalité se calcule toute seule, et l’animateur le voit dans ses alertes.',
  '**Liste d’attente** : une demande non servie garde son rang. Quand l’argent rentre, Akiba rappelle qui attendait.',
]],

['h1', '9. Le crédit extérieur (IMF, banque, ONG)'],
['p', 'Un groupe peut emprunter **en tant que groupe** auprès d’une institution. Cet argent n’est pas de l’épargne : il entre dans la caisse de crédit, il se rembourse, et il se voit séparément dans tous les rapports.'],
['fig', 'avec/ordi-a-ext', 'Le crédit extérieur : montant, garantie, frais, reste dû.'],
['ul', [
  'L’enregistrement demande la **décision de l’assemblée générale** : date et objet.',
  'La **garantie** bloquée est déduite de ce que le groupe peut prêter à ses membres.',
  'Les **frais de dossier** s’enregistrent à part des intérêts.',
  'Un remboursement extérieur en retard remonte en alerte à l’organisation.',
]],
['p', 'L’écran **Dossier IMF** prépare ce qu’une institution demande : ancienneté, taux de remboursement, portefeuille à risque, présence, écarts de caisse, qualité des données. Akiba dit lesquels sont remplis et lesquels manquent.'],
['fig', 'avec/ordi-a-imf', 'Le dossier IMF : sept critères, et où en est le groupe.'],

['h1', '10. Les membres'],
['fig', 'avec/ordi-a-members', 'La liste des membres : épargne et crédit de chacun, en un coup d’œil.'],

['h2', '10.1 La fiche d’un membre'],
['p', 'Nom, sexe, date de naissance (l’âge s’en déduit), téléphone, activité, adresse, photo. Seuls le nom et le sexe sont obligatoires. La photo reste facultative, se prend avec l’accord de la personne, et Akiba la réduit pour qu’elle ne pèse pas sur le téléphone.'],
['fig', 'avec/ordi-a-member', 'La fiche d’un membre : son compte, ses parts, ses crédits, ses papiers.'],

['h2', '10.2 Arrivées et départs'],
['ul', [
  '**Un nouveau membre** en cours de cycle : il entre avec zéro part et achète à partir de sa première réunion.',
  '**Un départ** : Akiba calcule ce qui lui revient, retient ce qu’il doit, et écrit la sortie dans le journal. Un membre qui doit de l’argent ne sort pas sans que l’assemblée en décide.',
  'Chaque arrivée et chaque départ laisse une écriture : la liste des membres est couverte par le sceau, comme l’argent.',
]],

['h2', '10.3 Le livret et le relevé'],
['p', 'Chaque membre peut repartir avec **sa page** : ce que le cahier dit de lui, sur une feuille A4 qu’il garde chez lui — parts réunion par réunion, mouvements du guichet, crédits, solde, et deux lignes de signature.'],
['p', 'Sur le terminal, le **relevé** donne le même compte en court, sur le rouleau. Chaque livret porte une référence qui dit de quel cahier et de quelle écriture il est tiré : on peut le confronter au journal.'],
['fig', 'avec/ordi-a-livret', 'Le livret d’un membre, tel qu’il s’imprimera sur A4.'],

['h2', '10.4 Les cartes de membre'],
['p', 'Dix cartes par feuille A4, au format d’une carte bancaire, à découper. Chacune porte le nom, le rôle, le numéro de membre, le groupe, et une empreinte qui permet de vérifier la carte contre le cahier.'],
['fig', 'avec/ordi-a-cards', 'Les cartes de membre, prêtes à imprimer et à découper.'],

['h1', '11. Les papiers'],
['p', 'Akiba imprime sur le rouleau du terminal, et sur A4 depuis un ordinateur. Tout ce qui sort est sans accent et tient en 32 colonnes : c’est la largeur du papier thermique.'],
['tbl', ['Papier', 'Quand', 'Ce qu’il porte'], [
  ['Reçu de réunion', 'À la clôture', 'Les totaux de la séance, la caisse, les trois clés, le sceau'],
  ['Reçu d’un membre', 'À la clôture, ou à la demande', 'Ce que ce membre a versé et doit, et sa preuve'],
  ['Journal de la séance', 'Après la clôture', 'Toutes les écritures, les totaux, la situation du groupe, le sceau'],
  ['Reçu du guichet', 'À chaque opération', 'Dépôt ou retrait, solde du compte'],
  ['Relevé de compte', 'À la demande', 'Les mouvements d’un membre, sur le rouleau'],
  ['Livret A4', 'À la demande', 'La page complète d’un membre, à garder chez lui'],
  ['Cartes A4', 'À la création, ou plus tard', 'Dix cartes de membre à découper'],
]],
['fig', 'avec/ordi-a-receipt', 'Un reçu de réunion.'],
['h2', '11.1 Vérifier un reçu'],
['p', 'Chaque reçu porte une **preuve** : quelques signes calculés à partir du contenu et du journal. Un reçu refait à la main ne tombe pas juste. Dans **Plus › Vérifier un reçu**, on entre la preuve et Akiba dit si le papier correspond au cahier.'],

];
