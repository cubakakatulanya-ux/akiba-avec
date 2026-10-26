/* Akiba AVEC — langues de la RDC : sélecteur, traduction de l'interface, éditeur de traductions */
'use strict';

ICONS.globe = '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>';

/* Langues proposées. « base » : traduction fournie (à faire relire par des locuteurs).
   Les langues sans base se traduisent dans l'application (écran « Traduire »). */
const LANGS = [
  { id: 'fr', name: 'Français', where: 'Langue officielle' },
  { id: 'ln', name: 'Lingála', where: 'Kinshasa, Équateur, Sud-Ubangi, Nord-Ubangi, Mongala, Tshuapa' },
  { id: 'sw', name: 'Kiswahili', where: 'Nord-Kivu, Sud-Kivu, Maniema, Ituri, Tanganyika, Haut-Katanga' },
  { id: 'kg', name: 'Kikongo ya leta', where: 'Kongo-Central, Kwango, Kwilu, Mai-Ndombe' },
  { id: 'lua', name: 'Tshiluba', where: 'Kasaï, Kasaï-Central, Kasaï-Oriental, Lomami' },
  { id: 'nga', name: 'Ngbaka', where: 'Sud-Ubangi (Gemena, Budjala, Kungu)' },
  { id: 'ngb', name: 'Ngbandi', where: 'Nord-Ubangi et Sud-Ubangi' },
  { id: 'mbn', name: 'Mbanza', where: 'Sud-Ubangi (Budjala, Libenge)' },
  { id: 'lse', name: 'Lomongo', where: 'Équateur, Tshuapa' },
  { id: 'zne', name: 'Zande', where: 'Bas-Uele, Haut-Uele' }
];

