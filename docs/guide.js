/* Akiba AVEC — guide d'utilisation */
'use strict';

const GUIDE = [
  { id: 'bref', icon: 'book', t: 'Akiba en bref', b: `
    <p>Akiba remplace les cahiers de l'AVEC : le cahier de caisse, les carnets des membres, le registre des crédits et le procès-verbal des réunions. Tout est calculé par le téléphone, sans erreur de calcul, et <b>marche sans réseau</b>.</p>
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
  { id: 'debut', icon: 'plus', t: 'Créer l\'AVEC et commencer', b: `
    <p>Touchez <b>Créer une AVEC</b> sur l'écran d'accueil. La première fois, Akiba demande le <b>code de validation</b> délivré par l'Entreprise Sociale Ubora. Un animateur ou une organisation crée l'AVEC depuis son propre espace. Tout se prépare en 5 étapes, avec l'assemblée réunie.</p>
    <ol>
      <li><b>Groupe</b> : nom, puis le lieu. La <b>province</b> et le <b>territoire ou la ville</b> se choisissent dans la liste officielle de toute la RDC (26 provinces, 145 territoires, villes et communes de Kinshasa). Le secteur, le groupement et le village s'écrivent : les noms déjà utilisés sont proposés pour éviter les fautes. Puis le jour et le rythme des réunions. L'organisation choisit aussi l'animateur.</li>
      <li><b>Règlement</b> : valeur d'une part, nombre de parts par réunion, caisse sociale, durée et date de début du cycle, intérêt, crédit maximum, durée des crédits, amendes. Un exemple chiffré montre ce que les règles donnent.</li>
      <li><b>Membres</b> : une fiche par personne. <b>Obligatoire</b> : nom et sexe. <b>Facultatif</b> : âge, téléphone, activité, adresse. Pour aller plus vite, on peut aussi coller une liste de noms, puis compléter les fiches.</li>
      <li><b>Bureau</b> : président, secrétaire, trésorier, deux compteurs et <b>trois porte-clés</b>. Le trésorier garde la caisse, il ne peut donc pas garder une clé.</li>
      <li><b>Démarrage</b> : <b>Nouveau groupe</b> (caisse vide) ou <b>Groupe déjà en cours</b>.</li>
    </ol>
    <h4>Groupe qui avait déjà un cahier</h4>
    <p>Choisissez « Groupe déjà en cours » et recopiez le cahier : parts achetées par chaque membre, reste à payer sur chaque crédit, caisse sociale, puis l'argent compté dans la caisse de crédit. Akiba enregistre tout dans une séance « Reprise du cahier », scellée. S'il manque de l'argent par rapport au cahier, l'écart est signalé.</p>
    <div class="tip">À la fin, Akiba affiche <b>un code secret différent pour chaque membre</b>, une seule fois. Recopiez-les sur de petits papiers et donnez-les en main propre.</div>` },
  { id: 'connexion', icon: 'users', t: 'Comment une AVEC se connecte', b: `
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
      <li>Sur le téléphone du groupe : ouvrir Akiba, toucher <b>Recevoir une AVEC</b>, choisir le fichier, taper le code. La licence arrive avec le fichier.</li>
      <li>Les membres se connectent ensuite avec leur nom et leur code.</li></ol>
    <h4>Le groupe change de téléphone</h4>
    <p>Sur l'ancien téléphone : <b>Plus › Changer de téléphone</b>, puis même chose. L'ancien téléphone garde une copie mais ne peut plus ouvrir de réunion : il n'y a jamais deux cahiers différents.</p>
    <h4>Le groupe avait un cahier papier</h4>
    <p>À la création, choisir <b>Groupe déjà en cours</b> et recopier le cahier (voir « Créer l'AVEC »).</p>` },
  { id: 'reunion', icon: 'calendar', t: 'La réunion, étape par étape', b: `
    <p>Sur l'accueil, un membre du bureau touche <b>Ouvrir la réunion</b>. Akiba guide la réunion dans l'ordre. On ne peut pas sauter une étape.</p>
    <ol>
      <li><b>Présences</b> : pour chaque membre, touchez « Là », « Retard » ou « Absent ».</li>
      <li><b>Comptage</b> : les porte-clés ouvrent la caisse devant tous. On compte l'argent et on écrit le montant. S'il ne correspond pas au cahier, il faut expliquer l'écart.</li>
      <li><b>Caisse sociale</b> : chaque présent verse la cotisation. On peut aussi donner une aide (maladie, deuil).</li>
      <li><b>Épargne</b> : chaque membre achète de 1 à 5 parts avec les boutons + et −. Les timbres jaunes montrent les parts.</li>
      <li><b>Remboursements</b> : écrivez ce que chaque emprunteur rembourse. « Échéance » met le montant prévu.</li>
      <li><b>Crédits</b> : l'assemblée écoute les demandes. Akiba montre le maximum permis et calcule l'intérêt.</li>
      <li><b>Amendes</b> : les retards paient sur place. L'amende d'un absent est notée comme dette.</li>
      <li><b>Clôture</b> : on recompte tout l'argent, les trois porte-clés tapent leur code et la réunion est <b>scellée</b>.</li>
    </ol>
    <h4>D'une réunion à l'autre</h4>
    <p>Akiba reprend la suite tout seul : au début, un <b>résumé de la réunion précédente</b> (caisse, échéances du jour, amendes dues, absents) ; à l'épargne, les <b>parts habituelles</b> de chaque membre sont proposées ; aux remboursements, les <b>échéances du jour</b> sont déjà écrites. Il suffit de vérifier et de corriger.</p>
    <div class="tip">Si le téléphone s'éteint pendant la réunion, rien n'est perdu : touchez <b>Continuer la réunion</b>.</div>` },
  { id: 'epargne', icon: 'coins', t: 'Épargne et parts', b: `
    <p>L'épargne se fait en <b>parts</b>. Toutes les parts ont la même valeur pendant le cycle (par exemple 1 000 FC). À chaque réunion, un membre achète de 1 à 5 parts.</p>
    <p>Le carnet du membre montre ses parts à chaque réunion, son épargne totale et <b>la valeur de ses parts si le partage avait lieu aujourd'hui</b>. Cette valeur augmente grâce aux intérêts et aux amendes.</p>` },
  { id: 'credit', icon: 'hand', t: 'Les crédits', b: `
    <h4>Règles appliquées par Akiba</h4>
    <ul>
      <li>Un membre emprunte au plus <b>3 fois son épargne</b>, et jamais plus que l'argent disponible dans la caisse de crédit.</li>
      <li><b>Un seul crédit à la fois</b> par membre.</li>
      <li>La durée ne dépasse pas le maximum voté, et le crédit doit être <b>remboursé avant la fin du cycle</b>.</li>
      <li>Chaque crédit est validé par <b>un 2ᵉ membre du bureau</b> avec son code. L'emprunteur ne peut pas valider son propre crédit.</li>
    </ul>
    <h4>Exemple de calcul</h4>
    <div class="formula">Crédit 50 000 FC · 10 % par mois · 3 mois<br>Intérêt = 50 000 × 10 % × 3 = 15 000 FC<br>À rembourser = 65 000 FC, soit environ 21 700 FC par mois</div>
    <p>Un crédit qui n'est pas soldé à la date prévue passe <b>en retard</b> (en rouge). Le <b>PAR</b> (portefeuille à risque) est la part de l'argent prêté qui est en retard. Au-dessus de 10 %, c'est une alerte grave.</p>` },
  { id: 'social', icon: 'shield', t: 'La caisse sociale', b: `
    <p>C'est une caisse de solidarité, séparée de la caisse de crédit. Chaque membre présent verse une petite somme à chaque réunion.</p>
    <ul>
      <li>Elle sert à aider un membre en difficulté : maladie, deuil, incendie.</li>
      <li>Chaque aide demande une raison écrite et <b>la validation d'un 2ᵉ membre du bureau</b>.</li>
      <li>La caisse sociale <b>n'est pas partagée</b> en fin de cycle : elle passe au cycle suivant.</li>
    </ul>` },
  { id: 'amendes', icon: 'gavel', t: 'Les amendes', b: `
    <ul>
      <li><b>Retard</b> : le membre est là, il paie tout de suite.</li>
      <li><b>Absence</b> : le membre n'est pas là, il ne peut pas payer. Akiba note une <b>amende due</b>, sans compter d'argent dans la caisse. Elle est proposée au paiement dès sa prochaine présence.</li>
      <li><b>Autres amendes</b> (bavardage, téléphone, oubli) : bouton « Autre amende ».</li>
    </ul>
    <div class="tip">Une amende due qui n'est jamais payée est retirée de la part du membre au partage.</div>` },
  { id: 'securite', icon: 'lock', t: 'Sécurité et contrôle contre la fraude', b: `
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
      <li>Tout le monde peut installer Akiba et essayer la démonstration. Sur l'écran d'accueil, touchez <b>Commencer avec mes vraies données</b> : Akiba demande le <b>code de validation</b> délivré par l'Entreprise Sociale Ubora (une seule fois par téléphone). La démonstration est ensuite effacée.</li>
      <li><b>Organisation</b> : créez le compte, puis <b>Ajouter un animateur</b> pour chaque animateur. Chacun reçoit un code et le change avec <b>Mon code</b>.</li>
      <li>Les animateurs créent les AVEC, et l'organisation les valide.</li>
      <li><b>AVEC autonome</b> : créez directement votre groupe.</li>
    </ol>
    <div class="tip">Pendant la phase pilote, gardez aussi le cahier papier.</div>` },
  { id: 'audio', icon: 'volume', t: 'Écouter au lieu de lire', b: `
    <p>Akiba peut <b>lire à voix haute</b>, même sans réseau, avec la voix installée sur le téléphone.</p>
    <ul><li>Dans ce guide : <b>Écouter cette partie</b> ou <b>Écouter tout le guide</b>.</li>
      <li>Pendant la réunion : <b>Écouter cette étape</b> explique ce qu'il faut faire.</li>
      <li>Dans le carnet : <b>Écouter mon carnet</b> dit l'épargne et la valeur des parts.</li>
      <li>Touchez à nouveau le bouton pour <b>arrêter</b>.</li></ul>
    <div class="tip">Pas de son ? Montez le volume, puis vérifiez dans les paramètres du téléphone que « Services vocaux Google » est installé, avec la langue française téléchargée.</div>` },
  { id: 'installer', icon: 'home', t: 'Icône, protection et sauvegarde', b: `
    <h4>Mettre l'icône sur l'écran d'accueil</h4>
    <ol><li>Ouvrez l'adresse d\'Akiba dans <b>Chrome</b>, avec du réseau.</li><li>Touchez <b>Installer Akiba</b> (ou menu ⋮ › « Ajouter à l'écran d'accueil »).</li><li>Une icône verte apparaît. Ensuite, Akiba s'ouvre <b>sans réseau</b>.</li></ol>
    <h4>Mises à jour</h4>
    <p>Akiba se met à jour <b>tout seul</b>, sans le désinstaller et <b>sans perdre les données</b>. Ouvrez-le de temps en temps avec du réseau : la nouvelle version s'installe en arrière-plan. Si vous êtes en train d'écrire, un bandeau <b>Mettre à jour</b> apparaît : touchez-le quand vous avez fini.</p>
    <h4>Éviter une désinstallation par erreur</h4>
    <p>Aucune application ne peut interdire complètement sa désinstallation : c'est le téléphone qui décide. Mais on peut bien le protéger :</p>
    <ul><li>Rangez l'icône dans un dossier « AVEC » et verrouillez le téléphone par un code.</li>
      <li>Android : activez <b>l'épinglage d'application</b> (Paramètres › Sécurité). Akiba reste à l'écran ; il faut le code du téléphone pour en sortir.</li>
      <li>Pour les téléphones de l'organisation, un outil de gestion des appareils (Family Link, Android Enterprise) bloque la désinstallation.</li>
      <li>N'utilisez jamais « Effacer les données » de Chrome ni les nettoyeurs de mémoire.</li></ul>
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
    <h4>Nouveau membre</h4><p><b>Membres › Ajouter un membre</b>, avec l'accord d'un 2ᵉ membre du bureau. On remplit la fiche : nom et sexe obligatoires ; âge, téléphone (ex. 099 123 4567), activité et adresse facultatifs. Akiba donne un code secret provisoire à remettre en main propre.</p>
    <h4>Compléter ou corriger une fiche</h4><p>Ouvrez le carnet du membre puis <b>Modifier les informations</b>. Le bureau ou le membre lui-même peut le faire ; chaque changement est noté dans le journal de sécurité.</p>
    <h4>Départ d'un membre</h4><p>Pendant une réunion ouverte, ouvrez son carnet puis <b>Départ du groupe</b>. Il récupère son épargne, moins son crédit et ses amendes dues. Les bénéfices restent au groupe.</p>
    <div class="formula">Argent rendu = épargne − crédit restant − amendes dues</div>
    <h4>Code oublié</h4><p>Un membre du bureau ouvre le carnet du membre puis <b>Code oublié</b>. L'ancien code ne marche plus.</p>
    <h4>Changer de responsable</h4><p><b>Plus › Bureau et porte-clés</b>, après décision de l'assemblée.</p>` },
  { id: 'partage', icon: 'split', t: 'Fin de cycle et partage', b: `
    <p>Un cycle dure en général 12 mois. Akiba prévient <b>4 semaines avant la fin</b>. Avant le partage, les membres doivent rembourser leurs crédits.</p>
    <h4>Le calcul</h4>
    <div class="formula">Total = caisse de crédit + crédits à récupérer + amendes dues<br>Valeur d'une part = Total ÷ nombre de parts<br>Chaque membre reçoit = ses parts × valeur − ce qu'il doit encore</div>
    <div class="formula">Exemple : 1 180 000 FC ÷ 1 000 parts = 1 180 FC la part<br>Kavira a 60 parts → 70 800 FC, moins 5 000 FC de crédit → reçoit 65 800 FC</div>
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
    <ul>
      <li><b>Mes AVEC</b> : un point vert, orange ou rouge montre l'état de chaque groupe.</li>
      <li><b>Alertes</b> : écarts de caisse, crédits en retard, réunions manquées, journal altéré, fin de cycle, données non envoyées.</li>
      <li>Dans une AVEC : chiffres clés, réunions reçues, crédits en retard, cycles passés, et <b>Noter une visite</b> avec vos observations.</li>
      <li><b>Formation</b> : les 7 modules de la méthode AVEC (groupe et élections, règles, règlement intérieur, première réunion, premier crédit, premier remboursement, partage). Chaque module dit quoi faire avec l'assemblée et où le faire dans Akiba ; cochez-le pour chaque AVEC.</li>
      <li>L'animateur <b>ne peut rien modifier</b> dans les comptes du groupe. Il conseille et vérifie.</li>
    </ul>` },
  { id: 'organisation', icon: 'building', t: 'Pour l\'organisation', b: `
    <ul>
      <li>Le tableau de bord additionne toutes les AVEC accompagnées : membres, part des femmes, épargne, crédits, PAR, caisses sociales.</li>
      <li>Filtrez par animateur avec les boutons en haut.</li>
      <li>Le tableau des AVEC indique le cycle, la dernière réunion et la date du dernier envoi. Touchez une ligne pour voir le détail.</li>
      <li>Créez une AVEC et confiez-la à un animateur avec <b>Nouvelle AVEC</b>.</li>
      <li><b>Formation</b> : consultez les 7 modules et suivez l'avancement de chaque AVEC (colonne « Formation » et fiche de l'AVEC).</li>
      <li><b>Excel</b> : un fichier .xlsx avec 7 onglets (synthèse, AVEC, membres, réunions, crédits, formation, alertes) pour vos rapports. Touchez « Excel », puis Télécharger ou Partager. Choisissez d'abord un animateur pour n'exporter que ses AVEC.</li>
      <li>Les AVEC autonomes n'apparaissent jamais dans votre tableau.</li>
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
    <h4>Le téléphone est perdu ou cassé.</h4><p>Les données déjà envoyées sont sauvegardées. D'où l'importance d'envoyer dès que le réseau est là.</p>
    <h4>Qui appeler en cas de problème ?</h4><p><b>Ubora</b>, entreprise sociale : appel ou WhatsApp au <b>0998 275 144</b>, ou e-mail <b>contact@uborahub.com</b>. Les boutons Appeler et WhatsApp sont dans Plus, dans ce guide et sur l'écran d'activation.</p>
    <h4>Un membre veut voir son compte.</h4><p><b>AVEC › Voir mon carnet › Tous les membres</b>, puis son nom et son code : il voit seulement son carnet.</p>` }
];

/* parties du guide réservées à certains rôles (les autres sont pour tout le monde) */
const GUIDE_WHO = {
  animateur: ['anim', 'org', 'none'], organisation: ['org', 'none'], lancer: ['org', 'none'],
  validation: ['org', 'anim', 'bureau', 'none'], installer: ['org', 'anim', 'bureau', 'none'], debut: ['org', 'anim', 'bureau', 'none']
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
  return `<div class="shell">${topbar('Guide d\'utilisation', 'Akiba AVEC', isAnim ? '' : backBtn(back))}<main class="main">
    <div><h1>Comment utiliser Akiba</h1><p class="muted">Touchez un titre pour l'ouvrir. Les mots en gras sont ceux que vous voyez à l'écran. Touchez « Écouter » pour que le téléphone lise à voix haute, même sans réseau.</p></div>
    <div class="row">${speakBtn('all', '.g summary, .g .gb p, .g .gb li, .g .gb h4, .g .gb .formula, .g .gb .tip', 'Écouter tout le guide')}</div>
    ${sections.map(g => `<details class="g" id="g-${g.id}" ${g.id === open ? 'open' : ''}><summary><span class="gi">${ic(g.icon)}</span>${g.t}</summary><div class="gb">
      <div>${speakBtn(g.id, `#g-${g.id} summary, #g-${g.id} .gb p, #g-${g.id} .gb li, #g-${g.id} .gb h4, #g-${g.id} .gb .formula, #g-${g.id} .gb .tip`, 'Écouter cette partie')}</div>${g.b}</div></details>`).join('')}
    ${supportCard()}
  </main>${isAnim ? tabbar(N_TABS, 'guide') : ''}</div>`;
};
