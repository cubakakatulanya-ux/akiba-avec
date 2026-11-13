/* Akiba AVEC — guide d'utilisation */
'use strict';

const GUIDE = [
  { id: 'bref', icon: 'book', t: 'Akiba en bref', b: `
    ${FIG.cahier()}
    <p>Akiba est une <b>infrastructure numérique hors ligne</b>, conçue autour des pratiques réelles des AVEC rurales. Elle remplace les cahiers du groupe (caisse, carnets des membres, registre des crédits, procès-verbal) et tient trois promesses :</p>
    <ol>
      <li><b>Des opérations quotidiennes transformées en données fiables et vérifiables.</b> La réunion suit l'ordre du cahier, sans réseau. Chaque franc est écrit au moment où il bouge, dans un journal scellé où toute modification se voit.</li>
      <li><b>Une supervision moins coûteuse.</b> L'animateur et l'organisation reçoivent les chiffres à distance, voient les alertes et se déplacent là où il le faut.</li>
      <li><b>Une passerelle vers le système financier formel.</b> L'historique vérifiable du groupe, l'indice de qualité des données et l'indicateur « prête pour une IMF » ouvrent la discussion avec une institution de microfinance.</li>
    </ol>
    <p>Tout est calculé par le téléphone, sans erreur de calcul, et <b>marche sans réseau</b>.</p>
    <h4>Qui utilise Akiba ?</h4>
    <ul>
      <li><b>Le bureau de l'AVEC</b> (président, secrétaire, trésorier) tient les réunions et enregistre l'argent.</li>
      <li><b>Les porte-clés</b> confirment le comptage de la caisse avec leur code secret.</li>
      <li><b>Chaque membre</b> peut ouvrir son carnet pour voir son épargne, ses crédits et ses amendes.</li>
      <li><b>L'animateur</b> suit plusieurs AVEC, reçoit les alertes et note ses visites. Il ne peut rien modifier.</li>
      <li><b>L'organisation</b> voit le tableau de bord de toutes les AVEC qu'elle accompagne.</li>
    </ul>
    <p>Akiba est développée par l'<b>Entreprise Sociale Ubora</b>, qui assure aussi l'assistance : appel ou WhatsApp au <b>0998 275 144</b>, e-mail <b>contact@uborahub.com</b>.</p>
    <div class="tip">Une AVEC <b>autonome</b> (sans organisation) utilise seulement l'interface du groupe. Personne d'autre ne voit ses données.</div>` },
  { id: 'premierjour', icon: 'home', t: 'Le premier jour : par où commencer', b: `
    <p>Vous venez de recevoir le téléphone, ou vous ouvrez Akiba pour la première fois. Faites ces choses dans cet ordre, et rien d'autre.</p>
    <h4>1. S'entraîner sans risque</h4>
    <p>À la première ouverture, Akiba affiche un groupe de <b>démonstration</b> : vingt membres, quatorze réunions déjà tenues, tous les codes secrets à <b>1234</b>. Tenez une réunion entière dessus. Rien de ce que vous faites là ne touche à de vraies données, et <b>Remettre la démonstration à zéro</b> efface tout.</p>
    <h4>2. Valider le téléphone</h4>
    <p>Un téléphone qui portera de vraies données doit être validé par Ubora : voir <b>Les codes de validation d'Ubora</b>. Comptez cinq minutes et un appel.</p>
    <h4>3. Recevoir ou créer le cahier</h4>
    <p>Si l'animateur a créé le groupe, il vous le remet par <b>fichier</b> ou par <b>image</b>. Si le groupe est seul, créez-le vous-même avec l'assemblée : voir <b>Créer l'AVEC et commencer</b>.</p>
    <h4>4. Distribuer les codes secrets</h4>
    <p>Akiba affiche le code de chaque membre <b>une seule fois</b>. Recopiez-les sur de petits papiers pliés, donnez-les en main propre, et rangez la carte de secours dans la caisse.</p>
    <h4>5. Prendre deux habitudes</h4>
    <ul>
      <li><b>Après chaque réunion</b> : imprimer le journal de la séance et le classer dans la caisse.</li>
      <li><b>Après chaque réunion</b> : créer une sauvegarde et la garder ailleurs que sur le téléphone.</li>
    </ul>
    <div class="tip">Vous n'avez besoin de personne pour commencer. Tout ce que fait Akiba est écrit dans ce guide, et le guide fonctionne sans réseau.</div>` },

  { id: 'debut', icon: 'plus', t: 'Créer l\'AVEC et commencer', b: `
    <p>Touchez <b>Commencer notre AVEC</b> sur l'écran d'accueil. La première fois, Akiba demande le <b>code de validation</b> délivré par l'Entreprise Sociale Ubora. Un animateur ou une organisation crée l'AVEC depuis son propre espace. Tout se prépare en 5 étapes, avec l'assemblée réunie.</p>
    <ol>
      <li><b>Groupe</b> : nom, puis le lieu. La <b>province</b> et le <b>territoire ou la ville</b> se choisissent dans la liste officielle de toute la RDC (26 provinces, 145 territoires, villes et communes de Kinshasa). Le secteur, le groupement et le village s'écrivent : les noms déjà utilisés sont proposés pour éviter les fautes. Puis le jour et le rythme des réunions. L'organisation choisit aussi l'animateur.</li>
      <li><b>Point GPS</b> (facultatif) : à l'étape <b>Groupe</b>, « Prendre le point maintenant » enregistre où le groupe se réunit. C'est le bon moment — l'assemblée est là, et on est sur place. Sinon, plus tard dans <b>Plus › Lieu du groupe</b>.
        <ul><li>Il faut être <b>dehors</b>, à ciel ouvert. Le premier point peut demander une minute.</li>
          <li><b>Pas besoin de réseau</b> : le téléphone lit les satellites.</li>
          <li>Le point entre dans le journal scellé et part avec les données. L'organisation le retrouve dans l'export Excel.</li></ul></li>
      <li><b>Règlement</b> : valeur d'une part, nombre de parts par réunion, caisse sociale, durée et date de début du cycle, intérêt, crédit maximum, durée des crédits, amendes. Un exemple chiffré montre ce que les règles donnent.</li>
      <li><b>Membres</b> : une fiche par personne. <b>Obligatoire</b> : nom et sexe. <b>Facultatif</b> : âge, téléphone, activité, adresse. Pour aller plus vite, on peut aussi coller une liste de noms, puis compléter les fiches.</li>
      <li><b>Bureau</b> : président, secrétaire, trésorier, deux compteurs et <b>trois porte-clés</b>. Le trésorier garde la caisse, il ne peut donc pas garder une clé.</li>
      <li><b>Démarrage</b> : <b>Nouveau groupe</b> (caisse vide) ou <b>Groupe déjà en cours</b>.</li>
    </ol>
    <h4>Groupe qui avait déjà un cahier</h4>
    <p>Choisissez « Groupe déjà en cours » et recopiez le cahier : parts achetées par chaque membre, reste à payer sur chaque crédit, caisse sociale, puis l'argent compté dans la caisse de crédit. Akiba enregistre tout dans une séance « Reprise du cahier », scellée. S'il manque de l'argent par rapport au cahier, l'écart est signalé.</p>
    <div class="tip">À la fin, Akiba affiche <b>un code secret différent pour chaque membre</b>, une seule fois. Recopiez-les sur de petits papiers et donnez-les en main propre.</div>` },
  { id: 'connexion', icon: 'users', t: 'Comment une AVEC se connecte', b: `
    ${FIG.photo('guide-accueil.jpg', 'L’accueil du groupe : la caisse, ce qu’il faut surveiller, et le geste du jour.')}
    ${FIG.droits()}
    <p>L'écran d'accueil tient sur un seul écran, quel que soit le téléphone.</p>
    <ul>
      <li>Le grand bouton jaune <b>AVEC</b> mène aux noms des membres.</li>
      <li>Sur un téléphone encore vide, il devient <b>Entrer mon AVEC</b> : recevoir l'AVEC (fichier et code de l'animateur), ou la créer.</li>
      <li><b>Recevoir une AVEC</b> est en bas de l'écran.</li>
    </ul>
    ${!estSuivi() ? '' : `<div class="alert"><div><b>Sur Akiba Suivi, l'accueil ne montre que l'entrée</b><span class="small">Recevoir une AVEC et la Formation sont des gestes de métier : ils sont dans l'espace de l'animateur (bouton <b>Recevoir une AVEC</b> et onglet <b>Formation</b>) et dans les <b>Outils</b> de l'organisation. L'accueil ne garde que le guide.</span></div></div>`}
    ${estSuivi() ? '' : `<div class="alert"><div><b>Les autres espaces ont leur propre application</b><span class="small">L'animateur, l'organisation et l'administration d'Ubora travaillent sur <b>Akiba Suivi</b> (akibas.uborardc.com). Celle-ci est l'application du groupe : elle ne contient plus ces espaces.</span></div></div>`}
    <h4>L'AVEC a été créée sur son propre téléphone</h4>
    <ol>
      <li>Ouvrir Akiba et toucher le grand bouton jaune <b>AVEC</b>. S'il n'y a qu'une AVEC sur le téléphone (ou si c'est la dernière utilisée), son nom est déjà affiché.</li>
      <li><b>Tenir la réunion</b> : le président, le secrétaire ou le trésorier présent touche son nom (ils sont seuls dans cette partie) et tape son code secret. Puis <b>Ouvrir la réunion</b> (ou <b>Continuer la réunion</b>).</li>
      <li><b>Voir mon carnet</b> : tout membre touche <b>Tous les membres</b>, cherche son nom, tape son code et voit son épargne, ses crédits et ses amendes.</li>
    </ol>
    <div class="tip">Une <b>AVEC autonome</b> n'a besoin ni d'animateur ni d'organisation : elle se crée directement sur son propre téléphone, et tout se passe dans le groupe (réunions, codes perdus, changement de téléphone).</div>
    <h4>AVEC accompagnée, créée sur le téléphone de l'animateur</h4>
    <ol><li>L'animateur ouvre l'AVEC puis touche <b>Envoyer vers le téléphone du groupe</b>.</li>
      <li>Il envoie le fichier <b>.akiba</b> par WhatsApp, Bluetooth ou carte mémoire, et dit le <b>code de 8 signes</b> de vive voix.</li>
      <li>Sur le téléphone du groupe : ouvrir Akiba, toucher <b>Recevoir une AVEC</b>, choisir le fichier, taper le code. La validation arrive avec le fichier : ce téléphone tient les réunions de son AVEC.</li>
      <li>Les membres se connectent ensuite avec leur nom et leur code.</li></ol>
    <h4>Les codes se tapent comme on peut</h4>
    <p>Tous les codes d'Akiba s'affichent <b>d'un seul bloc, sans tiret</b> : le code du téléphone, le code de
      demande, le code d'activation, le code de transfert. C'est ainsi qu'on les dicte et qu'on les retape.</p>
    <p>À la saisie, Akiba accepte tout ce qu'un doigt peut écrire : avec tiret, avec des espaces, en minuscules,
      ou <b>le message WhatsApp collé en entier</b> — il y retrouve le code tout seul. S'il y a deux codes
      possibles dans le texte, il ne devine pas : recopiez alors seulement les huit signes.</p>
    <h4>Le groupe change de téléphone</h4>
    <p>Sur l'ancien téléphone : <b>Plus › Changer de téléphone</b>, puis même chose. L'ancien téléphone garde une copie mais ne peut plus ouvrir de réunion : il n'y a jamais deux cahiers différents.</p>
    <h4>Le groupe avait un cahier papier</h4>
    <p>À la création, choisir <b>Groupe déjà en cours</b> et recopier le cahier (voir « Créer l'AVEC »).</p>` },
  { id: 'reunion', icon: 'calendar', t: 'La réunion, étape par étape', b: `
    ${FIG.photo('guide-reunion.jpg', 'L’étape de l’épargne : chaque membre achète ses parts.')}
    ${FIG.etapes()}
    <p>Sur l'accueil, un membre du bureau touche <b>Ouvrir la réunion</b>. Akiba guide la réunion dans l'ordre. On ne peut pas sauter une étape.</p>
    <ol>
      <li><b>Présences</b> : pour chaque membre, touchez « Là », « Retard » ou « Absent ».</li>
      <li><b>Comptage</b> : les porte-clés ouvrent la caisse devant tous. On compte l'argent et on écrit le montant. S'il ne correspond pas au cahier, il faut expliquer l'écart.</li>
      <li><b>Caisse sociale</b> : chaque présent verse la cotisation. On peut aussi donner une aide (maladie, deuil).</li>
      <li><b>Épargne</b> : chaque membre achète autant de parts que le règlement autorise (3, 5 ou 10) avec les boutons + et −. Les timbres jaunes montrent les parts.</li>
      <li><b>Remboursements</b> : écrivez ce que chaque emprunteur rembourse. « Échéance » met le montant prévu.</li>
      <li><b>Crédits</b> : l'assemblée écoute les demandes. Akiba montre le maximum permis et calcule l'intérêt.</li>
      <li><b>Amendes</b> : les retards paient sur place. L'amende d'un absent est notée comme dette.</li>
      <li><b>Clôture</b> : on recompte tout l'argent, les trois porte-clés tapent leur code et la réunion est <b>scellée</b>.</li>
    </ol>
    <h4>D'une réunion à l'autre</h4>
    <p>Akiba reprend la suite tout seul : au début, un <b>résumé de la réunion précédente</b> (caisse, échéances du jour, amendes dues, absents) ; à l'épargne, les <b>parts habituelles</b> de chaque membre sont proposées ; aux remboursements, les <b>échéances du jour</b> sont déjà écrites. Il suffit de vérifier et de corriger.</p>
    <div class="tip">Si le téléphone s'éteint pendant la réunion, rien n'est perdu : touchez <b>Continuer la réunion</b>.</div>` },
  { id: 'epargne', icon: 'coins', t: 'Épargne et parts', b: `
    <p>L'épargne se fait en <b>parts</b>. Toutes les parts ont la même valeur pendant le cycle (par exemple 1 000 FC). À chaque réunion, un membre achète de 1 à 3, 5 ou 10 parts, selon ce que l'assemblée a voté au début du cycle.</p>
    <p>Le carnet du membre montre ses parts à chaque réunion, son épargne totale et <b>la valeur de ses parts si le partage avait lieu aujourd'hui</b>. Cette valeur augmente grâce aux intérêts et aux amendes.</p>` },
  { id: 'credit', icon: 'hand', t: 'Les crédits', b: `
    <div class="tip">L'<b>échéance</b> d'un crédit tombe toujours un <b>jour de réunion</b> : personne ne peut rembourser
      un mardi si le groupe se réunit le samedi. Si le calcul tombe entre deux réunions, Akiba reporte à la suivante —
      jamais avant, pour ne pénaliser personne.</div>
    <h4>Règles appliquées par Akiba</h4>
    <ul>
      <li>Un membre emprunte au plus <b>3 fois son épargne</b>, et jamais plus que l'argent disponible dans la caisse de crédit.</li>
      <li><b>Un seul crédit à la fois</b> par membre.</li>
      <li>La durée ne dépasse pas le maximum voté, et le crédit doit être <b>remboursé avant la fin du cycle</b>.</li>
      <li>Chaque crédit est validé par <b>un 2ᵉ membre du bureau</b> avec son code. L'emprunteur ne peut pas valider son propre crédit.</li>
    </ul>
    <h4>Exemple de calcul</h4>
    <div class="formula">Crédit 50 000 FC · 10 % par mois · 3 mois<br>Intérêt = 50 000 × 10 % × 3 = 15 000 FC<br>À rembourser = 65 000 FC, soit environ 21 700 FC par mois</div>
    <h4>Demandes non servies : chacun son tour</h4>
    <p>La caisse n'a pas assez pour tout le monde ? À l'étape <b>Crédits</b>, touchez <b>Noter une demande non servie</b>.</p>
    <ul>
      <li>Ces membres reviennent <b>en haut de l'étape</b> à la réunion suivante.</li>
      <li><b>Dans l'ordre où ils se sont inscrits</b> : le premier inscrit est servi le premier.</li>
      <li><b>Servir</b> ouvre la demande avec le montant déjà écrit. Le crédit accordé, le nom sort de la liste.</li>
    </ul>
    <p>La liste d'attente repart à zéro au partage de fin de cycle.</p>
    <h4>Pénalité de retard</h4>
    <p>Un crédit qui dépasse sa date de fin paie une <b>pénalité de retard</b>. Le taux est voté dans le règlement — par défaut celui du crédit, et « aucune pénalité » est possible.</p>
    <ul>
      <li>Akiba la calcule : <b>reste à rembourser × taux × mois commencés de retard</b>, arrondie à 100 FC.</li>
      <li><b>Un mois déjà payé ne l'est jamais deux fois</b> : Akiba relit le journal scellé.</li>
      <li>Elle est proposée à l'étape <b>Amendes</b>, cochée d'avance. Le bureau peut la retirer si l'assemblée l'a décidé — maladie, deuil.</li>
      <li>Enregistrée, elle entre dans la caisse comme une amende, et s'inscrit dans le carnet du membre.</li>
    </ul>
    <div class="formula">Exemple : reste 30 000 FC · 10 % par mois · 45 jours de retard (2 mois commencés)<br>Pénalité = 30 000 × 10 % × 2 = 6 000 FC</div>
    <h4>Solder un crédit avant la fin</h4>
    <p>Un membre peut rembourser tout ce qui reste avant l'échéance : à l'étape « Remboursements », touchez <b>Solder</b> à côté de son nom. Akiba écrit le reste dû en entier ; le crédit passe aussitôt en « soldé » et le membre peut redemander un crédit.</p>
    <p>Un crédit qui n'est pas soldé à la date prévue passe <b>en retard</b> (en rouge). Le <b>PAR</b> (portefeuille à risque) est la part de l'argent prêté qui est en retard. Au-dessus de 10 %, c'est une alerte grave.</p>` },
  { id: 'externe', icon: 'building', t: 'Crédit extérieur (IMF, banque, ONG)', b: `
    <p>Quand l'épargne des membres ne suffit plus à servir toutes les demandes, le groupe peut <b>emprunter à l'extérieur</b> pour renforcer sa caisse de crédit. Cet argent n'appartient pas aux membres : c'est une <b>dette du groupe</b>. Tout se suit dans <b>Plus › Crédit extérieur (IMF)</b>.</p>
    <h4>Les règles vérifiées par Akiba</h4>
    <ul>
      <li>L'<b>intérêt du prêteur ne dépasse pas 5 % par mois</b> : au-delà, Akiba refuse d'enregistrer le crédit.</li>
      <li>Le crédit doit être <b>entièrement remboursé avant la fin du cycle</b> : la durée est refusée si elle dépasse la date de fin, car le partage vient après.</li>
      <li>La <b>date de l'assemblée générale</b> et les votes sont obligatoires, avec une majorité pour.</li>
      <li>Un <b>2ᵉ membre du bureau</b> valide avec son code, comme pour un crédit interne.</li>
      <li>Les frais ne peuvent pas dépasser le montant accordé.</li>
    </ul>
    <h4>Le chemin, de la demande au remboursement</h4>
    <ol>
      <li><b>Décider en assemblée générale</b> : montant, prêteur, durée. Akiba enregistre la date de l'AG et le nombre de voix pour et contre.</li>
      <li><b>Préparer le dossier</b> : <b>Plus › Dossier pour une IMF</b> écrit un fichier Excel à partir du cahier scellé (ancienneté, présence, épargne, remboursements à temps, PAR, écarts de caisse). Jamais de téléphone ni d'adresse ; les noms sont remplacés par « Membre 1, Membre 2… » si l'assemblée le préfère.</li>
      <li><b>Déposer la demande</b> : notez-la dans l'écran du crédit extérieur (prêteur, montant, durée). Elle reste « Déposée » jusqu'à la réponse.</li>
      <li><b>Réponse de l'IMF</b> : marquez <b>Accordée</b> ou <b>Refusée</b> pour garder la trace de la démarche. Ces demandes sont des notes de suivi, sans argent : seules les étapes qui déplacent de l'argent sont écrites dans le journal scellé.</li>
      <li><b>Recevoir l'argent en réunion</b> : étape « Crédits » › <b>Recevoir un crédit</b>. L'argent est compté devant tous, validé par un 2ᵉ membre du bureau, et entre dans la <b>caisse de crédit</b>.</li>
      <li><b>Payer les frais</b> : adhésion, dossier, assurance… Ils sortent de la caisse et sont comptés dans le coût du crédit.</li>
      <li><b>Rembourser chaque mois</b> : étape « Crédits » › <b>Rembourser le prêteur</b>. Akiba affiche l'échéance conseillée, ce qui reste, et prévient en cas de retard.</li>
      <li><b>Solder avant le partage</b> : au partage de fin de cycle, le prêteur est remboursé <b>en premier</b> avec la caisse de crédit ; les membres ne partagent que ce qui reste.</li>
    </ol>
    <h4>Garantie retenue par le prêteur</h4>
    <p>Beaucoup d'IMF gardent un <b>pourcentage du crédit en garantie</b>, souvent 5 à 20 %. Écrivez-le au moment de recevoir le crédit.</p>
    <ul>
      <li>Akiba ne le compte pas dans la caisse : le groupe reçoit moins d'argent.</li>
      <li>Il le <b>déduit de la fin de la dette</b>. Au dernier versement, le groupe ne paie que le solde — la garantie déjà chez le prêteur éteint le reste.</li>
      <li>Maximum accepté : 30 %.</li>
    </ul>
    <div class="formula">Exemple : crédit 300 000 FC · garantie 10 % · intérêt 2 % par mois sur 6 mois<br>Garantie = 30 000 FC (gardés par l'IMF)<br>Entre dans la caisse = 300 000 − 30 000 − frais<br>Total dû = 336 000 FC, moins la garantie → le groupe verse 306 000 FC</div>
    <h4>Comment cet argent alimente le fonds de crédit</h4>
    <div class="formula">Caisse de crédit = épargne des membres + remboursements + amendes<br>+ argent reçu de l'IMF − frais payés − remboursements au prêteur</div>
    <p>L'argent emprunté se prête aux membres comme l'épargne du groupe, aux mêmes règles : 3 fois l'épargne au plus, un seul crédit à la fois, intérêt voté par l'assemblée.</p>
    <p>Les intérêts que paient les membres restent au groupe. Ceux que le groupe paie à l'IMF sortent de la caisse.</p>
    <p><b>La différence entre les deux taux est le gain du groupe.</b> Prêter à 10 % et emprunter à 2,5 % rapporte 7,5 points — si les membres remboursent à temps.</p>
    <h4>Effet sur la valeur des parts</h4>
    <p>Tant que la dette n'est pas remboursée, Akiba la <b>retire</b> de la valeur d'une part : personne ne partage de l'argent emprunté. L'écran <b>Comment l'argent circule</b> montre, en chiffres réels, ce qui est entré, ce qui est sorti et ce qui reste dû.</p>
    <div class="tip">N'empruntez que ce que les membres demandent vraiment : un crédit extérieur qui dort dans la caisse coûte des intérêts sans rien rapporter.</div>` },
  { id: 'qualite', icon: 'chart', t: 'Qualité des données et « prête pour une IMF »', b: `
    <p>Deux indicateurs résument ce qu'une IMF ou un bailleur regarde avant de faire confiance au groupe. On les trouve dans <b>Plus › Dossier pour une IMF</b> et, pour l'animateur et l'organisation, sur la fiche de chaque AVEC.</p>
    <h4>Indice de qualité des données (sur 100)</h4>
    <ul>
      <li><b>Journal scellé intact</b> : 25 points.</li>
      <li><b>Réunions régulières</b> (la dernière date de moins d'un rythme et demi) : 20 points.</li>
      <li><b>Caisse juste à la clôture</b>, réunion après réunion : 20 points.</li>
      <li><b>Données envoyées à l'organisation</b> depuis moins de 7 jours : 15 points (acquis d'office pour une AVEC autonome).</li>
      <li><b>Caisse fermée avec les trois clés</b> : 10 points.</li>
      <li><b>Fiches des membres complètes</b> (téléphone et activité) : 10 points.</li>
    </ul>
    <p>80 et plus : qualité <b>bonne</b> ; de 60 à 79 : <b>moyenne</b> ; en dessous : <b>faible</b>. Chaque ligne montre ce qui manque.</p>
    <h4>« Prête pour une IMF »</h4>
    <p>Le groupe est <b>prêt</b> quand les sept critères sont remplis, <b>presque prêt</b> s'il en manque un ou deux :</p>
    <ol>
      <li>au moins 6 mois d'activité ;</li>
      <li>au moins 90 % des crédits remboursés à temps (sur 3 crédits soldés au moins) ;</li>
      <li>portefeuille à risque de 5 % au plus ;</li>
      <li>présence d'au moins 80 % ;</li>
      <li>au plus un écart de caisse dans le cycle ;</li>
      <li>qualité des données bonne (80 sur 100) ;</li>
      <li>aucun crédit extérieur en retard.</li>
    </ol>
    <div class="tip">Ces indicateurs portent sur le <b>groupe</b>, jamais sur un membre : aucune donnée personnelle n'est utilisée ni partagée.</div>` },
  { id: 'recus', icon: 'clip', t: 'Reçus des membres, imprimés ou partagés', b: `
    ${FIG.photo('guide-recu.jpg', 'Le reçu d’une réunion, tel qu’il sortira de l’imprimante.')}
    <p>Après la clôture d'une réunion, l'écran du reçu propose <b>Reçus des membres</b> : un ticket par personne présente.</p>
    <h4>Ce que contient le ticket</h4>
    <ul>
      <li>le nom du groupe, le numéro et la date de la réunion ;</li>
      <li>le membre, son rôle et sa présence ;</li>
      <li>l'<b>épargne du jour</b> (parts et montant) et le <b>cumul du cycle</b> ;</li>
      <li>la caisse sociale, les <b>amendes</b> payées ou dues ;</li>
      <li>le <b>crédit</b> : accordé, remboursé, reste à rembourser et échéance ;</li>
      <li>la valeur estimée de ses parts ;</li>
      <li>une <b>référence</b> du genre <b class="mono">14-A78E64</b> : c'est elle qui permet de vérifier le reçu.</li>
    </ul>
    <h4>Reçu court ou reçu détaillé</h4>
    <p>Le papier thermique coûte cher et se trouve mal. Akiba imprime donc un <b>reçu court</b> : trois fois moins de papier.</p>
    <p>Sur une réunion de vingt membres, <b>184 cm de bande au lieu de 5 mètres</b>.</p>
    <p>Le court garde tout ce qui prouve : le nom, la réunion, ce qui a bougé ce jour-là, le cumul du cycle, le crédit restant, la référence.</p>
    <p>Le format se change d'un toucher sur l'écran des reçus, qui annonce la longueur de chacun.</p>
    <h4>Un membre conteste son reçu</h4>
    <p>C'est le cas le plus difficile d'une AVEC : trois mois plus tard, quelqu'un dit « on m'a écrit deux parts,
      j'en avais payé trois ». Avant, seul le téléphone du groupe pouvait trancher — et c'est justement lui que l'on
      soupçonne.</p>
    <p>N'importe quel téléphone du groupe fait le juge : <b>Reçus des membres › Vérifier un reçu contesté</b>.</p>
    <ul>
      <li>Visez le QR du reçu, ou recopiez la <b>référence</b> et le nom.</li>
      <li>Akiba refait le calcul <b>sans réseau</b> : « Reçu authentique » et les montants — ou bien ce que le journal annonce vraiment.</li>
      <li>Refait, attribué à quelqu'un d'autre, venu d'un autre groupe : refusé.</li>
    </ul>
    <div class="tip">Le QR n'est imprimé ni sur le reçu court ni en série : il est à l'écran et sur le reçu partagé par
      WhatsApp. Sur le papier, c'est la <b>référence en chiffres</b> qui sert, et elle se recopie à la main.</div>
    <h4>Le journal de la séance : votre sauvegarde en papier</h4>
    <p>À la clôture, Akiba propose d'imprimer le <b>journal de la séance</b> : toutes les écritures du jour dans
      l'ordre, les totaux, l'ouverture et la clôture, l'écart et son explication, les trois clés et les
      remplacements, le sceau. Faites-le à chaque réunion.</p>
    <p><b>Pourquoi.</b> Si le téléphone est perdu, volé, noyé ou cassé, ce papier est ce qui reste du cahier.
      Les séances mises bout à bout redonnent tout le journal.</p>
    <p><b>Comment le classer.</b> Le bas du ticket porte une étiquette lisible sans le déplier, du genre
      <b class="mono">A CLASSER : C1 - S14</b> — cycle 1, séance 14. Rangez-les <b>dans l'ordre des numéros</b>,
      dans une pochette gardée <b>à l'intérieur de la caisse</b>, avec les trois clés. Une pochette par cycle.</p>
    <h4>Imprimer le journal d'une période</h4>
    <p>Dans l'onglet <b>Journal</b>, le bouton <b>Imprimer le journal</b> demande la période (7 jours, 30 jours, ce cycle, tout, ou deux dates au choix). Akiba annonce le nombre d'écritures et la <b>longueur de papier</b> avant d'imprimer.</p>
    <p>Le ticket reprend chaque écriture jour par jour (numéro, nature, membre, montant), puis les <b>totaux de la période</b>, ce qui est entré et sorti de la caisse, le mouvement net, la caisse du jour et l'<b>empreinte de la dernière écriture</b>. C'est ce document qu'on remet à un contrôleur, à l'animateur ou à une IMF.</p>
    <h4>Imprimer</h4>
    <ul>
      <li><b>Terminal POS Android</b> (imprimante intégrée) : ouvrez Akiba depuis l'application Android et touchez <b>Imprimer</b>. Le bouton <b>Imprimer les reçus</b> les sort tous à la suite.</li>
      <li><b>Imprimante Bluetooth</b> : installez l'application gratuite <b>RawBT</b>, associez l'imprimante, puis touchez Imprimer. Un ticket à la fois.</li>
      <li><b>Sans imprimante</b> : touchez <b>Partager</b> pour envoyer le reçu par WhatsApp ou SMS, ou le copier.</li>
    </ul>
    <p>Le ticket est écrit sans accent, sur 32 signes de large : c'est ce que lisent les imprimantes thermiques de 58 mm. Tout marche <b>sans réseau</b>.</p>
    <div class="tip">Le papier coûte : imprimez pour tout le monde en fin de cycle, et à la demande le reste du temps.</div>` },
  { id: 'cartes', icon: 'clip', t: 'Cartes de membre en papier', b: `
    <p>Chaque membre peut avoir une <b>carte en papier</b> au format d'une carte bancaire. Dans l'espace du bureau : <b>Membres › Cartes des membres</b>.</p>
    <h4>Imprimer</h4>
    <ul>
      <li><b>Sur une feuille A4</b> : dix cartes par page, à découper en suivant les traits. N'importe quelle imprimante, même en noir et blanc.</li>
      <li><b>Sur le terminal</b> : la même carte sort sur la bande de 58 mm, là où il n'y a pas d'imprimante A4.</li>
    </ul>
    <h4>Ce qu'il y a sur la carte</h4>
    <p>Le nom du groupe, le village, le nom du membre, son rôle, son numéro, sa date d'entrée — et une <b>référence</b> du genre <b class="mono">642-AF76CE</b> avec un QR code qui porte la même chose. <b>Aucun code secret, aucun montant</b> : une carte se perd, se prête ou se photographie sans conséquence.</p>
    <h4>Vérifier une carte</h4>
    <p><b>Cartes des membres › Vérifier une carte</b> : visez le QR avec l'appareil photo. Akiba refait le calcul <b>sans réseau</b> et répond « Carte authentique » ou dit pourquoi elle est refusée — carte recopiée, carte venue d'un autre groupe, membre inconnu. Si le téléphone ne lit pas les QR codes, recopiez la référence et le nom à la main.</p>
    <div class="tip">La référence est ancrée sur le journal au moment de l'impression : <b>une carte imprimée aujourd'hui reste valable</b> après les réunions suivantes. Elle ne devient fausse que si on la recopie ou si on la fabrique ailleurs.</div>` },
  { id: 'social', icon: 'shield', t: 'La caisse sociale', b: `
    <p>C'est une caisse de solidarité, séparée de la caisse de crédit. Chaque membre présent verse une petite somme à chaque réunion.</p>
    <ul>
      <li>Elle sert à aider un membre en difficulté : maladie, deuil, incendie.</li>
      <li>Chaque aide demande une raison écrite et <b>la validation d'un 2ᵉ membre du bureau</b>.</li>
      <li>La caisse sociale <b>n'est pas partagée</b> en fin de cycle : elle passe au cycle suivant.</li>
    </ul>` },
  { id: 'guichet', icon: 'coins', t: 'Le guichet entre les réunions', b: `
    ${FIG.photo('guide-guichet.jpg', 'L’écran du guichet : ce qui est déposé, ce qu’il y a dans la caisse, les quatre gestes.')}
    ${FIG.poches()}
    <p>Le guichet est <b>facultatif</b> : l'assemblée le vote à la création, et peut l'ouvrir plus tard dans <b>Plus › Règlement</b>. Sans lui, l'argent ne bouge qu'en réunion, comme toujours.</p>
    <p>Avec lui, un membre peut <b>confier de l'argent</b> ou <b>le reprendre</b> un autre jour, au village, sans attendre la réunion.</p>
    <ul>
      <li><b>L'argent déposé n'est jamais prêté.</b> Il dort dans la caisse et se reprend n'importe quel jour d'ouverture. Les crédits se font avec l'épargne en parts, pas avec les dépôts.</li>
      <li>Un <b>retrait</b> demande le code secret <b>du membre lui-même</b> : personne ne sort l'argent d'un autre, pas même le bureau.</li>
      <li>Une séance de guichet s'ouvre en comptant la caisse devant un deuxième membre du bureau, et se ferme de la même façon. Les deux comptages entrent dans le journal scellé.</li>
      <li>Le guichet ne s'ouvre pas pendant une réunion, et une réunion ne s'ouvre pas pendant le guichet.</li>
    </ul>
    <div class="tip">Un dépôt n'est pas de l'épargne en parts : il ne donne pas droit à un crédit plus grand et ne compte pas au partage. C'est l'argent du membre, gardé par le groupe.</div>` },
  { id: 'livret', icon: 'book', t: 'Le livret du membre', b: `
    <p>Chaque membre peut repartir avec <b>sa page</b> : ce que le cahier dit de lui, sur une feuille A4 qu'il garde chez lui.</p>
    <ul>
      <li><b>Membres › son nom › Livret</b> : les parts achetées réunion par réunion, les mouvements du guichet, les crédits, le solde, et deux lignes de signature.</li>
      <li><b>Membres › Livrets</b> pour tout le groupe — et vous <b>choisissez qui</b> : touchez les noms, ou <b>Ceux qui ont un crédit</b>. Seuls les livrets cochés partent à l'impression. Une page A4 par membre, c'est trente feuilles pour trente membres : on réimprime rarement pour tous.</li>
      <li><b>Relevé sur le terminal</b> : le même compte, en court, sur le rouleau de l'imprimante.</li>
      <li>Chaque livret porte une référence qui dit de quel cahier et de quelle écriture il est tiré : on peut le confronter au journal.</li>
    </ul>
    <div class="tip">C'est la réponse à « combien j'ai, moi ? » sans ouvrir le cahier du groupe devant tout le monde.</div>` },
  { id: 'image', icon: 'eye', t: 'Donner une AVEC, ou une réunion, par image', b: `
    <p>Sans réseau, sans câble, sans WhatsApp : l'animateur <b>montre une image</b> à l'écran, le téléphone du groupe la <b>photographie</b>. L'image est chiffrée ; un code de huit signes se dit de vive voix, jamais dans le même message.</p>
    <h4>De l'animateur vers le groupe</h4>
    <ul>
      <li>Chez l'animateur : la fiche du groupe › <b>Montrer l'AVEC en image</b>. Une ou deux images selon la taille du groupe.</li>
      <li>Sur le téléphone du groupe : <b>Recevoir par photo</b>, viser les images l'une après l'autre, puis taper les huit signes.</li>
      <li>Pour un groupe <b>neuf</b>, le jour de sa création : une ou deux images suffisent.</li>
    </ul>
    <h4>Un cahier qui a déjà vécu</h4>
    <p>Il ne tient plus dans une image, mais il tient souvent dans <b>quelques-unes</b>. Sur la fiche du groupe : <b>Montrer le cahier en images</b> — le bouton annonce le nombre, et il ne s'affiche que si le cahier tient en <b>vingt-cinq images</b> au plus.</p>
    <ul>
      <li>Les images <b>défilent toutes seules</b>, deux secondes chacune, et <b>recommencent</b> sans fin. Celui d'en face vise sans se presser : celle qu'il rate reviendra.</li>
      <li>Son écran lui dit où il en est — « 5 images sur 7 · il manque la n° 6 » — jusqu'à ce que le cahier s'ouvre tout seul.</li>
      <li>Plus gros que vingt-cinq images : c'est le <b>fichier</b>. Le bouton disparaît de lui-même, il n'y a rien à juger.</li>
    </ul>
    <h4>Le fichier reçu par WhatsApp</h4>
    <p>Quand le cahier arrive en fichier dans un message, <b>touchez-le dans le message</b> et choisissez <b>Akiba</b> dans la liste que propose le téléphone. Il ne reste que les huit signes à taper. Plus besoin de l'enregistrer puis d'aller le rechercher dans les dossiers du téléphone.</p>
    <div class="tip">Le fichier reste chiffré jusqu'au bout : l'ouvrir dans Akiba n'ouvre rien tant que le code de huit signes n'est pas tapé.</div>
    <h4>Du groupe vers l'animateur</h4>
    <ul>
      <li>Après la clôture : <b>Montrer à l'animateur</b>. La séance tient en <b>une image</b> jusqu'à une quinzaine de membres, <b>deux</b> au-delà.</li>
      <li>Sur le téléphone de l'animateur : <b>Recevoir par photo</b>. Il tient l'appareil en face, les images <b>défilent toutes seules</b>, et celle qu'il rate revient.</li>
      <li>La copie de l'animateur <b>se prolonge</b> de cette séance ; elle ne remplace rien. S'il manque une réunion entre les deux, Akiba refuse et demande le fichier.</li>
      <li>Tout y est : <b>chaque opération de chaque membre</b> ce jour-là, les totaux, les clés et le sceau. L'animateur peut réimprimer le journal de la séance à l'identique.</li>
    </ul>
    <div class="tip">Les deux téléphones doivent avoir la <b>même version</b> d'Akiba. Si l'un est en retard, l'écran le dit et il suffit de le mettre à jour.</div>
    <div class="tip">L'image se partage aussi comme une photo ordinaire, par WhatsApp ou Bluetooth, quand il y a du réseau. Le code, lui, se dit à part.</div>` },
  { id: 'amendes', icon: 'gavel', t: 'Les amendes', b: `
    <ul>
      <li><b>Retard</b> : le membre est là, il paie tout de suite.</li>
      <li><b>Absence</b> : le membre n'est pas là, il ne peut pas payer. Akiba note une <b>amende due</b>, sans compter d'argent dans la caisse. Elle est proposée au paiement dès sa prochaine présence.</li>
      <li><b>Autres amendes</b> (bavardage, téléphone, oubli) : bouton « Autre amende ».</li>
    </ul>
    <h4>Un retard ou une absence justifiée</h4>
    <p>Un deuil, une maladie, un accouchement, une route coupée : l'assemblée peut décider qu'il n'y a pas d'amende. À l'étape des <b>présences</b>, touchez <b>« Donner un motif »</b> sous le nom de la personne, choisissez la raison (ou écrivez-la), et l'amende <b>n'est plus proposée</b> à l'étape 7.</p>
    <p>Le motif est écrit dans le journal scellé, imprimé sur le journal de la réunion, et compté à part dans l'export de l'organisation : un groupe qui a enterré deux des siens ne doit pas ressembler à un groupe négligent.</p>
    <div class="tip">Le motif n'est pas une faveur du bureau : c'est l'assemblée qui décide, à haute voix. Le bureau peut toujours remettre l'amende, et Akiba garde trace de qui a justifié quoi.</div>
    <div class="tip">Une amende due qui n'est jamais payée est retirée de la part du membre au partage.</div>` },
  { id: 'securite', icon: 'lock', t: 'Sécurité et contrôle contre la fraude', b: `
    ${FIG.journal()}
    <ul>
      <li><b>Code secret personnel</b> de 4 chiffres. Après 3 codes faux, le clavier se bloque 30 secondes.</li>
      <li><b>Verrouillage automatique</b> après 15 minutes sans activité.</li>
      <li><b>Trois clés</b> : la clôture de chaque réunion exige le code des trois porte-clés. Personne n'ouvre ni ne ferme la caisse seul.</li>
      <li><b>Deux personnes</b> pour chaque crédit, aide, annulation, arrivée ou départ de membre.</li>
      <li><b>Comptage obligatoire</b> à l'ouverture et à la clôture. Tout écart doit être expliqué, et il est envoyé à l'animateur et à l'organisation.</li>
      <li><b>Rien ne s'efface.</b> Une erreur se corrige avec « Annuler » dans le Journal, pendant la réunion, avec une raison. L'annulation reste visible par tous.</li>
      <li><b>Journal scellé</b> : chaque écriture contient l'empreinte de la précédente. Changer un seul chiffre casse la chaîne, et Akiba affiche « Fraude détectée ».</li>
      <li><b>Soldes calculés</b> : personne ne peut taper un solde à la main. Tout vient des écritures.</li>
    </ul>` },
  { id: 'validation', icon: 'clip', t: 'Validation d\'une AVEC par l\'organisation', b: `
    <p>Une AVEC créée par un <b>animateur</b> doit être <b>validée par l'organisation</b> avant sa première réunion. Une AVEC créée par l'organisation ou une AVEC autonome est active tout de suite.</p>
    <h4>Avec réseau</h4>
    <ol><li>L'animateur crée l'AVEC, puis touche <b>Envoyer maintenant</b>.</li>
      <li>L'organisation ouvre <b>AVEC à valider</b> dans son tableau de bord. Elle relit les contrôles automatiques, le règlement, le bureau et les membres.</li>
      <li>Elle touche <b>Valider l'AVEC</b> et tape son code, ou <b>Refuser</b> en expliquant quoi corriger.</li></ol>
    <h4>Sans réseau : un simple appel</h4>
    <ol><li>Le téléphone du groupe affiche un <b>code de demande</b> de 6 signes.</li>
      <li>L'animateur ou le président appelle l'organisation et le dicte.</li>
      <li>L'organisation touche <b>Valider par téléphone</b>, tape le code et dicte en retour le <b>code d'activation</b> de 8 chiffres.</li>
      <li>Sur le téléphone du groupe : <b>Activer l'AVEC</b>. C'est fait, sans internet.</li></ol>
    <div class="tip">Le code d'activation ne marche que pour ce groupe. Après 5 codes faux, l'écran se bloque 10 minutes.</div>` },
  { id: 'codes', icon: 'key', t: 'Les codes de validation d\'Ubora', b: `
    <p>À ne pas confondre avec le code de validation d'une AVEC par son organisation (ci-dessus). Celui-ci dit qu'un <b>téléphone</b> a le droit de travailler sur de vraies données. Il vient d'Ubora, une seule fois par téléphone.</p>
    <h4>Le code de ce téléphone</h4>
    <p>Chaque téléphone a son propre code de <b>huit signes</b>, par exemple <b class="mono">B6WE766A</b>. Il s'affiche sur l'écran de validation et dans <b>Installer et sauvegarder</b>. C'est lui qu'on donne à Ubora.</p>
    <h4>Quatre façons de l'envoyer</h4>
    <p>Beaucoup d'AVEC autonomes n'ont pas WhatsApp. L'écran de validation propose donc quatre chemins — écrivez d'abord le <b>nom de votre AVEC</b>, pour qu'Ubora sache à qui rendre le code.</p>
    <ul>
      <li><b>WhatsApp</b> : s'il y a des données mobiles. Le message part tout prêt.</li>
      <li><b>SMS</b> : une simple carte SIM suffit, aucune connexion de données.</li>
      <li><b>Appel</b> : vous dictez les huit signes, Ubora vous en dicte huit en retour. Rien à écrire.</li>
      <li><b>En image</b> : ni SIM ni réseau. Touchez <b>Pas de réseau ? Montrer la demande en image</b> : l'écran affiche un QR que l'administrateur d'Ubora scane depuis son espace. C'est le chemin du village sans couverture.</li>
    </ul>
    <h4>Ce qu'Ubora renvoie</h4>
    <ul>
      <li><b>Un code court de huit signes</b>, par exemple <b class="mono">CZQGA64P</b> : il se dicte au téléphone en vingt secondes. Tapez-le dans « Code de validation reçu ».</li>
      <li><b>Un code long</b>, envoyé par WhatsApp, par QR code ou par lien : plus sûr, à préférer dès qu'on peut envoyer un message.</li>
    </ul>
    <p>Les deux ne valent que pour <b>le téléphone qui les a demandés</b>. Dictés ou collés sur un autre téléphone, ils sont refusés. Les partager ne sert à rien.</p>
    <div class="tip">Vous travaillez sans vraies données tant que ce n'est pas fait : la démonstration et le guide restent ouverts à tout le monde, sans code.</div>` },
  { id: 'cles', icon: 'lock', t: 'Un porte-clé absent, un bureau qui change', b: `
    <h4>Un porte-clé n'est pas là</h4>
    <p>La caisse ne s'ouvre qu'à trois clés : sans les trois codes, la réunion ne se ferme pas. Si un porte-clé est
      absent, touchez sa case à l'étape de clôture. <b>L'assemblée désigne</b> un membre présent pour le remplacer —
      ni le trésorier, ni un autre porte-clé — et ce membre tape <b>son propre code</b>.</p>
    <p>Le remplacement ne vaut que <b>pour cette réunion</b> : à la suivante, le porte-clé retrouve sa clé sans rien
      faire. Le nom du remplaçant reste écrit dans le journal scellé, sur le reçu et sur le journal de séance ;
      personne ne peut l'effacer. S'il n'y a aucun membre éligible, Akiba le dit : la réunion est reportée.</p>
    <h4>Changer de trésorier ou de porte-clé en cours de cycle</h4>
    <p><b>Plus › Bureau et porte-clés</b>, après la clôture d'une réunion. À utiliser quand l'assemblée l'a décidé :
      nouvelle élection, démission, départ, maladie ou décès. Un deuxième membre du bureau valide avec son code.</p>
    <p>Chaque changement est écrit dans le journal : qui perd le rôle, qui le prend, qui a validé. Changer de
      trésorier, c'est changer qui tient la caisse — cela ne doit jamais se faire en silence.</p>
    <div class="tip">Le trésorier garde la caisse : il ne peut donc jamais garder une clé. Akiba refuse cette
      combinaison, à la création comme au changement.</div>` },
  { id: 'perdu', icon: 'key', t: 'Code secret perdu : le plan B', b: `
    <p>Touchez le bouton <b>AVEC</b>, puis en bas <b>J'ai oublié mon code secret</b>, puis votre nom. Trois solutions, toutes sans internet :</p>
    <ol>
      <li><b>Deux membres du bureau</b> présents tapent leur propre code. Ils confirment que c'est bien vous.</li>
      <li><b>La carte de secours du groupe</b> : 6 codes à usage unique, reçus à la création de l'AVEC et gardés sur papier dans la caisse. On en tape un, puis on le barre.</li>
      <li><b>Appeler l'animateur ou l'organisation</b> (AVEC accompagnée) : le téléphone montre un code, vous le dictez, on vous dicte un code de déblocage.</li>
    </ol>
    <p>Ensuite, vous choisissez vous-même un nouveau code. Personne ne le voit.</p>
    <div class="tip">Chaque déblocage est noté dans <b>Plus › Sécurité et carte de secours</b>. Quand il reste 2 codes ou moins sur la carte, le bureau en crée une nouvelle.</div>` },
  { id: 'lancer', icon: 'building', t: 'Lancer Akiba pour de vrai', b: `
    <ol>
      <li>Tout le monde peut installer Akiba et essayer la démonstration. Sur l'écran d'accueil, touchez <b>Commencer avec mes vraies données</b> : Akiba affiche le <b>code de ce téléphone</b> : touchez « Demander le code sur WhatsApp » (ou appelez Ubora). Ubora renvoie un <b>code de validation</b> fait pour ce téléphone seulement : collez-le ou ouvrez le lien, une seule fois. La démonstration est ensuite effacée.</li>
      <li>Le code de validation ne marche sur aucun autre téléphone : ne le partagez pas, il ne servirait à rien. Un téléphone utilisé de façon frauduleuse peut être bloqué par Ubora ; ses données restent dans le téléphone.</li>
      <li><b>Organisation</b> : le compte s'ouvre sur <b>Akiba Suivi</b>, et c'est Ubora qui l'ouvre.
        <ol><li>Vous écrivez qui vous êtes : organisation, province et territoire, responsable, téléphone.</li>
          <li>Akiba prépare la demande. Envoyez-la par WhatsApp ou par SMS, ou montrez le QR à un responsable d'Ubora. Ubora vérifie et renvoie un code de validation.</li>
          <li>Vous choisissez votre code secret. Le compte existe.</li></ol>
        <b>Seule l'étape 2 demande du réseau</b> — et même elle s'en passe, si quelqu'un d'Ubora est devant vous.</li>
      <li>Ensuite, <b>Ajouter un animateur</b> pour chaque animateur. Chacun reçoit un code et le change avec <b>Mon code</b>.</li>
      <li>Les animateurs créent les AVEC, et l'organisation les valide.</li>
      <li><b>AVEC autonome</b> : créez directement votre groupe.</li>
    </ol>
    <div class="tip">Pendant la phase pilote, gardez aussi le cahier papier.</div>` },
  { id: 'audio', icon: 'volume', t: 'Écouter au lieu de lire', b: `
    <p>Akiba peut <b>lire à voix haute</b>, même sans réseau, avec la voix installée sur le téléphone.</p>
    <ul><li>Dans ce guide : <b>Écouter cette partie</b> ou <b>Écouter tout le guide</b>.</li>
      <li>Pendant la réunion : <b>Écouter cette étape</b> ne lit plus le titre, elle <b>conduit la réunion</b> —
        l'ordre des gestes, ce qu'il ne faut pas oublier. Le secrétaire peut poser le téléphone, écouter, et faire.</li>
      <li>Dans le carnet : <b>Écouter mon carnet</b> dit l'épargne et la valeur des parts.</li>
      <li>Dans la formation : <b>Écouter le module</b>, pour préparer une séance en chemin.</li>
      <li>Touchez à nouveau le bouton pour <b>arrêter</b>.</li></ul>
    <h4>Choisir la voix</h4>
    <p><b>Plus › Voix de lecture</b> : Akiba liste les voix installées sur ce téléphone, on les écoute une par une et
      on garde celle qui sonne le mieux. Les voix récentes, plus naturelles, sont proposées d'abord.</p>
    <h4>Écouter dans sa langue</h4>
    <p>Aucun téléphone n'a de voix lingála, kikongo ni tshiluba : elles n'existent nulle part.</p>
    <p>Mais ces langues ont les <b>cinq voyelles pures</b> du kiswahili, de l'espagnol et de l'italien — rien à voir
      avec les voyelles nasales et les lettres muettes du français.</p>
    <p>Akiba cherche donc dans l'ordre : la langue elle-même, le kiswahili, l'espagnol, l'italien, le français en dernier.</p>
    <p>Une voix kiswahili lit le lingála bien plus près du vrai qu'une voix française.</p>
    <div class="tip">Pour ajouter ces voix, gratuitement : <b>Paramètres du téléphone › Langues › Synthèse vocale ›
      Google</b>, puis téléchargez le kiswahili ou l'espagnol. Pas de son du tout ? Montez le volume, et vérifiez que
      « Services vocaux Google » est installé.</div>` },
  { id: 'installer', icon: 'home', t: 'Icône, protection et sauvegarde', b: `
    <h4>Mettre l'icône sur l'écran d'accueil</h4>
    <ol><li>Ouvrez l'adresse d\'Akiba dans <b>Chrome</b>, avec du réseau.</li><li>Touchez <b>Installer Akiba</b> (ou menu ⋮ › « Ajouter à l'écran d'accueil »).</li><li>Une icône verte apparaît. Ensuite, Akiba s'ouvre <b>sans réseau</b>.</li></ol>
    <h4>Mises à jour</h4>
    <p>Akiba se met à jour <b>tout seul</b>, sans le désinstaller et <b>sans perdre les données</b>. Ouvrez-le de temps en temps avec du réseau : la nouvelle version s'installe en arrière-plan. Si vous êtes en train d'écrire, un bandeau <b>Mettre à jour</b> apparaît : touchez-le quand vous avez fini.</p>
    <p><b>Savoir si on est à jour.</b> La version est écrite en bas de chaque écran, par exemple « Version 24 oct. 2026 ». Dans <b>Installer et sauvegarder</b>, le bouton <b>Chercher une mise à jour maintenant</b> compare avec ce qui est en ligne et répond clairement : « Vous avez la dernière version », ou « Nouvelle version du … : elle s'installe ».</p>
    <h4>Éviter une désinstallation par erreur</h4>
    <p>Aucune application ne peut interdire complètement sa désinstallation : c'est le téléphone qui décide. Mais on peut bien le protéger :</p>
    <ul><li>Rangez l'icône dans un dossier « AVEC » et verrouillez le téléphone par un code.</li>
      <li>Android : activez <b>l'épinglage d'application</b> (Paramètres › Sécurité). Akiba reste à l'écran ; il faut le code du téléphone pour en sortir.</li>
      <li>Pour les téléphones de l'organisation, un outil de gestion des appareils (Family Link, Android Enterprise) bloque la désinstallation.</li>
      <li>N'utilisez jamais « Effacer les données » de Chrome ni les nettoyeurs de mémoire.</li></ul>
    <h4>Contrôler un téléphone neuf avant de partir au village</h4>
    <p>Trois choses ne se vérifient que sur l'appareil lui-même : l'<b>appareil photo</b> qui lit un code, le <b>fichier touché dans un message</b>, et l'<b>imprimante</b>. Un téléphone peut très bien ouvrir Akiba et ne savoir faire aucune des trois.</p>
    <p><b>Installer et sauvegarder › Contrôler cet appareil.</b> La moitié haute se remplit toute seule. La moitié basse demande quatre gestes, qu'on peut faire en plusieurs fois : les réponses sont gardées.</p>
    <ul><li><b>Lire un code</b> : sur un autre téléphone, montrez une AVEC en image, et visez-la.</li>
      <li><b>Toucher un fichier</b> : Akiba fabrique un fichier d'essai. Envoyez-le-vous par message et touchez-le. Si Akiba vous est proposée, la case se coche <b>toute seule</b> — ce fichier ne contient aucun cahier et n'ajoute aucun groupe.</li>
      <li><b>Sortir un ticket</b> : l'écran de l'imprimante essaie les voies une à une.</li>
      <li><b>Le verrou</b> : l'activer, puis essayer de désinstaller Akiba.</li></ul>
    <p>À la fin, un bouton envoie le compte rendu à Ubora. Il porte le modèle du terminal et chaque réponse, <b>aucun nom de membre et aucun chiffre du cahier</b>. C'est ce compte rendu qui permet de brancher l'imprimante d'un modèle encore inconnu.</p>
    <h4>Sauvegarde</h4>
    <p><b>Plus › Installer et sauvegarder › Créer une sauvegarde</b> : un fichier chiffré par un mot de passe. Faites-le chaque semaine et gardez le fichier hors du téléphone. Sur un nouveau téléphone : <b>Restaurer sur ce téléphone</b>. La restauration est refusée sur un téléphone qui contient déjà des données, pour qu'une vieille sauvegarde n'efface pas des opérations récentes.</p>` },
  { id: 'reseau', icon: 'cloud', t: 'Sans réseau et synchronisation', b: `
    <p>Toutes les opérations sont d'abord enregistrées <b>dans le téléphone</b>. Le badge en haut à droite indique :</p>
    <ul>
      <li><b>À jour</b> : tout est envoyé.</li>
      <li><b>12 à envoyer</b> : des écritures attendent le réseau.</li>
      <li><b>Hors ligne</b> : pas de réseau. Continuez normalement.</li>
    </ul>
    <p>Dès que le réseau revient (au marché, en ville), touchez le badge puis <b>Envoyer maintenant</b>. L'animateur et l'organisation ne voient que les données envoyées.</p>` },
  { id: 'membres', icon: 'users', t: 'Gérer les membres', b: `
    <p><b>Cartes des membres.</b> Dans <b>Membres › Cartes des membres</b> : une carte par membre, au format carte bancaire.</p>
    <ul>
      <li>Elle porte le nom du groupe, le nom et le rôle du membre, son numéro, sa date d'entrée, et un QR.</li>
      <li>Dix cartes par feuille A4 ordinaire : imprimez, puis découpez en suivant les traits.</li>
      <li>Le QR ne contient <b>ni code secret ni montant</b> — l'identité, et une empreinte tirée du journal scellé.</li>
      <li>L'animateur compare cette empreinte avec l'application : une carte recopiée est refusée.</li>
    </ul>
    <h4>Nouveau membre</h4><p><b>Membres › Ajouter un membre</b>, avec l'accord d'un 2ᵉ membre du bureau. On remplit la fiche : nom et sexe obligatoires ; âge, téléphone (ex. 099 123 4567), activité et adresse facultatifs. Akiba donne un code secret provisoire à remettre en main propre.</p>
    <h4>Compléter ou corriger une fiche</h4><p>Ouvrez le carnet du membre puis <b>Modifier les informations</b>. Le bureau ou le membre lui-même peut le faire ; chaque changement est noté dans le journal de sécurité.</p>
    <h4>Départ d'un membre</h4><p>Pendant une réunion ouverte, ouvrez son carnet puis <b>Départ du groupe</b>. Il récupère son épargne, moins son crédit et ses amendes dues. Les bénéfices restent au groupe.</p>
    <div class="formula">Argent rendu = épargne − crédit restant − amendes dues</div>
    <h4>Code oublié</h4><p>Un membre du bureau ouvre le carnet du membre puis <b>Code oublié</b>. L'ancien code ne marche plus.</p>
    <h4>Changer de responsable</h4><p><b>Plus › Bureau et porte-clés</b>, après décision de l'assemblée.</p>` },
  { id: 'partage', icon: 'split', t: 'Fin de cycle et partage', b: `
    <div class="alert warn"><div><b>Le partage ne se reprend pas</b><span class="small">Avant de distribuer, Akiba
      affiche le montant exact, le nombre de membres qui reçoivent, les retenues, le prêteur extérieur soldé d'abord
      et ce qui reste pour le cycle suivant. Puis le <b>président tape son code</b> : les trois clés disent que la caisse est juste, le code du président dit que l'assemblée veut partager aujourd'hui.</span></div></div>
    <p>Un cycle dure en général 12 mois. Akiba prévient <b>4 semaines avant la fin</b>. Avant le partage, les membres doivent rembourser leurs crédits.</p>
    <h4>Partager avant la fin du cycle</h4>
    <p>C'est <b>permis</b>, et c'est l'assemblée qui décide — jamais le bureau seul. Un groupe partage parfois plus tôt :
      avant la rentrée scolaire, avant une saison de semis, avant un déplacement. Akiba ne l'interdit pas, mais il le dit :
      l'écran de partage rappelle la date de fin prévue et le temps qui reste, et la confirmation le redit une dernière fois.</p>
    <p>Le calcul ne change pas : chacun reçoit son épargne et sa part des bénéfices, <b>arrêtés au jour du partage</b>.</p>
    <p>Les bénéfices n'ayant pas eu le temps de grossir, la part de chacun est plus petite.
      <b>Personne n'est lésé</b> — le groupe gagne seulement moins.</p>
    <p>Les conditions restent les mêmes : crédits remboursés, prêteur extérieur soldé, caisse comptée,
      les trois clés, puis le code du président.</p>
    <div class="tip">Après un partage anticipé, le cycle suivant s'ouvre tout de suite : le groupe ne s'arrête pas,
      il recommence. La caisse sociale, elle, n'est pas partagée : elle passe au cycle suivant.</div>
    <h4>Le calcul</h4>
    <div class="formula">Total à partager = caisse de crédit + crédits à récupérer + amendes dues − crédit extérieur à rendre<br>Bénéfice du cycle = Total − épargne de tous les membres<br>Chaque membre reçoit = son épargne + sa part du bénéfice − ce qu'il doit encore</div>
    <h4>Le temps compte, pour que personne ne mange la part des autres</h4>
    <p>Chaque membre <b>reprend d'abord toute son épargne</b>. Le bénéfice (intérêts et amendes gagnés pendant le cycle) est ensuite partagé selon l'épargne <b>et le temps</b> qu'elle a passé dans la caisse, compté en « francs × jours ». Un membre entré en cours de cycle garde donc tout son argent, mais ne touche pas le bénéfice gagné avant son arrivée.</p>
    <div class="formula">Exemple : bénéfice 180 000 FC<br>Kavira, 60 000 FC épargnés depuis 12 mois → poids fort<br>Sifa, 60 000 FC épargnés depuis 2 mois → poids six fois plus faible<br>Chacune reprend ses 60 000 FC, mais Kavira reçoit six fois plus de bénéfice</div>
    <p>Un membre qui <b>quitte le groupe en cours de cycle</b> reprend son épargne ce jour-là, sans bénéfice : le bénéfice gagné avec son argent reste au groupe, et il ne figure plus dans le partage.</p>
    <p>Le tableau du partage montre, pour chaque membre : ses parts, son épargne, son bénéfice, ce qui est retenu (crédit ou amende) et ce qu'il reçoit. Si le groupe a un crédit extérieur, le prêteur est remboursé avant tout partage.</p>
    <h4>La séance de partage</h4>
    <ol>
      <li><b>Plus › Partage de fin de cycle</b> : vérifiez le tableau avec l'assemblée.</li>
      <li>Touchez <b>Faire le partage maintenant</b>.</li>
      <li>Comptez tout l'argent de la caisse et écrivez le montant.</li>
      <li>Les trois porte-clés tapent leur code.</li>
      <li><b>Distribuer et fermer le cycle</b> : chaque membre reçoit sa part devant tous. Les montants sont arrondis à 50 FC.</li>
    </ol>
    <div class="tip">La caisse sociale et le reste des arrondis passent automatiquement au cycle suivant.</div>` },
  { id: 'cycle', icon: 'calendar', t: 'Commencer un nouveau cycle', b: `
    <p>Juste après le partage, Akiba ouvre l'écran <b>Nouveau cycle</b> :</p>
    <ol>
      <li>L'assemblée garde ou change le règlement : valeur de la part, cotisation, intérêt, durée.</li>
      <li>On confirme ou on réélit le bureau et les porte-clés.</li>
      <li>Un 2ᵉ membre du bureau valide avec son code, puis on touche <b>Commencer le cycle</b>.</li>
    </ol>
    <p>Les anciens cycles restent consultables dans <b>Plus › Historique des cycles</b> : valeur de la part, montant partagé, nombre de membres.</p>` },
  { id: 'animateur', icon: 'map', t: 'Pour l\'animateur', b: `
    <h4>Votre propre formation</h4>
    <p>Les sept modules des AVEC disent <b>quoi</b> enseigner à un groupe. Sept autres disent <b>comment</b> :
      <b>Formation › Formation des animateurs</b>. Préparer une séance, animer sans faire à la place du groupe, faire
      parler ceux qui se taisent, vérifier qu'on a vraiment compris, mener une visite de suivi, rattraper les erreurs
      fréquentes, protéger le groupe contre la fraude et la pression.</p>
    <p>Vous les cochez vous-même quand les points de contrôle sont passés. Votre organisation voit votre avancement,
      sans pouvoir le remplir à votre place.</p>
    <ul>
      <li><b>Mes AVEC</b> : un point vert, orange ou rouge montre l'état de chaque groupe.</li>
      <li><b>Alertes</b> : écarts de caisse, crédits en retard, réunions manquées, journal altéré, fin de cycle, données non envoyées.</li>
      <li>Dans une AVEC : chiffres clés, réunions reçues, crédits en retard, cycles passés, et <b>Noter une visite</b> avec vos observations.</li>
      <li><b>Formation</b> : les 7 modules de la méthode AVEC (groupe et élections, règles, règlement intérieur, première réunion, premier crédit, premier remboursement, partage). Chaque module dit quoi faire avec l'assemblée et où le faire dans Akiba ; cochez-le pour chaque AVEC.</li>
      <li>L'animateur <b>ne peut rien modifier</b> dans les comptes du groupe. Il conseille et vérifie.</li>
    </ul>` },
  { id: 'organisation', icon: 'building', t: 'Pour l\'organisation', b: `
    <h4>Présenter un portefeuille à une IMF</h4>
    <p>Une AVEC seule prépare son propre dossier. Une organisation, elle, présente un <b>portefeuille</b> :
      <b>Tableau de bord › IMF</b>. On choisit les groupes — toutes, les prêtes, ou à la main — et Akiba écrit un
      fichier Excel de quatre feuilles : une ligne par AVEC avec ce qu'une institution de microfinance regarde, un
      résumé du portefeuille, puis le détail des crédits internes et extérieurs.</p>
    <p>Mêmes garde-fous que pour un groupe seul : rien ne part sans que vous confirmiez l'<b>accord des assemblées
      générales</b>, les noms des membres restent dehors par défaut, et <b>jamais</b> de téléphone ni d'adresse.
      Chaque envoi laisse sa trace, visible sur le même écran.</p>
    <ul>
      <li>Le tableau de bord additionne toutes les AVEC accompagnées : membres, part des femmes, épargne, crédits, PAR, caisses sociales.</li>
      <li>Filtrez par animateur avec les boutons en haut.</li>
      <li><b>Impact</b> : ce que vos AVEC donnent en chiffres, pour un rapport ou un bailleur.
        <ul><li><b>Hors ligne</b> : AVEC, membres, réunions, écritures scellées.</li>
          <li><b>Données fiables</b> : journaux intacts, qualité moyenne, caisse à 3 clés, écarts.</li>
          <li><b>Supervision allégée</b> : données à jour, AVEC sans alerte, visites sur 90 jours, suivi à distance.</li>
          <li><b>Vers la finance formelle</b> : AVEC prêtes pour une IMF, épargne, remboursement à temps, crédits extérieurs.</li></ul></li>
      <li>Le tableau des AVEC montre aussi la <b>qualité des données</b> et l'indicateur <b>« prête pour une IMF »</b> de chacune.</li>
      <li>Le tableau des AVEC indique le cycle, la dernière réunion et la date du dernier envoi. Touchez une ligne pour voir le détail.</li>
      <li>Créez une AVEC et confiez-la à un animateur avec <b>Nouvelle AVEC</b>.</li>
      <li><b>Formation</b> : consultez les 7 modules et suivez l'avancement de chaque AVEC (colonne « Formation » et fiche de l'AVEC).</li>
      <li><b>Excel</b> : un fichier .xlsx avec 8 onglets (synthèse, AVEC avec qualité des données et « prête pour une IMF », membres, réunions, crédits, crédits extérieurs, formation, alertes) pour vos rapports. Touchez « Excel », puis Télécharger ou Partager. Choisissez d'abord un animateur pour n'exporter que ses AVEC.</li>
      <li><b>Code oublié</b> : l'organisation garde une <b>carte de secours</b> de 6 codes, donnée une seule fois à la création du compte. Touchez « J'ai oublié mon code » sur l'écran de connexion, puis tapez un code de la carte : il sert une seule fois. Pour un animateur, c'est l'organisation qui redonne un code depuis sa fiche.</li>
      <li>Chaque organisation ne voit que ses propres AVEC : les données restent séparées d'une organisation à l'autre.</li>
      <li>Les AVEC autonomes n'apparaissent jamais dans votre tableau.</li>
    </ul>` },
  { id: 'messages', icon: 'alert', t: 'Un message vous bloque : la liste', b: `
    ${FIG.sifaute()}
    <p>Akiba ne refuse jamais sans dire pourquoi. Cherchez ici le message exact que vous voyez à l'écran.</p>
    <h4>« Ce téléphone n'a pas de licence »</h4><p>Le téléphone n'est pas encore validé. Lisez le <b>code de ce téléphone</b> à Ubora, tapez le code reçu. Voir <b>Les codes de validation d'Ubora</b>.</p>
    <h4>« Ce code est pour le téléphone XXXX-XXXX, pas pour celui-ci »</h4><p>Le code appartient à un autre appareil. Redemandez-en un en donnant le code affiché sur <b>ce</b> téléphone-ci.</p>
    <h4>« Ce code sert seulement à la démonstration »</h4><p>Vous avez reçu un code d'entraînement. Demandez à Ubora un code pour une AVEC ou pour une organisation.</p>
    <h4>« L'organisation doit valider le groupe avant la première réunion »</h4><p>Le groupe est encore en attente. Appelez l'organisation avec le <b>code de demande</b> affiché, elle vous dicte huit chiffres.</p>
    <h4>« Code de transfert faux, ou fichier abîmé »</h4><p>Les huit signes ne correspondent pas, ou le fichier a été coupé pendant l'envoi. Retapez le code ; s'il refuse encore, demandez le fichier à nouveau.</p>
    <h4>« Cette AVEC est déjà active sur ce téléphone »</h4><p>Le cahier est déjà là et vivant. Ne le remplacez pas avant d'avoir vérifié lequel des deux est le plus récent : demandez au porteur de l'autre téléphone à quelle réunion il en est.</p>
    <h4>« Il manque une réunion avant la n°X »</h4><p>La séance reçue ne s'accroche pas à la copie. Le groupe doit envoyer un <b>fichier</b> complet, pas une image.</p>
    <h4>« Ces écritures ne tiennent pas dans la chaîne : refusées »</h4><p>Ce qui arrive a été modifié, ou vient d'un autre cahier. Rien n'a été ajouté. Demandez le fichier.</p>
    <h4>« Le journal est altéré : le partage est impossible »</h4><p>Une écriture a été changée après enregistrement. Ne partagez pas, n'envoyez rien à une IMF : voir <b>Le téléphone, le papier et les pannes</b>.</p>
    <h4>« Fermez d'abord la réunion en cours » / « Fermez d'abord le guichet »</h4><p>Une séance est ouverte. Terminez-la (étape 8, ou « Recompter et fermer » au guichet) avant d'envoyer le cahier.</p>
    <h4>« Réservé au bureau »</h4><p>Le membre connecté n'a pas ce droit. Reconnectez-vous avec le code d'un membre du bureau.</p>
    <h4>« Expliquez l'écart : c'est obligatoire »</h4><p>Le montant compté ne correspond pas au cahier. Écrivez ce qui s'est passé, même en deux mots : c'est cette phrase que lira l'organisation.</p>
    <h4>« Ce navigateur ne permet pas le chiffrement »</h4><p>Le navigateur est trop ancien. Mettez Chrome à jour, ou installez l'application Android depuis la page <b>android.html</b> du site.</p>
    <h4>« Ce groupe est trop grand pour une image »</h4><p>L'image ne porte qu'un groupe neuf. Passez par le fichier.</p>
    <h4>« Appareil photo indisponible »</h4><p>La caméra n'est pas autorisée, ou l'appareil n'en a pas. Autorisez-la dans les réglages du téléphone, ou demandez le fichier.</p>
    <div class="tip">Un message que vous ne trouvez pas ici ? Notez-le mot pour mot et appelez Ubora : c'est ainsi que cette liste s'allonge.</div>` },

  { id: 'panne', icon: 'alert', t: 'Le téléphone, le papier et les pannes', b: `
    <h4>Le téléphone est perdu, cassé ou volé</h4>
    <p>Dans cet ordre :</p>
    <ul>
      <li>Reprendre la <b>dernière sauvegarde</b> sur un autre téléphone, avec son mot de passe.</li>
      <li>À défaut, reprendre la <b>copie de l'animateur</b> : elle contient tout ce que le groupe lui a renvoyé.</li>
      <li>À défaut encore, les <b>journaux de séance imprimés</b> et classés dans la caisse permettent de recomposer le cahier à la main, réunion par réunion.</li>
    </ul>
    <div class="tip">Si l'ancien téléphone réapparaît, ne tenez pas de réunion dessus : deux cahiers qui avancent chacun de leur côté ne se recollent pas. Le bureau décide lequel fait foi, à deux signatures, dans <b>Reprendre l'AVEC sur ce téléphone</b>.</div>
    <h4>L'imprimante ne sort rien</h4>
    <ul>
      <li>Vérifiez le rouleau : un papier thermique posé à l'envers ne marque pas.</li>
      <li>Vérifiez que le capot est bien fermé.</li>
      <li>Sur un terminal, l'impression passe par l'application Android : ouverte dans le navigateur, Akiba imprime vers le navigateur, pas vers le rouleau.</li>
      <li>En dernier recours, <b>Partager</b> le texte du reçu : il part par WhatsApp ou se garde en fichier.</li>
    </ul>
    <h4>L'image ne se lit pas</h4>
    <ul>
      <li>Approchez ou reculez de quelques centimètres, visez bien droit.</li>
      <li>Évitez le soleil direct sur l'écran qui montre l'image.</li>
      <li>Touchez l'image pour l'agrandir en plein écran.</li>
      <li>Un écran très rayé rend l'image illisible : essuyez-le, ou passez par le fichier.</li>
    </ul>
    <h4>Le cahier a disparu</h4>
    <p>Akiba garde le cahier <b>dans le téléphone</b>. Trois gestes l'effacent : vider les données du navigateur, désinstaller l'application, réinitialiser l'appareil. Il n'y a pas de serveur pour le récupérer — seulement vos sauvegardes. Vérifiez d'abord que vous êtes sur la bonne adresse : <b>akiba.uborardc.com</b> et <b>akibas.uborardc.com</b> sont deux réserves séparées.</p>
    <h4>La date du téléphone est fausse</h4>
    <p>Réglez-la avant la réunion : les échéances de crédit, les pénalités et les sceaux portent l'heure du téléphone.</p>
    <h4>Akiba dit que le journal est altéré</h4>
    <p>Une écriture ne correspond plus à son empreinte. Ne partagez pas, n'envoyez pas de dossier. Notez le numéro de l'écriture signalée, dites-le à l'animateur, et repartez de la dernière sauvegarde saine ou de la copie de l'animateur.</p>` },

  { id: 'limites', icon: 'clip', t: 'Ce qu\'Akiba ne fait pas', b: `
    <p>Un outil qui promet tout se fait prendre au premier cas difficile. Voici ce qu'Akiba ne fait pas, pour que vous ne l'appreniez pas un mauvais jour.</p>
    <ul>
      <li><b>Pas de fusion de deux cahiers qui ont divergé.</b> Un seul téléphone tient le cahier à la fois.</li>
      <li><b>Pas de serveur, donc pas de synchronisation automatique.</b> Tout passe par un fichier, une image, ou un envoi décidé par quelqu'un.</li>
      <li><b>Pas de mobile money.</b> Akiba enregistre de l'argent compté à la main.</li>
      <li><b>Pas de comptabilité d'ONG.</b> Akiba tient le cahier d'un groupe, pas les comptes de l'organisation qui l'accompagne.</li>
      <li><b>L'impression dépend du terminal.</b> Sur un appareil sans imprimante, les papiers se partagent en texte ou s'impriment depuis un ordinateur.</li>
    </ul>
    <div class="tip">Un groupe qui connaît ces limites — un seul téléphone, une sauvegarde après chaque séance — ne les rencontre jamais.</div>` },

  { id: 'ouest', icon: 'book', t: 'Où trouver quoi', b: `
    <ul>
      <li><b>Tenir la réunion</b> — la couverture, le grand bouton doré.</li>
      <li><b>Voir le compte d'un membre</b> — Membres, puis son nom.</li>
      <li><b>Imprimer le livret d'un membre</b> — Membres, son nom, Livret.</li>
      <li><b>Accorder un crédit</b> — réunion, étape 6 ; ou Crédits, Accorder.</li>
      <li><b>Ouvrir le guichet</b> — Plus, Guichet, Ouvrir le guichet.</li>
      <li><b>Imprimer le journal d'une séance</b> — Reçus, la séance, Imprimer le journal.</li>
      <li><b>Sauvegarder</b> — la pastille en haut de l'écran, Créer une sauvegarde.</li>
      <li><b>Envoyer le cahier à un autre téléphone</b> — Plus, Envoyer vers un autre téléphone.</li>
      <li><b>Montrer la séance à l'animateur</b> — après la clôture, Montrer à l'animateur.</li>
      <li><b>Vérifier que le journal est intact</b> — Plus, Sécurité.</li>
      <li><b>Changer la langue ou l'apparence</b> — les deux boutons en haut de la couverture.</li>
      <li><b>Débloquer un membre</b> — son téléphone affiche un code, l'organisation le convertit ; ou la carte de secours de la caisse.</li>
    </ul>` },

  { id: 'mots', icon: 'clip', t: 'Mots à connaître', b: `
    <ul>
      <li><b>Part</b> : unité d'épargne, de même valeur pour tous pendant le cycle.</li>
      <li><b>Cycle</b> : période d'épargne (souvent 12 mois) qui se termine par le partage.</li>
      <li><b>Caisse de crédit</b> : l'épargne, les remboursements et les amendes. Elle sert aux crédits et au partage.</li>
      <li><b>Caisse sociale</b> : fonds de solidarité, jamais partagé.</li>
      <li><b>Écart de caisse</b> : différence entre l'argent compté et ce que dit le cahier.</li>
      <li><b>Porte-clé</b> : membre qui garde une des trois clés de la caisse.</li>
      <li><b>PAR</b> : portefeuille à risque, la part des crédits en retard.</li>
      <li><b>Sceau</b> : code unique qui ferme une réunion. Il prouve que rien n'a changé depuis.</li>
    </ul>` },
  { id: 'faq', icon: 'alert', t: 'Questions fréquentes', b: `
    <h4>Il y a un écart de caisse, que faire ?</h4><p>Recomptez devant tous. Si l'écart reste, écrivez l'explication. La réunion peut être fermée, mais l'animateur verra l'écart.</p>
    <h4>J'ai tapé un mauvais montant.</h4><p>Pendant la réunion : <b>Journal</b>, touchez « Annuler » sur l'écriture, donnez la raison et le code d'un 2ᵉ membre du bureau, puis refaites l'opération. Après la clôture, on ne peut plus rien changer.</p>
    <h4>Le téléphone est perdu ou cassé.</h4><p>Reprenez la dernière sauvegarde, à défaut la copie de l'animateur, à défaut les journaux de séance imprimés. Tout est détaillé dans <b>Le téléphone, le papier et les pannes</b>.</p>
    <h4>Qui appeler en cas de problème ?</h4><p><b>Ubora</b>, entreprise sociale : appel ou WhatsApp au <b>0998 275 144</b>, ou e-mail <b>contact@uborahub.com</b>. Les boutons Appeler et WhatsApp sont dans Plus, dans ce guide et sur l'écran d'activation.</p>
    <h4>Un membre veut voir son compte.</h4><p><b>AVEC › Voir mon carnet › Tous les membres</b>, puis son nom et son code : il voit seulement son carnet.</p>` }
];

/* ---------- les familles du guide ----------
   Trente-six parties en une seule liste, c'est une table des matières qu'on parcourt du doigt
   en espérant tomber dessus. Le bureau, qui se sert de l'application toutes les semaines, en
   voit trente-trois. Les ranger ne retire pas un mot : cela donne au regard six repères au
   lieu de trente-six, et laisse la recherche faire le reste.

   L'ordre suit le temps du groupe : on commence, on tient la réunion, on remet les papiers,
   on finit le cycle. Puis ce qui protège, ce qui est de métier, et ce qu'on ouvre quand ça
   coince. Une partie qui ne serait dans aucune famille s'ajoute d'elle-même à la dernière :
   le guide peut grandir sans que cette liste devienne un piège. */
const GUIDE_FAMILLES = [
  { t: 'Commencer', ids: ['bref', 'premierjour', 'debut', 'connexion', 'lancer', 'validation', 'codes', 'installer'] },
  { t: 'La réunion', ids: ['reunion', 'epargne', 'credit', 'social', 'amendes', 'guichet'] },
  { t: 'Les papiers du groupe', ids: ['recus', 'cartes', 'livret', 'membres'] },
  { t: 'Le cycle et l\'argent dans la durée', ids: ['partage', 'cycle', 'externe', 'qualite'] },
  { t: 'Faire passer le cahier, et le protéger', ids: ['image', 'reseau', 'securite', 'cles', 'perdu'] },
  { t: 'Pour l\'animateur et l\'organisation', ids: ['animateur', 'organisation'] },
  { t: 'Quand ça coince', ids: ['messages', 'panne', 'limites'] },
  { t: 'Pour s\'y retrouver', ids: ['audio', 'ouest', 'mots', 'faq'] },
];
/* range les parties visibles par famille, et place les orphelines à la fin */
function guideFamilles(sections) {
  const reste = new Map(sections.map(g => [g.id, g]));
  const out = GUIDE_FAMILLES.map(f => {
    const parts = f.ids.map(id => reste.get(id)).filter(Boolean);
    parts.forEach(g => reste.delete(g.id));
    return { t: f.t, parts };
  }).filter(f => f.parts.length);
  if (reste.size) {
    const der = out[out.length - 1];
    if (der) der.parts.push(...reste.values());
    else out.push({ t: 'Pour s\'y retrouver', parts: [...reste.values()] });
  }
  return out;
}

/* parties du guide réservées à certains rôles (les autres sont pour tout le monde) */
const GUIDE_WHO = {
  animateur: ['anim', 'org', 'none'], organisation: ['org', 'none'], lancer: ['org', 'none'],
  externe: ['bureau', 'anim', 'org', 'none'], qualite: ['bureau', 'anim', 'org', 'none'], recus: ['bureau', 'anim', 'org', 'none'],
  validation: ['org', 'anim', 'bureau', 'none'], installer: ['org', 'anim', 'bureau', 'none'], debut: ['org', 'anim', 'bureau', 'none'],
  cartes: ['bureau', 'anim', 'org', 'none'], codes: ['org', 'anim', 'bureau', 'none'],
  cles: ['bureau', 'anim', 'org', 'none']
};
/* La recherche du guide. Elle lit le texte déjà présent dans la page : pas d'index à tenir à
   jour, donc rien qui puisse mentir quand une partie change. Les accents et la casse sont
   ignorés — on tape « ecart » comme « écart ». */
const guideSansAccent = t => String(t).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
INP.guideChercher = el => {
  /* « code perdu » doit trouver « Code secret perdu » : on cherche tous les mots, pas la
     phrase. Celui qui tape deux mots attend les deux, où qu'ils soient dans la partie. */
  const mots = guideSansAccent(el.value).split(/[^\p{L}\p{N}]+/u).filter(m => m.length > 1);
  const q = mots.join(' ');
  const parties = [...document.querySelectorAll('details.g')];
  const tuiles = [...document.querySelectorAll('.gtile')];
  const compte = document.getElementById('gqn');
  if (!q) {
    parties.forEach(d => { d.hidden = false; if (d.dataset.ouvertAvant === '1') d.open = true; else d.open = false; });
    tuiles.forEach(t => t.hidden = false);
    document.querySelectorAll('.gfam').forEach(f => f.hidden = false);
    if (compte) compte.textContent = '';
    return;
  }
  let n = 0;
  parties.forEach(d => {
    if (d.dataset.ouvertAvant === undefined) d.dataset.ouvertAvant = d.open ? '1' : '0';
    const texte = guideSansAccent(d.textContent);
    const trouve = mots.every(m => texte.includes(m));
    d.hidden = !trouve; d.open = trouve;
    const id = d.id.replace(/^g-/, '');
    const t = tuiles.find(x => x.dataset.s === id);
    if (t) t.hidden = !trouve;
    if (trouve) n++;
  });
  /* une famille dont plus aucune tuile ne reste ne doit pas laisser son titre tout seul */
  document.querySelectorAll('.gfam').forEach(f => {
    f.hidden = ![...f.querySelectorAll('.gtile')].some(t => !t.hidden);
  });
  /* Une partie dont le TITRE porte les mots cherchés est presque toujours la bonne : on la
     nomme, pour éviter de lire quatre parties avant de tomber sur celle qu'on voulait. */
  const titre = parties.find(d => !d.hidden && (() => { const s = d.querySelector('summary');
    const t = guideSansAccent(s ? s.textContent : ''); return mots.every(m => t.includes(m)); })());
  if (compte) compte.textContent = !n ? 'Rien trouvé. Essayez un autre mot — ou appelez Ubora au 0998 275 144.'
    : n + ' partie' + (n > 1 ? 's' : '') + ' sur ' + parties.length
      + (titre ? ' · au plus près : « ' + titre.querySelector('summary').textContent.trim() + ' »' : '');
};
ACT.guideTo = p => {
  App.go('guide', { s: p.s });
  setTimeout(() => { const el = document.getElementById('g-' + p.s); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60);
};
SCREENS.guide = p => {
  const s = K.session;
  let back = 'login', me = null;
  if (s && s.kind === 'avec' && avecById(s.avecId)) { me = memberOf(avecById(s.avecId), s.memberId); back = isBureau(me) ? 'a.more' : 'a.home'; }
  else if (s && s.kind === 'org') back = 'o.home';
  const role = !s ? 'none' : s.kind === 'avec' ? (isBureau(me) ? 'bureau' : 'membre') : s.kind;
  const sections = GUIDE.filter(g => !GUIDE_WHO[g.id] || GUIDE_WHO[g.id].includes(role));
  const isAnim = s && s.kind === 'anim';
  const open = p.s || (isAnim ? 'animateur' : s && s.kind === 'org' ? 'organisation' : 'bref');
  return `<div class="shell">${topbar('Guide d\'utilisation', APP_NOM(), isAnim ? '' : backBtn(back))}<main class="main">
    ${figDefs()}
    <header class="docintro">
      <p class="sur">Guide d'utilisation</p>
      <h1>Comment utiliser Akiba</h1>
      <p class="lead">Touchez un titre pour l'ouvrir. Les mots en gras sont ceux que vous voyez à l'écran. Touchez « Écouter » pour que le téléphone lise à voix haute, même sans réseau.</p>
      ${(() => { const l = I18N.cur(); if (l === 'fr') return ''; const c = guideCouverture(l, sections);
        return `<p class="hint no-tr">${c >= 1 ? `Tout le guide est écrit en ${esc(I18N.name(l))}.`
          : c > 0 ? `${Math.round(c * 100)} % du guide est écrit en ${esc(I18N.name(l))} ; le reste s'affiche en français.`
            : `Le guide n'est pas encore écrit en ${esc(I18N.name(l))} : il s'affiche en français.`} Traduction à faire relire par des locuteurs de la zone.</p>`; })()}
    </header>
    <section class="docbloc"><h2 class="surtitre deux">Akiba en <b>quatre étapes</b></h2>
      <ol class="etapes">
        <li><i>1</i><div><b>Créer ou recevoir l'AVEC</b><span>Le groupe, le règlement, les membres et le bureau, une fois pour toutes.</span></div></li>
        <li><i>2</i><div><b>Tenir la réunion</b><span>Huit étapes dans l'ordre du cahier : présences, comptage, épargne, remboursements, crédits, amendes, clôture.</span></div></li>
        <li><i>3</i><div><b>Remettre les reçus</b><span>Imprimés sur le terminal, ou partagés par WhatsApp. Le journal s'imprime aussi.</span></div></li>
        <li><i>4</i><div><b>Envoyer et préparer la suite</b><span>L'animateur et l'organisation reçoivent les chiffres ; le dossier IMF se prépare tout seul.</span></div></li>
      </ol>
    </section>
    <section class="docbloc"><h2 class="surtitre deux">Tout le <b>guide</b></h2>
      <!-- Trente-six parties : personne ne doit faire défiler pour trouver « code perdu ». La
           recherche travaille dans la page, sans réseau et sans redessiner l'écran — le champ
           garde donc le curseur pendant qu'on tape. -->
      <div class="field"><label for="gq" class="sr-only">Chercher dans le guide</label>
        <input id="gq" class="input" type="search" data-in="guideChercher" autocomplete="off"
          placeholder="Chercher : guichet, code perdu, écart de caisse…"></div>
      <p class="hint" id="gqn" aria-live="polite"></p>
      ${guideFamilles(sections).map(f => `<div class="gfam">
        <h3 class="gfam-t">${esc(f.t)}</h3>
        <div class="gtiles">${f.parts.map(x => `<button class="gtile" data-act="guideTo" data-s="${x.id}"><span class="gi">${ic(x.icon)}</span><b>${guideSection(x).t}</b></button>`).join('')}</div>
      </div>`).join('')}
    </section>
    <div class="row">${speakBtn('all', '.g summary, .g .gb p, .g .gb li, .g .gb h4, .g .gb .formula, .g .gb .tip', 'Écouter tout le guide')}</div>
    <!-- Le guide est de la prose : il se traduit section par section (guide-tr.js), pas mot à mot.
         Le corps porte « no-tr » dans les deux cas : traduit, il ne doit pas être redécoupé ; en
         français faute de traduction, il ne doit pas noyer la liste de travail du traducteur. -->
    <!-- Les parties suivent l'ordre des familles : une tuile rangée dans « La réunion » doit
         mener à un endroit rangé pareil, sinon le classement ne sert qu'en haut de l'écran. -->
    ${guideFamilles(sections).flatMap(f => f.parts).map(g => { const x = guideSection(g); return `<details class="g" id="g-${g.id}" ${g.id === open ? 'open' : ''}><summary><span class="gi">${ic(g.icon)}</span>${esc(x.t)}</summary><div class="gb">
      <div>${speakBtn(g.id, `#g-${g.id} summary, #g-${g.id} .gb p, #g-${g.id} .gb li, #g-${g.id} .gb h4, #g-${g.id} .gb .formula, #g-${g.id} .gb .tip`, 'Écouter cette partie')}</div>
      <!-- En français, le texte d'origine EST le texte lu : la partie n'a pas à s'excuser de
           « n'être pas encore écrite en Français ». L'avertissement ne vaut que pour une autre
           langue, où il dit honnêtement que cette partie-là n'est pas traduite. -->
      ${x.traduit || x.lang === 'fr' ? '' : `<p class="hint no-tr">Cette partie n\u2019est pas encore écrite en ${esc(I18N.name(x.lang))} : elle reste en français.</p>`}
      <div class="no-tr">${x.b}</div></div></details>`; }).join('')}
    ${supportCard()}
  </main>${isAnim ? tabbar(N_TABS, 'guide') : ''}</div>`;
};