/* Phrases de l'interface du groupe. {n} = partie variable (nom, numéro…). */
const TR = {
  /* cartes de membre, point GPS, apparence, mises à jour — à relire par des locuteurs */
  'Cartes des membres': { ln: 'Bakarte ya bato ya lisanga', sw: 'Kadi za wanachama', kg: 'Bakarte ya bantu ya kimvuka' },
  'Imprimer sur A4': { ln: 'Kobimisa na lokasa A4', sw: 'Chapisha kwenye karatasi A4', kg: 'Kubasisa na lukaya A4' },
  'Imprimer sur le terminal': { ln: 'Kobimisa na masini', sw: 'Chapisha kwenye mashine', kg: 'Kubasisa na masini' },
  'Vérifier une carte': { ln: 'Kotala karte', sw: 'Kagua kadi', kg: 'Kutala karte' },
  'Carte authentique': { ln: 'Karte ya solo', sw: 'Kadi ni halali', kg: 'Karte ya kieleka' },
  'Référence de la carte': { ln: 'Nimero ya karte', sw: 'Namba ya kadi', kg: 'Nimero ya karte' },
  'Nom inscrit sur la carte': { ln: 'Nkombo ekomami na karte', sw: 'Jina lililoandikwa kwenye kadi' },
  'Vérifier': { ln: 'Kotala', sw: 'Kagua', kg: 'Kutala' },
  'Lieu du groupe': { ln: 'Esika ya lisanga', sw: 'Mahali pa kikundi', kg: 'Kisika ya kimvuka' },
  'Point GPS du groupe': { ln: 'Esika ya lisanga (GPS)', sw: 'Mahali pa kikundi (GPS)', kg: 'Kisika ya kimvuka (GPS)' },
  'Prendre le point GPS': { ln: 'Kozwa esika (GPS)', sw: 'Chukua mahali (GPS)', kg: 'Kubaka kisika (GPS)' },
  'Prendre le point maintenant': { ln: 'Kozwa esika sikoyo', sw: 'Chukua mahali sasa', kg: 'Kubaka kisika ntangu yai' },
  'Reprendre le point': { ln: 'Kozwa esika lisusu', sw: 'Chukua tena mahali', kg: 'Kubaka diaka kisika' },
  'Facultatif': { ln: 'Soki olingi', sw: 'Si lazima', kg: 'Kana nge zola' },
  'Mettre à jour': { ln: 'Kobongisa', sw: 'Sasisha', kg: 'Kutomisa' },
  'Chercher une mise à jour maintenant': { ln: 'Koluka bobongisi sikoyo', sw: 'Tafuta sasisho sasa' },
  'Installer': { ln: 'Kotia', sw: 'Sakinisha', kg: 'Kutula' },
  'Apparence': { ln: 'Lolenge ya ekran', sw: 'Muonekano', kg: 'Mutindu ya ekran' },
  'Fond clair': { ln: 'Fond ya pembe', sw: 'Mandharinyuma meupe', kg: 'Fond ya mpembe' },
  'Fond sombre': { ln: 'Fond ya moindo', sw: 'Mandharinyuma meusi', kg: 'Fond ya ndombe' },
  'Comme le téléphone': { ln: 'Lokola telefone', sw: 'Kama simu', kg: 'Bonso telefone' },
  'Mon code': { ln: 'Kode na ngai', sw: 'Namba yangu ya siri', kg: 'Kode na mono' },
  'Guide': { ln: 'Litambwisi', sw: 'Mwongozo', kg: 'Nsongi' },
  'Guide d’utilisation': { ln: 'Litambwisi ya kosalela', sw: 'Mwongozo wa matumizi', kg: 'Nsongi ya kusadila' },
  'Formation': { ln: 'Formasyo', sw: 'Mafunzo', kg: 'Malongi' },
  'Démonstration': { ln: 'Komeka', sw: 'Onyesho', kg: 'Kumeka' },
  'Accueil': { ln: 'Ebandeli', sw: 'Mwanzo', kg: 'Nzo', lua: 'Ku nzubu' },
  'Membres': { ln: 'Bato ya lisanga', sw: 'Wanachama', kg: 'Bantu ya kimvuka', lua: 'Bena kasumbu' },
  'Crédits': { ln: 'Banyongo', sw: 'Mikopo', kg: 'Mbongo ya kudefa' },
  'Journal': { ln: 'Buku', sw: 'Daftari', kg: 'Buku', lua: 'Mukanda' },
  'Plus': { ln: 'Mosusu', sw: 'Zaidi', kg: 'Yankaka', lua: 'Bikuabu' },
  'Argent dans la caisse': { ln: 'Mbongo na sanduku', sw: 'Pesa ndani ya sanduku', kg: 'Mbongo na kesi', lua: 'Makuta mu tshisanduku' },
  'Caisse de crédit': { ln: 'Sanduku ya banyongo', sw: 'Mfuko wa mikopo', kg: 'Kesi ya bandefa' },
  'Caisse sociale': { ln: 'Sanduku ya lisalisi', sw: 'Mfuko wa kusaidiana', kg: 'Kesi ya lusadisu' },
  'Ouvrir la réunion n°{n}': { ln: 'Fungola likita ya {n}', sw: 'Fungua mkutano wa {n}', kg: 'Zibula lukutakanu ya {n}' },
  'Continuer la réunion n°{n}': { ln: 'Kokoba likita ya {n}', sw: 'Endelea na mkutano wa {n}', kg: 'Landa lukutakanu ya {n}' },
  'Épargne du cycle': { ln: 'Mbongo ebombami', sw: 'Akiba ya mzunguko', kg: 'Mbongo ya kubumba' },
  'Crédits à rembourser': { ln: 'Banyongo ya kozongisa', sw: 'Mikopo ya kulipa', kg: 'Bandefa ya kufuta' },
  'Présence': { ln: 'Koya na likita', sw: 'Mahudhurio' },
  'Valeur d\'une part': { ln: 'Motuya ya eteni moko', sw: 'Thamani ya hisa moja', kg: 'Ntalu ya kiteni mosi' },
  'À surveiller': { ln: 'Makambo ya kotala', sw: 'Mambo ya kuangalia' },
  'Dernières réunions': { ln: 'Makita ya nsuka', sw: 'Mikutano ya mwisho', kg: 'Bakutakanu ya nsuka' },
  'Journal protégé': { ln: 'Buku ebatelami', sw: 'Daftari limelindwa' },
  'Qui êtes-vous ?': { ln: 'Ozali nani?', sw: 'Wewe ni nani?', kg: 'Nge kele nani?', lua: 'Wewe udi nganyi?' },
  'Membre d\'une AVEC': { ln: 'Moto ya lisanga AVEC', sw: 'Mwanachama wa AVEC', kg: 'Muntu ya kimvuka AVEC' },
  'Créer une AVEC': { ln: 'Kosala lisanga', sw: 'Kuunda AVEC' },
  'Tenir la réunion': { ln: 'Kosala likita', sw: 'Kufanya mkutano' },
  'Voir mon carnet': { ln: 'Tala kaye na ngai', sw: 'Ona kitabu changu' },
  'Tous les membres': { ln: 'Bato nyonso ya lisanga', sw: 'Wanachama wote' },
  'Choisir mon AVEC': { ln: 'Pona lisanga na ngai', sw: 'Chagua AVEC yangu' },
  'Autres accès': { ln: 'Bisika mosusu', sw: 'Njia nyingine' },
  'Recevoir une AVEC': { ln: 'Kozwa lisanga', sw: 'Kupokea AVEC' },
  'Guide d\'utilisation': { ln: 'Ndenge ya kosalela', sw: 'Mwongozo wa matumizi' },
  'Choisir mon AVEC': { ln: 'Pona lisanga na ngai', sw: 'Chagua AVEC yangu', kg: 'Pona kimvuka na mono' },
  'Touchez votre nom': { ln: 'Simba nkombo na yo', sw: 'Gusa jina lako', kg: 'Simba nkombo na nge', lua: 'Lenga dîna diebe' },
  'Connexion': { ln: 'Kokota', sw: 'Kuingia', kg: 'Kukota', lua: 'Kubuela' },
  '{n}, tapez votre code secret': { ln: '{n}, koma nimero na yo ya sekele', sw: '{n}, andika namba yako ya siri', kg: '{n}, sonika nimero na nge ya nsweki' },
  'Annuler': { ln: 'Tika', sw: 'Acha' },
  'Confirmer le comptage': { ln: 'Ndima motango', sw: 'Thibitisha hesabu' },
  'Code incorrect': { ln: 'Nimero ya sekele ezali mabe', sw: 'Namba ya siri si sahihi', kg: 'Nimero ya nsweki kele mbi' },
  'Présences': { ln: 'Bato bazali', sw: 'Mahudhurio', kg: 'Bantu kele' },
  'Comptage': { ln: 'Kotanga mbongo', sw: 'Kuhesabu', kg: 'Kutanga mbongo', lua: 'Kubala makuta' },
  'Sociale': { ln: 'Lisalisi', sw: 'Msaada', kg: 'Lusadisu' },
  'Épargne': { ln: 'Kobomba', sw: 'Akiba', kg: 'Kubumba' },
  'Rembours.': { ln: 'Kozongisa', sw: 'Kulipa', kg: 'Kufuta' },
  'Amendes': { ln: 'Bafute', sw: 'Faini' },
  'Clôture': { ln: 'Kokanga', sw: 'Kufunga', kg: 'Kukanga' },
  'Qui est là ?': { ln: 'Nani azali awa?', sw: 'Nani yupo?', kg: 'Nani kele awa?', lua: 'Nganyi udiku?' },
  'Là': { ln: 'Azali', sw: 'Yupo', kg: 'Kele', lua: 'Udiku' },
  'Retard': { ln: 'Nsima', sw: 'Amechelewa' },
  'Absent': { ln: 'Azangi', sw: 'Hayupo', kg: 'Kele ve', lua: 'Kêna' },
  'Valider les présences': { ln: 'Ndima bato bazali', sw: 'Thibitisha mahudhurio' },
  'Suivant': { ln: 'Oyo elandi', sw: 'Endelea', kg: 'Yina ke landa', lua: 'Tshilonda' },
  'Ouvrir la caisse': { ln: 'Fungola sanduku', sw: 'Fungua sanduku', kg: 'Zibula kesi' },
  'Selon le cahier': { ln: 'Kolanda buku', sw: 'Kulingana na daftari' },
  'Argent compté (FC)': { ln: 'Mbongo etangami (FC)', sw: 'Pesa iliyohesabiwa (FC)', kg: 'Mbongo ya kutanga (FC)' },
  'Caisse comptée': { ln: 'Sanduku etangami', sw: 'Sanduku limehesabiwa' },
  'Enregistrer la caisse sociale': { ln: 'Koma sanduku ya lisalisi', sw: 'Andika mfuko wa kusaidiana' },
  'Donner une aide sociale': { ln: 'Kopesa lisalisi', sw: 'Toa msaada' },
  'Achat de parts': { ln: 'Kosomba biteni', sw: 'Kununua hisa', kg: 'Kusumba biteni' },
  'Mettre 1 part à tout le monde': { ln: 'Eteni moko na moto nyonso', sw: 'Hisa moja kwa kila mtu' },
  'Enregistrer l\'épargne': { ln: 'Koma mbongo ebombami', sw: 'Andika akiba' },
  'Remboursements': { ln: 'Kozongisa nyongo', sw: 'Malipo ya mikopo', kg: 'Kufuta bandefa' },
  'Échéance': { ln: 'Oyo esengeli', sw: 'Kiasi cha mwezi' },
  'Total reçu': { ln: 'Mbongo nyonso ekoti', sw: 'Jumla iliyopokelewa' },
  'Enregistrer les remboursements': { ln: 'Koma nyongo ezongisami', sw: 'Andika malipo' },
  'Nouveaux crédits': { ln: 'Banyongo ya sika', sw: 'Mikopo mipya' },
  'Accorder un crédit': { ln: 'Kopesa nyongo', sw: 'Toa mkopo', kg: 'Kudefa mbongo' },
  'Terminer les crédits': { ln: 'Kosilisa banyongo', sw: 'Maliza mikopo' },
  'Enregistrer les amendes': { ln: 'Koma bafute', sw: 'Andika faini' },
  'Fermer la caisse': { ln: 'Kanga sanduku', sw: 'Funga sanduku', kg: 'Kanga kesi' },
  'Doit être dans la caisse': { ln: 'Esengeli kozala na sanduku', sw: 'Inapaswa kuwa sandukuni' },
  'Les trois clés': { ln: 'Bafungola misato', sw: 'Funguo tatu' },
  'confirmé': { ln: 'endimami', sw: 'imethibitishwa' },
  'toucher': { ln: 'simba', sw: 'gusa', kg: 'simba' },
  'Fermer et sceller la réunion': { ln: 'Kanga likita', sw: 'Funga mkutano' },
  'La caisse est juste': { ln: 'Sanduku ezali malamu', sw: 'Sanduku liko sawa', kg: 'Kesi kele mbote' },
  'Étape enregistrée': { ln: 'Eteni ekomami', sw: 'Hatua imeandikwa' },
  'Retour à l\'accueil': { ln: 'Zonga na ebandeli', sw: 'Rudi mwanzo' },
  'Mon carnet': { ln: 'Kaye na ngai', sw: 'Akiba changu', kg: 'Buku na mono', lua: 'Mukanda wanyi' },
  'Mon épargne': { ln: 'Mbongo na ngai ebombami', sw: 'Akiba yangu' },
  'Parts achetées': { ln: 'Biteni nasombi', sw: 'Hisa zilizonunuliwa' },
  'Valeur si partage': { ln: 'Motuya soki bakaboli', sw: 'Thamani wakati wa kugawa' },
  'Timbres d\'épargne': { ln: 'Bilembo ya kobomba', sw: 'Alama za akiba' },
  'Historique': { ln: 'Makambo eleki', sw: 'Kumbukumbu' },
  'Aucun crédit': { ln: 'Nyongo ezali te', sw: 'Hakuna mkopo' },
  'Changer mon code secret': { ln: 'Bongola nimero na ngai ya sekele', sw: 'Badilisha namba yangu ya siri' },
  'Partage de fin de cycle': { ln: 'Kokabola na nsuka ya mbula', sw: 'Kugawa mwisho wa mzunguko' },
  'Faire le partage maintenant': { ln: 'Kabola sikoyo', sw: 'Gawa sasa' },
  'Une part vaut': { ln: 'Eteni moko ezali na motuya', sw: 'Hisa moja ina thamani' },
  'Membre': { ln: 'Moto', sw: 'Mwanachama' },
  'Parts': { ln: 'Biteni', sw: 'Hisa', kg: 'Biteni', lua: 'Bitupa' },
  'Reçoit': { ln: 'Azwi', sw: 'Anapokea' },
  'Synchronisation': { ln: 'Kotinda makambo', sw: 'Kutuma data' },
  'Envoyer maintenant': { ln: 'Tinda sikoyo', sw: 'Tuma sasa', kg: 'Tinda ntangu yai' },
  'À jour': { ln: 'Etindami', sw: 'Imetumwa' },
  'Hors ligne': { ln: 'Rezo ezali te', sw: 'Hakuna mtandao', kg: 'Rezo kele ve', lua: 'Kakuena rezo' },
  'Pas de réseau. Tout reste enregistré sur ce téléphone.': { ln: 'Rezo ezali te. Nyonso etikali na telefone oyo.', sw: 'Hakuna mtandao. Kila kitu kimehifadhiwa kwenye simu hii.' },
  'Écrivez le montant compté': { ln: 'Koma mbongo etangami', sw: 'Andika pesa iliyohesabiwa' },
  'Seul le bureau peut ouvrir une réunion': { ln: 'Kaka bakambi bakoki kofungola likita', sw: 'Viongozi pekee wanaweza kufungua mkutano' },
  'Ajouter un membre': { ln: 'Bakisa moto', sw: 'Ongeza mwanachama' },
  'Changer d\'utilisateur': { ln: 'Bongola moto', sw: 'Badilisha mtumiaji' },
  'Nom complet': { ln: 'Nkombo mobimba', sw: 'Jina kamili' },
  'Sexe': { ln: 'Mwasi to mobali', sw: 'Jinsia' },
  'Femme': { ln: 'Mwasi', sw: 'Mwanamke', kg: 'Nkento', lua: 'Mukaji' },
  'Homme': { ln: 'Mobali', sw: 'Mwanaume', kg: 'Bakala', lua: 'Mulume' },
  'Âge': { ln: 'Mbula', sw: 'Umri' },
  'Téléphone': { ln: 'Telefone', sw: 'Simu' },
  'Activité': { ln: 'Mosala', sw: 'Kazi', kg: 'Kisalu', lua: 'Mudimu' },
  'Adresse': { ln: 'Esika ya kofanda', sw: 'Anwani' },
  'facultatif': { ln: 'soki olingi', sw: 'si lazima' },
  'Informations': { ln: 'Makambo na ye', sw: 'Taarifa' },

  /* ---- les phrases que le groupe lit à chaque réunion ----
     Relevées sur les écrans réellement ouverts, les plus fréquentes d'abord. {n} tient la place
     d'un nombre, d'une date ou d'un nom : une seule entrée couvre toutes les lignes de même forme.
     Lingála et kiswahili seulement : ce sont les langues des zones où Akiba part, et celles qu'on
     peut écrire sans inventer. Brouillons à faire relire par des locuteurs de la zone. */
  'Épargne {n}': { ln: 'Kobomba {n}', sw: 'Akiba {n}' },
  'Épargne (parts) · {n}': { ln: 'Kobomba (biteni) · {n}', sw: 'Akiba (hisa) · {n}' },
  'Épargne (parts) · {n} parts': { ln: 'Kobomba (biteni) · biteni {n}', sw: 'Akiba (hisa) · hisa {n}' },
  'Épargne {n} · remb. {n}': { ln: 'Kobomba {n} · kozongisa {n}', sw: 'Akiba {n} · marejesho {n}' },
  'reste {n}': { ln: 'etikali {n}', sw: 'imebaki {n}' },
  'doit {n}': { ln: 'azali na nyongo ya {n}', sw: 'anadaiwa {n}' },
  'crédit {n}': { ln: 'nyongo {n}', sw: 'mkopo {n}' },
  'épargne': { ln: 'kobomba', sw: 'akiba' },
  'Membre depuis {n}': { ln: 'Moto ya lisanga banda {n}', sw: 'Mwanachama tangu {n}' },
  'Membre depuis': { ln: 'Moto ya lisanga banda', sw: 'Mwanachama tangu' },
  'Membre · {n} parts': { ln: 'Moto ya lisanga · biteni {n}', sw: 'Mwanachama · hisa {n}' },
  'Membre · {n} parts ·': { ln: 'Moto ya lisanga · biteni {n} ·', sw: 'Mwanachama · hisa {n} ·' },
  'Caisse sociale · {n}': { ln: 'Sanduku ya lisalisi · {n}', sw: 'Mfuko wa kusaidiana · {n}' },
  'Amende · {n}': { ln: 'Lamande · {n}', sw: 'Faini · {n}' },
  'Remboursement · {n}': { ln: 'Kozongisa nyongo · {n}', sw: 'Marejesho · {n}' },
  'Crédit accordé · {n}': { ln: 'Nyongo epesami · {n}', sw: 'Mkopo umetolewa · {n}' },
  'Crédit accordé': { ln: 'Nyongo epesami', sw: 'Mkopo umetolewa' },
  'Remboursement': { ln: 'Kozongisa nyongo', sw: 'Marejesho' },
  'Amende': { ln: 'Lamande', sw: 'Faini' },
  'Amendes payées': { ln: 'Balamande efutami', sw: 'Faini zilizolipwa' },
  'Amende due (pas encore payée)': { ln: 'Lamande ya kofuta (naino te)', sw: 'Faini inayodaiwa (bado haijalipwa)' },
  'Frais': { ln: 'Mbongo ya mosala', sw: 'Gharama' },
  'Frais payés': { ln: 'Mbongo ya mosala efutami', sw: 'Gharama zilizolipwa' },
  'Soldé': { ln: 'Efutami nyonso', sw: 'Imelipwa yote' },
  'Soldés': { ln: 'Efutami nyonso', sw: 'Zimelipwa zote' },
  'Remboursé': { ln: 'Ezongisami', sw: 'Imerejeshwa' },
  'remboursé {n} / {n}': { ln: 'ezongisami {n} / {n}', sw: 'imerejeshwa {n} / {n}' },
  'Reste à rembourser': { ln: 'Etikali ya kozongisa', sw: 'Kilichobaki kurejeshwa' },
  'À rembourser': { ln: 'Ya kozongisa', sw: 'Ya kurejesha' },
  'En retard': { ln: 'Na retare', sw: 'Amechelewa' },
  'En cours': { ln: 'Ezali kotambola', sw: 'Inaendelea' },
  'Disponible': { ln: 'Ezali', sw: 'Ipo' },
  'Retenu': { ln: 'Ekangami', sw: 'Imezuiliwa' },
  'Bénéfice': { ln: 'Litomba', sw: 'Faida' },
  'Intérêts gagnés': { ln: 'Matomba ya nyongo', sw: 'Riba iliyopatikana' },
  'Aucun crédit en retard': { ln: 'Nyongo moko te na retare', sw: 'Hakuna mkopo uliochelewa' },
  'Présidente': { ln: 'Mokonzi ya lisanga', sw: 'Mwenyekiti' },
  'Secrétaire': { ln: 'Mokomi', sw: 'Katibu' },
  'Trésorière': { ln: 'Mobombi mbongo', sw: 'Mweka hazina' },
  'Compteur': { ln: 'Motangi', sw: 'Mhesabu' },
  'Compteuse': { ln: 'Motangi', sw: 'Mhesabu' },
  'Porte-clé': { ln: 'Mobateli fungola', sw: 'Mshika ufunguo' },
  'Porte-clé · {n} parts': { ln: 'Mobateli fungola · biteni {n}', sw: 'Mshika ufunguo · hisa {n}' },
  'Bureau et porte-clés': { ln: 'Bakonzi mpe babateli fungola', sw: 'Uongozi na washika funguo' },
  'Changer un responsable': { ln: 'Kobongola mokonzi moko', sw: 'Kubadilisha kiongozi' },
  'Cycle {n}': { ln: 'Mobu {n}', sw: 'Mzunguko {n}' },
  'Cycle {n} · fin le {n}': { ln: 'Mobu {n} · esuki {n}', sw: 'Mzunguko {n} · unaisha {n}' },
  'Semaine {n} sur {n}': { ln: 'Poso {n} na {n}', sw: 'Wiki {n} kati ya {n}' },
  'fin le {n}': { ln: 'esuki {n}', sw: 'unaisha {n}' },
  'début {n}': { ln: 'ebandi {n}', sw: 'ulianza {n}' },
  'Fin du cycle': { ln: 'Nsuka ya mobu', sw: 'Mwisho wa mzunguko' },
  'Réunion ouverte': { ln: 'Likita efungwami', sw: 'Mkutano umefunguliwa' },
  'Réunion n°{n}': { ln: 'Likita ya {n}', sw: 'Mkutano wa {n}' },
  'Réunion n°{n} en cours': { ln: 'Likita ya {n} ezali kotambola', sw: 'Mkutano wa {n} unaendelea' },
  'Réunion n°{n} ouverte': { ln: 'Likita ya {n} efungwami', sw: 'Mkutano wa {n} umefunguliwa' },
  'Réunions': { ln: 'Makita', sw: 'Mikutano' },
  'Caisse juste': { ln: 'Sanduku ekoki', sw: 'Sanduku liko sawa' },
  'Historique des cycles': { ln: 'Mibu eleki', sw: 'Mizunguko iliyopita' },
  'Cycles terminés': { ln: 'Mibu esili', sw: 'Mizunguko iliyokwisha' },
  'Suivie': { ln: 'Elandami', sw: 'Inafuatiliwa' },
  'Autonome': { ln: 'Ya yango moko', sw: 'Huru' },
  'À valider': { ln: 'Ya kondima', sw: 'Ya kuthibitisha' },
  'Carnet de membre': { ln: 'Buku ya moto ya lisanga', sw: 'Daftari la mwanachama' },
  'Mon carnet et mon code': { ln: 'Buku na ngai mpe kode na ngai', sw: 'Daftari langu na namba yangu ya siri' },
  'Reçus des membres': { ln: 'Barisi ya bato ya lisanga', sw: 'Risiti za wanachama' },
  'Imprimer les {n} reçus': { ln: 'Kobimisa barisi {n}', sw: 'Chapisha risiti {n}' },
  'Imprimer le journal': { ln: 'Kobimisa buku ya likita', sw: 'Chapisha daftari la mkutano' },
  'Reçus courts': { ln: 'Barisi ya mokuse', sw: 'Risiti fupi' },
  'Modifier les informations': { ln: 'Kobongola makambo', sw: 'Badilisha taarifa' },
  'Valeur estimée si partage': { ln: 'Motuya soki bakaboli lelo', sw: 'Thamani kama mkigawana leo' },
  'Une part vaut en moyenne': { ln: 'Eteni moko ezali na motuya ya', sw: 'Hisa moja ina thamani ya wastani' },
  'achetée {n}': { ln: 'esombami {n}', sw: 'ilinunuliwa {n}' },
  'Mon rêve': { ln: 'Ndoto na ngai', sw: 'Ndoto yangu' },
  'En écrire un': { ln: 'Kokoma yango', sw: 'Andika moja' },
  'À ce rythme': { ln: 'Soki okobi bongo', sw: 'Kwa mwendo huu' },
  'Signe du groupe': { ln: 'Elembo ya lisanga', sw: 'Alama ya kikundi' },
  'Sons': { ln: 'Mingongo', sw: 'Sauti' },
  'Une note à chaque écriture': { ln: 'Mongongo na mokomi nyonso', sw: 'Sauti kwa kila andiko' },
  'Voix de lecture': { ln: 'Mongongo ya kotanga', sw: 'Sauti ya kusoma' },
  'Sécurité et codes': { ln: 'Libateli mpe bakode', sw: 'Usalama na namba za siri' },
  'Sécurité et carte de secours': { ln: 'Libateli mpe karte ya lisalisi', sw: 'Usalama na kadi ya dharura' },
  'Carte de secours': { ln: 'Karte ya lisalisi', sw: 'Kadi ya dharura' },
  'Codes encore valables': { ln: 'Bakode ezali naino malamu', sw: 'Namba bado zinafaa' },
  'Journal de sécurité': { ln: 'Buku ya libateli', sw: 'Daftari la usalama' },
  'Journal intact · {n} écritures': { ln: 'Buku ebebi te · makomi {n}', sw: 'Daftari halijaharibika · maandiko {n}' },
  'Entré dans la caisse': { ln: 'Ekoti na sanduku', sw: 'Imeingia sandukuni' },
  'Argent de la caisse de crédit': { ln: 'Mbongo ya sanduku ya banyongo', sw: 'Pesa za mfuko wa mikopo' },
  'Expliquez l\'écart': { ln: 'Limbola bokeseni', sw: 'Eleza tofauti' },
  'Vérifier maintenant': { ln: 'Kotala sikoyo', sw: 'Kagua sasa' },
  'Vérifier un reçu contesté': { ln: 'Kotala risi oyo bazali kotia tembe', sw: 'Kagua risiti yenye mashaka' },
  '= Total à partager': { ln: '= Nyonso ya kokabola', sw: '= Jumla ya kugawana' },
  '÷ Parts des membres': { ln: '÷ Biteni ya bato ya lisanga', sw: '÷ Hisa za wanachama' },
  '− Épargne rendue aux membres': { ln: '− Mbongo ebombamaki ezongi epai ya bato', sw: '− Akiba iliyorudishwa kwa wanachama' },
  '+ Crédits encore à rembourser': { ln: '+ Banyongo ya kozongisa naino', sw: '+ Mikopo bado ya kurejeshwa' },
  '+ Amendes encore dues': { ln: '+ Balamande ya kofuta naino', sw: '+ Faini bado zinazodaiwa' },
  '= Bénéfice du cycle à partager': { ln: '= Litomba ya mobu ya kokabola', sw: '= Faida ya mzunguko ya kugawana' },
  'Caisse sociale (cycle suivant)': { ln: 'Sanduku ya lisalisi (mobu oyo elandi)', sw: 'Mfuko wa kusaidiana (mzunguko ujao)' },
  'Argent donné aux membres': { ln: 'Mbongo epesami na bato ya lisanga', sw: 'Pesa zilizotolewa kwa wanachama' },
  'pour le partage': { ln: 'mpo na bokaboli', sw: 'kwa ajili ya mgawanyo' },
  'Voir le partage ›': { ln: 'Tala bokaboli ›', sw: 'Tazama mgawanyo ›' },
  'Le cycle n\'est pas fini': { ln: 'Mobu esili naino te', sw: 'Mzunguko haujaisha' },
  'Parts par réunion': { ln: 'Biteni na likita moko', sw: 'Hisa kwa kila mkutano' },
  'Intérêt du crédit': { ln: 'Litomba ya nyongo', sw: 'Riba ya mkopo' },
  'Crédit maximum': { ln: 'Nyongo oyo eleki monene', sw: 'Mkopo wa juu kabisa' },
  'Durée du cycle': { ln: 'Bolai ya mobu', sw: 'Muda wa mzunguko' },
  'Durée maximum du crédit': { ln: 'Bolai oyo eleki ya nyongo', sw: 'Muda wa juu wa mkopo' },
  'Amende absence / retard': { ln: 'Lamande ya kozanga / ya retare', sw: 'Faini ya kutohudhuria / kuchelewa' },
  'Pénalité de retard de crédit': { ln: 'Lamande ya retare ya nyongo', sw: 'Adhabu ya kuchelewa kulipa mkopo' },
  'Règlement intérieur · cycle {n}': { ln: 'Mibeko ya lisanga · mobu {n}', sw: 'Kanuni za kikundi · mzunguko {n}' },
  'Nouvelle AVEC': { ln: 'Lisanga ya sika', sw: 'AVEC mpya' },
  'Sur ce téléphone': { ln: 'Na telefone oyo', sw: 'Kwenye simu hii' },
  'sur cet appareil': { ln: 'na masini oyo', sw: 'kwenye kifaa hiki' },
  'Autre AVEC sur ce téléphone ({n})': { ln: 'Lisanga mosusu na telefone oyo ({n})', sw: 'AVEC nyingine kwenye simu hii ({n})' },
  '{n} · touchez pour entrer': { ln: '{n} · simba mpo okota', sw: '{n} · gusa ili uingie' },
  'Changer de téléphone': { ln: 'Kobongola telefone', sw: 'Badilisha simu' },
  'Mettre l\'AVEC sur un nouveau téléphone': { ln: 'Kotia lisanga na telefone ya sika', sw: 'Weka AVEC kwenye simu mpya' },
  'Installer et sauvegarder': { ln: 'Kotia mpe kobomba', sw: 'Sakinisha na hifadhi' },
  'Aucune sauvegarde pour le moment': { ln: 'Bobombi ezali naino te', sw: 'Hakuna nakala bado' },
  'Données non synchronisées': { ln: 'Makambo etindami naino te', sw: 'Taarifa hazijatumwa' },
  'À envoyer à l\'animateur': { ln: 'Ya kotinda epai ya molakisi', sw: 'Ya kutuma kwa mwezeshaji' },
  'Dernière synchronisation il y a {n} jours': { ln: 'Botindi ya nsuka eleki mikolo {n}', sw: 'Usawazishaji wa mwisho siku {n} zilizopita' },
  'Accompagnement': { ln: 'Bolandi', sw: 'Ufuatiliaji' },
  'Animateur : {n}': { ln: 'Molakisi : {n}', sw: 'Mwezeshaji : {n}' },
  'Connecté : {n}': { ln: 'Akoti : {n}', sw: 'Ameingia : {n}' },
  'Visite du {n}': { ln: 'Botali ya {n}', sw: 'Ziara ya {n}' },
  'Départ du groupe': { ln: 'Kobima na lisanga', sw: 'Kuondoka kwenye kikundi' },
  'Rendre son épargne et fermer son carnet': { ln: 'Kozongisa mbongo na ye mpe kokanga buku na ye', sw: 'Kurudisha akiba yake na kufunga daftari lake' },
  'Crédit extérieur (IMF)': { ln: 'Nyongo ya libanda (IMF)', sw: 'Mkopo wa nje (IMF)' },
  'Crédit extérieur': { ln: 'Nyongo ya libanda', sw: 'Mkopo wa nje' },
  'Crédit extérieur à rembourser': { ln: 'Nyongo ya libanda ya kozongisa', sw: 'Mkopo wa nje wa kurejesha' },
  'Dette extérieure': { ln: 'Nyongo ya libanda', sw: 'Deni la nje' },
  'De la demande au remboursement': { ln: 'Banda bosengi tii bozongisi', sw: 'Kutoka ombi hadi marejesho' },
  'Dossier pour une IMF': { ln: 'Dosye mpo na IMF', sw: 'Jalada kwa ajili ya IMF' },
  'Partager les chiffres du groupe pour un crédit extérieur': { ln: 'Kolakisa mituya ya lisanga mpo na nyongo ya libanda', sw: 'Kushiriki takwimu za kikundi kwa mkopo wa nje' },
  'Tout sur l\'AVEC et l\'application': { ln: 'Makambo nyonso ya lisanga mpe ya application', sw: 'Yote kuhusu AVEC na programu' },
  'Aucun évènement pour le moment': { ln: 'Likambo moko te mpo na sikoyo', sw: 'Hakuna tukio kwa sasa' },
  'Aucun cycle terminé pour le moment.': { ln: 'Mobu moko esili naino te.', sw: 'Hakuna mzunguko uliokwisha bado.' },
  'Si quelqu\'un perd son code': { ln: 'Soki moto abungisi kode na ye', sw: 'Kama mtu amepoteza namba yake' },
  'J\'ai oublié mon code secret': { ln: 'Nabosani kode na ngai', sw: 'Nimesahau namba yangu ya siri' },
  'Aucune imprimante détectée': { ln: 'Masini ya kobimisa emonani te', sw: 'Hakuna printa iliyopatikana' },
  'Aucun réseau n\'est nécessaire.': { ln: 'Rezo esengeli te.', sw: 'Mtandao hauhitajiki.' },
  '{n} · non envoyé': { ln: '{n} · etindami naino te', sw: '{n} · haijatumwa' },
  '{n} · {n} membres': { ln: '{n} · bato {n}', sw: '{n} · wanachama {n}' },
  '{n} · cycle {n}, semaine {n}': { ln: '{n} · mobu {n}, poso {n}', sw: '{n} · mzunguko {n}, wiki {n}' },
  '{n} · cycle {n}': { ln: '{n} · mobu {n}', sw: '{n} · mzunguko {n}' },
  'Bonjour {n}': { ln: 'Mbote {n}', sw: 'Habari {n}' },
  'Présidente · {n}': { ln: 'Mokonzi ya lisanga · {n}', sw: 'Mwenyekiti · {n}' },
  'Présidente · {n} parts ·': { ln: 'Mokonzi ya lisanga · biteni {n} ·', sw: 'Mwenyekiti · hisa {n} ·' },
  'Secrétaire · {n} parts ·': { ln: 'Mokomi · biteni {n} ·', sw: 'Katibu · hisa {n} ·' },
  'Trésorière · {n} parts ·': { ln: 'Mobombi mbongo · biteni {n} ·', sw: 'Mweka hazina · hisa {n} ·' },
  'Compteur · {n} parts': { ln: 'Motangi · biteni {n}', sw: 'Mhesabu · hisa {n}' },
  'Compteuse · {n} parts ·': { ln: 'Motangi · biteni {n} ·', sw: 'Mhesabu · hisa {n} ·' },
  'Porte-clé · {n} parts ·': { ln: 'Mobateli fungola · biteni {n} ·', sw: 'Mshika ufunguo · hisa {n} ·' },
  '{n} · Absence': { ln: '{n} · Azali te', sw: '{n} · Hayupo' },
  '{n} · Amende d\'absence payée': { ln: '{n} · Lamande ya kozanga efutami', sw: '{n} · Faini ya kutohudhuria imelipwa' },
  'Étape {n} sur {n} · touchez pour continuer': { ln: 'Etape {n} na {n} · simba mpo okoba', sw: 'Hatua {n} kati ya {n} · gusa ili uendelee' },
  'Voir les {n} écritures': { ln: 'Tala makomi {n}', sw: 'Tazama maandiko {n}' },
  'dans {n} semaines': { ln: 'na baposo {n}', sw: 'baada ya wiki {n}' },
  '— {n} réunions encore.': { ln: '— makita {n} naino.', sw: '— mikutano {n} bado.' },
  ', à la fin du cycle vous aurez environ': { ln: ', na nsuka ya mobu okozala na pene', sw: ', mwisho wa mzunguko utakuwa na takriban' },
  'Montant accordé': { ln: 'Mbongo epesami', sw: 'Kiasi kilichotolewa' },
  'Intérêts ({n} × {n} mois)': { ln: 'Matomba ({n} × sanza {n})', sw: 'Riba ({n} × miezi {n})' },
  'Coût total (intérêts + frais)': { ln: 'Motuya nyonso (matomba + mbongo ya mosala)', sw: 'Gharama jumla (riba + ada)' },
  'Garantie déduite du solde': { ln: 'Ndanga elongwe na oyo etikali', sw: 'Dhamana imetolewa kwenye salio' },
  'caisse de crédit': { ln: 'sanduku ya banyongo', sw: 'mfuko wa mikopo' },
  'Caisse sociale versée': { ln: 'Sanduku ya lisalisi efutami', sw: 'Mfuko wa kusaidiana umelipwa' },
  'Remboursé d\'abord au prêteur': { ln: 'Ezongisami liboso epai ya modefisi', sw: 'Analipwa kwanza mkopeshaji' },
  'Le prêteur est remboursé avant le partage': { ln: 'Modefisi azongisami liboso ya bokaboli', sw: 'Mkopeshaji analipwa kabla ya mgawanyo' },
  '− Garantie gardée par le prêteur': { ln: '− Ndanga etikali epai ya modefisi', sw: '− Dhamana iliyoshikwa na mkopeshaji' },
  '− Crédit extérieur à rembourser au prêteur': { ln: '− Nyongo ya libanda ya kozongisa epai ya modefisi', sw: '− Mkopo wa nje wa kulipa mkopeshaji' },
  'Reste des arrondis (cycle suivant)': { ln: 'Mwa ndambo etikali (mobu oyo elandi)', sw: 'Mabaki ya mviringo (mzunguko ujao)' },
  'déjà retirée de la valeur des parts': { ln: 'esili kolongolama na motuya ya biteni', sw: 'tayari imeondolewa kwenye thamani ya hisa' },
  'Fermez-la d\'abord : le partage se fait dans une séance à part.': { ln: 'Kanga yango liboso : bokaboli esalemaka na likita na yango moko.', sw: 'Funga kwanza : mgawanyo hufanyika katika kikao chake.' },
  'Créer une nouvelle carte': { ln: 'Kosala karte ya sika', sw: 'Tengeneza kadi mpya' },
  'Choisir la voix qui lit à haute voix': { ln: 'Kopona mongongo oyo ekotanga makasi', sw: 'Chagua sauti inayosoma kwa sauti' },
  'Commencer avec mes vraies données': { ln: 'Kobanda na makambo na ngai ya solo', sw: 'Anza na taarifa zangu za kweli' },
  'Remettre la démo à zéro': { ln: 'Kozongisa komeka na ebandeli', sw: 'Rudisha onyesho mwanzo' },
  'Téléphone, activité, adresse, âge': { ln: 'Telefone, mosala, esika, mibu', sw: 'Simu, kazi, anwani, umri' },
  'Arbre · Vert': { ln: 'Nzete · Vert', sw: 'Mti · Kijani' },
  'économe': { ln: 'abombaka malamu', sw: 'mwenye kuweka akiba' },
  'Dimanche': { ln: 'Eyenga', sw: 'Jumapili' },
  'Lundi': { ln: 'Mokolo ya 1', sw: 'Jumatatu' },
  'Mardi': { ln: 'Mokolo ya 2', sw: 'Jumanne' },
  'Mercredi': { ln: 'Mokolo ya 3', sw: 'Jumatano' },
  'Jeudi': { ln: 'Mokolo ya 4', sw: 'Alhamisi' },
  'Vendredi': { ln: 'Mokolo ya 5', sw: 'Ijumaa' },
  'Samedi': { ln: 'Mposo', sw: 'Jumamosi' },
  '{n}, chaque semaine': { ln: '{n}, poso na poso', sw: '{n}, kila wiki' },
  '{n}, toutes les 2 semaines': { ln: '{n}, baposo mibale na mibale', sw: '{n}, kila wiki 2' },
  'Agriculture': { ln: 'Bilanga', sw: 'Kilimo' },
  'Petit commerce': { ln: 'Mombongo moke', sw: 'Biashara ndogo' },
  'Élevage': { ln: 'Kobokola banyama', sw: 'Ufugaji' },
  'Pêche': { ln: 'Koloba mbisi', sw: 'Uvuvi' },
  'Artisanat': { ln: 'Misala ya maboko', sw: 'Ufundi' },
  'Couture': { ln: 'Kotonga bilamba', sw: 'Ushonaji' },
  'Transport (moto, vélo)': { ln: 'Transporte (moto, velo)', sw: 'Usafiri (pikipiki, baiskeli)' },
  'Enseignement': { ln: 'Koteya', sw: 'Ualimu' },
  'Santé': { ln: 'Bokolongono', sw: 'Afya' },
  'Travaux ménagers': { ln: 'Misala ya ndako', sw: 'Kazi za nyumbani' },
  'Élève ou étudiant': { ln: 'Moyekoli', sw: 'Mwanafunzi' },
  'Salarié': { ln: 'Mosali ya lifuti', sw: 'Mwajiriwa' },
  'Sans activité': { ln: 'Mosala te', sw: 'Bila kazi' },
  'Autre': { ln: 'Mosusu', sw: 'Nyingine' },
  '{n} ans': { ln: 'mibu {n}', sw: 'miaka {n}' },
  '{n} à envoyer': { ln: '{n} ya kotinda', sw: '{n} za kutuma' },
  'Écouter mon carnet': { ln: 'Koyoka buku na ngai', sw: 'Sikiliza daftari langu' },
  'Écouter': { ln: 'Koyoka', sw: 'Sikiliza' },
  'Pourquoi épargner ? Un toit, une année d\'école, une chèvre, une machine. Écrivez-le ici : Akiba dira à chaque réunion où vous en êtes et quand vous y serez.': { ln: 'Mpo na nini kobomba ? Nsamba, mobu ya kelasi, ntaba, masini. Koma yango awa : Akiba ekoloba na likita nyonso esika ozali mpe ntango okokoma.', sw: 'Kwa nini kuweka akiba ? Paa, mwaka wa shule, mbuzi, mashine. Andika hapa : Akiba itasema kila mkutano ulipo na lini utafika.' },
  'Soki okobi bongo': { ln: 'Soki okobi bongo', sw: 'Kwa mwendo huu' },
  'Langue': { ln: 'Monoko', sw: 'Lugha', kg: 'Ndinga', lua: 'Muakulu' }
};
const TR_KEYS = Object.keys(TR);

/* Les jours et les mois ne passent pas par le dictionnaire : une date n'est pas une phrase, et
   « dim. 25 oct. » aurait demandé une entrée par jour et par mois de l'année — des centaines
   d'entrées pour une seule idée. On les nomme donc une fois par langue, et fdate() va les chercher.

   On ne met ici que ce dont on est sûr. Les jours de la semaine en kiswahili et en lingála sont
   d'usage courant et vérifiables ; les noms de mois en lingála sont ceux du français, comme on les
   dit à Kinshasa. Pour le kikongo ya leta et le tshiluba, on laisse la date en français plutôt que
   d'inventer : une date en français se lit encore, un mot inventé ne se lit pas du tout, et il
   ferait autorité dans un carnet de comptes. Un locuteur peut compléter CALENDRIER plus tard. */
const MOIS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const CALENDRIER = {
  /* mposo = samedi, eyenga = dimanche ; les autres jours se disent couramment par leur rang */
  ln: { j: ['eyenga', 'mokolo ya 1', 'mokolo ya 2', 'mokolo ya 3', 'mokolo ya 4', 'mokolo ya 5', 'mposo'], m: MOIS_FR },
  sw: { j: ['jumapili', 'jumatatu', 'jumanne', 'jumatano', 'alhamisi', 'ijumaa', 'jumamosi'],
    m: ['jan.', 'feb.', 'mac.', 'apr.', 'mei', 'jun.', 'jul.', 'ago.', 'sep.', 'okt.', 'nov.', 'des.'] },
};
/* la date dans la langue choisie ; en français partout où l'on n'est pas sûr */
function fdateL(ts, lang) {
  const l = lang || (typeof I18N !== 'undefined' ? (I18N._mem || I18N.cur()) : 'fr');
  const c = CALENDRIER[l];
  if (!c) return new Date(ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const d = new Date(ts);
  return c.j[d.getDay()] + ' ' + d.getDate() + ' ' + (c.m || MOIS_FR)[d.getMonth()];
}

/* Une phrase d'interface qui porte un chiffre, une date ou un nom reste la même phrase.
   « Fin du cycle dans 24 jours » et « ... dans 3 jours » ne demandent qu'une traduction, écrite une
   fois avec {n} à la place du nombre. Sans cette réduction, le traducteur voyait mille deux cents
   phrases presque identiques et n'en venait jamais à bout ; avec elle, il en reste quelques centaines.
   Le même {n} sert ensuite à remettre le nombre à sa place au moment de l'affichage. */
const I18N_MOIS = 'janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc';
const I18N_JOURS = 'lun|mar|mer|jeu|ven|sam|dim';
const echappe = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* la date déjà traduite est une date, pas une phrase : sans cela « eyenga 25 oct. » serait
   proposé à la traduction alors qu'il vient d'être traduit */
function motsDate() {
  const l = typeof I18N !== 'undefined' ? (I18N._mem || I18N.cur()) : 'fr';
  const c = CALENDRIER[l];
  const mots = [I18N_JOURS, I18N_MOIS];
  if (c) { mots.push(c.j.map(echappe).join('|')); mots.push((c.m || MOIS_FR).map(x => echappe(x.replace(/\.$/, ''))).join('|')); }
  return { j: mots[0] + '|' + (mots[2] || mots[0]), m: mots[1] + '|' + (mots[3] || mots[1]) };
}
function motifDe(t) {
  const d = motsDate();
  /* un nom de membre ou de village tient la même place qu'un nombre : « Épargne · Kavira Kombi »
     et « Épargne · Riziki Siviri » sont la même ligne, et une seule traduction les couvre */
  if (estPhrase._noms) estPhrase._noms.forEach(n => { if (n.length > 3 && t.indexOf(n) >= 0) t = t.split(n).join('{n}'); });
  return t
    /* une empreinte de journal (« e4b2ea7ca3 ») est une donnée, pas un mot : sans cela chaque reçu
       créait sa propre phrase à traduire, et il y en a une par réunion et par membre.
       Avant le remplacement des nombres, sinon l'empreinte arrive déjà en morceaux. */
    .replace(/\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{5,}\b/g, '{n}')
    .replace(new RegExp('(?:' + d.j + ')\\.? \\d{1,2} (?:' + d.m + ')\\.?(?: \\d{4})?', 'gi'), '{n}')
    .replace(new RegExp('\\d{1,2} (?:' + d.m + ')\\.?(?: \\d{4})?', 'gi'), '{n}')
    /* le nombre seul, sans manger l'espace qui suit : « 5 parts » doit rester « {n} parts » */
    .replace(/\d+(?:[  \u202f.,]\d+)*(?:\s?(?:FC|%))?/g, '{n}')
    .replace(/\{n\}(?:\s*\{n\})+/g, '{n}')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Un nom de membre, un montant, une date ou des initiales ne se traduisent pas : les compter
   ferait mentir la mesure dans l'autre sens, en affichant 20 % là où l'interface est traduite. */
function estPhrase(t) {
  if (!t || t.length < 4) return false;
  if (/^[\s\d.,:%°·€+\-–—/()\[\]«»"'’…]*$/.test(t)) return false;
  if (/^\d/.test(t)) return false;
  if (!/[a-zà-ÿ]{3}/i.test(t)) return false;              /* initiales, sigles */
  if (typeof K !== 'undefined' && K.data) {
    if (!estPhrase._noms || estPhrase._v !== K.data.avecs.length) {
      const n = new Set();
      const a = v => { if (typeof v === 'string' && v.trim().length > 2) n.add(v.trim()); };
      K.data.avecs.forEach(x => { a(x.name); a(x.village); a(x.territoire); a(x.province); x.members.forEach(m => { a(m.name); a(m.address); }); });
      (K.data.users || []).forEach(u => { a(u.name); a(u.zone); });
      (K.data.orgs || []).forEach(o => { a(o.name); a(o.ville); });
      estPhrase._noms = n; estPhrase._v = K.data.avecs.length;
    }
    if (estPhrase._noms.has(t)) return false;
    /* « Kirumba · Lubero » : chaque morceau est un nom de lieu, l'ensemble n'est pas une phrase */
    const morceaux = t.split(/\s*[·,]\s*/).filter(Boolean);
    if (morceaux.length > 1 && morceaux.every(m => estPhrase._noms.has(m))) return false;
  }
  return true;
}

const I18N = {
  cur() { try { return localStorage.getItem('kitabu.lang') || 'fr'; } catch (e) { return 'fr'; } },
  set(l) { try { localStorage.setItem('kitabu.lang', l); } catch (e) { /* choix gardé pour la session */ } this._mem = l; this._c = null; },
  langs() { return LANGS.concat((K.data.langs || []).filter(x => !LANGS.some(l => l.id === x.id))); },
  name(id = this.cur()) { return (this.langs().find(l => l.id === id) || LANGS[0]).name; },
  words(l) {
    const out = {};
    TR_KEYS.forEach(k => { if (TR[k][l]) out[k] = TR[k][l]; });
    Object.entries((K.data.i18n || {})[l] || {}).forEach(([k, v]) => { if (v) out[k] = v; });
    return out;
  },
  /* Deux mesures, et il faut les deux.
     « couverture du dictionnaire » dit quelle part des phrases prévues est écrite : utile à qui traduit.
     « couverture réelle » dit quelle part de ce que l'écran a affiché était traduite : c'est ce que
     l'utilisateur constate. L'ancienne mesure annonçait « Complète » pour le lingála alors que la
     plupart des écrans restaient en français — elle comptait un dictionnaire de 133 phrases dans une
     application qui en affiche plus de mille. Une application qui ment sur sa propre langue est pire
     qu'une application qui dit « 40 % », parce qu'elle décourage de corriger ce qui manque. */
  coverage(l) { if (l === 'fr') return 1; const w = this.words(l); return TR_KEYS.filter(k => w[k]).length / TR_KEYS.length; },
  vu: {},          /* par langue : { total, traduit } de tout ce qui est passé à l'écran */
  manquant: {},    /* par langue : { phrase: nombre de fois vue } — la liste de travail du traducteur */
  reelle(l) {
    if (l === 'fr') return 1;
    const v = (K.data.i18nVu || {})[l];
    return v && v.total ? v.traduit / v.total : null;   /* null = on n'a pas encore assez vu pour le dire */
  },
  /* les phrases rencontrées et non traduites, les plus fréquentes d'abord */
  aTraduire(l, max = 400) {
    const m = (K.data.i18nManque || {})[l] || {};
    return Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].length - b[0].length).slice(0, max).map(([k, n]) => ({ k, n }));
  },
  dict() {
    const l = this._mem || this.cur();
    if (l === 'fr') return null;
    const v = K.data.i18nV || 0;
    if (this._c && this._c.l === l && this._c.v === v) return this._c;
    const d = this.words(l), pats = [];
    Object.keys(d).forEach(k => {
      if (!k.includes('{')) return;
      const names = [];
      const src = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\w+)\\\}/g, (_, n) => { names.push(n); return '(.+?)'; });
      pats.push({ re: new RegExp('^' + src + '$'), names, v: d[k] });
    });
    this._c = { l, v, d, pats };
    return this._c;
  },
  t(s) {
    const c = this.dict();
    if (!c || typeof s !== 'string') return s;
    const k = s.trim();
    if (!k) return s;
    let out = c.d[k];
    if (!out) for (const p of c.pats) { const m = k.match(p.re); if (m) { out = p.v.replace(/\{(\w+)\}/g, (_, n) => m[p.names.indexOf(n) + 1] || ''); break; } }
    return out ? s.replace(k, out) : s;
  },
  /* On accumule en mémoire et on n'enregistre qu'une fois de temps en temps : un rendu a lieu
     à chaque touche du clavier, et écrire le fichier à chaque fois userait le téléphone pour rien. */
  noter(l, total, traduit, manque) {
    if (!total) return;
    K.data.i18nVu = K.data.i18nVu || {};
    K.data.i18nManque = K.data.i18nManque || {};
    const v = K.data.i18nVu[l] = K.data.i18nVu[l] || { total: 0, traduit: 0 };
    v.total += total; v.traduit += traduit;
    const m = K.data.i18nManque[l] = K.data.i18nManque[l] || {};
    Object.entries(manque).forEach(([k, n]) => { m[k] = (m[k] || 0) + n; });
    /* la mesure ne doit pas gonfler sans fin : on la ramène périodiquement à son échelle */
    if (v.total > 20000) { v.total = Math.round(v.total / 4); v.traduit = Math.round(v.traduit / 4); }
    const t = Date.now();
    if (!this._ecrit || t - this._ecrit > 60000) { this._ecrit = t; DB.save(); }
  },
  apply(root) {
    const l = this._mem || this.cur();
    document.documentElement.lang = l;
    if (l === 'fr') return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    let total = 0, traduit = 0;
    const manque = {};
    nodes.forEach(n => {
      const p = n.parentElement;
      if (!p || p.closest('textarea,script,style,.no-tr')) return;
      const t = this.t(n.nodeValue);
      if (t !== n.nodeValue) { n.nodeValue = t; total++; traduit++; return; }
      /* resté en français : est-ce une phrase d'interface, ou un nom, un chiffre, une date ? */
      const brut = n.nodeValue.trim().replace(/\s+/g, ' ');
      if (!estPhrase(brut)) return;
      total++;
      const m = motifDe(brut);
      if (!estPhrase(m.replace(/\{n\}/g, '').trim())) return;   /* il ne restait qu'un nombre ou une date */
      manque[m] = (manque[m] || 0) + 1;
    });
    this.noter(l, total, traduit, manque);
  }
};

/* ---------- choix de la langue ---------- */
/* Fond clair ou sombre : le même écran se lit mieux au soleil en clair, et le soir en sombre. */
ACT.themeSheet = () => {
  const cur = themeChoisi();
  const ligne = (id, titre, sous) => `<button class="li" data-act="setTheme" data-v="${id}"><span class="xl-ic">${ic(id === 'light' ? 'eye' : id === 'dark' ? 'cloud' : 'settings')}</span>
    <span class="grow"><b>${titre}</b><span class="small muted">${sous}</span></span>${cur === id ? `<span class="chip brand">Choisi</span>` : ic('chev')}</button>`;
  App.openSheet(`<h2>Apparence</h2><p class="muted">Le fond clair se lit mieux en plein soleil ; le fond sombre fatigue moins les yeux le soir et économise un peu de batterie.</p>
    <div class="list">
      ${ligne('dark', 'Fond sombre', 'Toujours sombre · choix par défaut d\x27Akiba')}
      ${ligne('light', 'Fond clair', 'Toujours clair, quel que soit le téléphone')}
      ${ligne('auto', 'Comme le téléphone', 'Suit le réglage d\'Android ou d\'iPhone')}
    </div>
    <button class="btn ghost block" data-act="closeSheet">Fermer</button>`);
};
ACT.setTheme = p => {
  try { localStorage.setItem(THEME_STORE, p.v); } catch (e) { /* stockage indisponible : le choix vaut pour cette session */ }
  appliquerTheme(p.v);
  App.sheet = null; render(); App.toast(THEMES[p.v]);
};

ACT.langSheet = () => {
  const cur = I18N.cur();
  App.openSheet(`<h2>Langue · Monoko · Lugha</h2>
    <div class="list no-tr">${I18N.langs().map(l => {
      /* ce que l'utilisateur verra vraiment, pas la part d'un dictionnaire de référence */
      const r = I18N.reelle(l.id), c = I18N.coverage(l.id);
      const chip = l.id === 'fr' ? '<span class="chip good">Complète</span>'
        : r === null ? (c > 0 ? '<span class="chip warn">Partielle</span>' : '<span class="chip">À traduire</span>')
          : r >= .95 ? '<span class="chip good">Complète</span>'
            : r >= .5 ? `<span class="chip warn">${pct(r)} traduit</span>`
              : `<span class="chip">${pct(r)} traduit</span>`;
      return `<button class="li" data-act="setLang" data-l="${l.id}" aria-pressed="${l.id === cur}" style="${l.id === cur ? 'background:var(--brand-soft)' : ''}">
        <span class="grow"><b>${esc(l.name)}${l.id === cur ? ' ✓' : ''}</b><span class="small muted">${esc(l.where || '')}</span></span>${chip}</button>`; }).join('')}</div>
    <p class="hint no-tr">Le pourcentage est mesuré sur les écrans que vous avez réellement ouverts : ce qui n'est pas traduit
      s'affiche en français. Les traductions fournies sont des brouillons, à faire relire par des locuteurs de la zone.</p>
    ${canTranslate() ? `<button class="btn ghost block no-tr" data-act="go" data-to="tr.edit" data-lang="${cur === 'fr' ? 'ln' : cur}">${ic('globe')} Traduire ou corriger une langue</button>` : ''}`);
};
ACT.setLang = d => { I18N.set(d.l); App.closeSheet(); App.toast('Langue : ' + I18N.name(d.l)); };

/* ---------- éditeur de traductions (partagé avec toutes les AVEC via la synchronisation) ---------- */
function trBack() {
  const s = K.session;
  if (!s) return 'login';
  return s.kind === 'org' ? 'o.home' : s.kind === 'anim' ? 'n.home' : 'a.more';
}
/* traduire : organisation, animateur ou bureau d'une AVEC (pas les simples membres) */
function canTranslate() {
  const s = K.session;
  if (!s) return K.data.mode !== 'prod';
  if (s.kind === 'avec') { const a = avecById(s.avecId); return !!a && isBureau(memberOf(a, s.memberId)); }
  return true;
}
SCREENS['tr.edit'] = p => {
  if (!canTranslate()) return `<div class="shell">${topbar('Traduire Akiba', '', backBtn(K.session ? homeScreen() : 'login'))}<main class="main"><div class="alert warn"><div><b>Réservé au bureau, à l'animateur et à l'organisation</b></div></div></main></div>`;
  const langs = I18N.langs().filter(l => l.id !== 'fr');
  const lang = langs.some(l => l.id === p.lang) ? p.lang : 'ln';
  const w = I18N.words(lang);
  const missingOnly = p.missing === '1';
  /* Deux sources : les phrases prévues au dictionnaire, et celles que ce téléphone a réellement
     affichées en français. Les secondes d'abord et par fréquence : traduire les vingt phrases vues
     à chaque réunion change davantage la vie du groupe que cent phrases d'un écran jamais ouvert. */
  const vues = I18N.aTraduire(lang).filter(x => !w[x.k]).map(x => x.k);
  const keys = vues.concat(TR_KEYS.filter(k => vues.indexOf(k) < 0)).filter(k => !missingOnly || !w[k]);
  const rang = {}; vues.forEach((k, i) => rang[k] = i);
  return `<div class="shell no-tr">${topbar('Traduire Akiba', `${esc(I18N.name(lang))} · ${pct(I18N.coverage(lang))} traduit`, backBtn(trBack()))}<main class="main">
    <p class="muted">Écrivez chaque phrase dans la langue choisie, comme on la dit au village. Gardez <b>{n}</b> à sa place : c'est un nom ou un numéro. Une case vide reste en français.</p>
    <div class="row" style="flex-wrap:wrap;gap:6px">${langs.map(l => `<button class="btn sm ${l.id === lang ? 'brand' : 'ghost'}" data-act="go" data-to="tr.edit" data-lang="${l.id}">${esc(l.name)}</button>`).join('')}
      <button class="btn sm ghost" data-act="addLangSheet">${ic('plus')} Autre langue</button></div>
    <div class="row between"><span class="small muted">${keys.length} phrase${keys.length > 1 ? 's' : ''}</span>
      <button class="btn sm ghost" data-act="go" data-to="tr.edit" data-lang="${lang}" data-missing="${missingOnly ? '0' : '1'}">${missingOnly ? 'Tout voir' : 'Seulement les manquantes'}</button></div>
    ${I18N.reelle(lang) !== null ? `<p class="hint">Sur les écrans ouverts jusqu'ici, ${pct(I18N.reelle(lang))} de ce qui s'affiche est en ${esc(I18N.name(lang))}. Les phrases marquées « vue à l'écran » sont celles que votre groupe lit vraiment : commencez par celles-là.</p>` : ''}
    <div class="list">${keys.map((k, i) => `<div class="li" style="flex-direction:column;align-items:stretch;gap:6px">
      <label for="tr-${i}" class="small"><b>${esc(k)}</b>${rang[k] !== undefined ? ' <span class="chip">vue à l’écran</span>' : ''}</label>
      <input id="tr-${i}" class="input" value="${esc(w[k] || '')}" placeholder="${esc((TR[k] && TR[k].ln) || '')}" autocomplete="off" data-key="${esc(k)}"></div>`).join('') || '<div class="li muted">Tout est traduit.</div>'}</div>
    <div class="sticky-foot" style="bottom:16px"><button class="btn primary block xl" data-act="saveTr" data-lang="${lang}">${ic('check')} Enregistrer les traductions</button></div>
  </main></div>`;
};
ACT.saveTr = d => {
  K.data.i18n = K.data.i18n || {};
  const bag = K.data.i18n[d.lang] = K.data.i18n[d.lang] || {};
  let n = 0;
  document.querySelectorAll('input[data-key]').forEach(inp => {
    const k = inp.dataset.key, v = inp.value.trim();
    if (v && v !== (TR[k] && TR[k][d.lang])) { bag[k] = v; n++; }
    else if (!v) delete bag[k];
  });
  K.data.i18nV = (K.data.i18nV || 0) + 1;
  I18N._c = null;
  DB.save(); render();
  App.toast(`${n} traduction${n > 1 ? 's' : ''} enregistrée${n > 1 ? 's' : ''} pour ${I18N.name(d.lang)}`);
};
ACT.addLangSheet = () => App.openSheet(`<div class="no-tr stack"><h2>Ajouter une langue</h2>
  <div class="field"><label for="alN">Nom de la langue</label><input id="alN" class="input" placeholder="Ex. Budja, Lingombe, Kiyombe"></div>
  <div class="field"><label for="alW">Où la parle-t-on ?</label><input id="alW" class="input" placeholder="Province, territoire"></div>
  <button class="btn primary block xl" data-act="saveLang">Ajouter</button></div>`);
ACT.saveLang = () => {
  const name = document.getElementById('alN').value.trim();
  if (name.length < 2) return App.toast('Écrivez le nom de la langue');
  const id = 'x-' + name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 12);
  K.data.langs = K.data.langs || [];
  if (I18N.langs().some(l => l.id === id)) return App.toast('Cette langue existe déjà');
  K.data.langs.push({ id, name, where: document.getElementById('alW').value.trim() });
  DB.save(); App.go('tr.edit', { lang: id });
};

/* ---------- affichage en direct ---------- */
const demoTag = () => (K.data.mode === 'prod' || !K.data.avecs.length) ? '' : ' · <span class="chip warn">Démonstration</span>';
const liveTag = () => `<span class="live"><i></i>En direct · ${new Date(App.liveAt || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>`;
