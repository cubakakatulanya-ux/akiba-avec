/* Akiba — le guide dans les langues du pays.

   Pourquoi un fichier à part, et pas le dictionnaire de phrases : le guide est de la prose, pas
   des étiquettes. Ses paragraphes sont coupés en morceaux par les mots en gras — « Akiba est une »,
   « infrastructure numérique hors ligne », « , conçue autour… » — ce qui donnait 768 fragments
   illisibles à traduire et intraduisibles un par un, puisqu'une langue ne met pas les mots dans le
   même ordre que le français. On traduit donc une section entière d'un coup, comme on traduirait
   une page : le traducteur lit un texte, en écrit un autre, et garde la liberté de la tournure.

   Ce qui est traduit, et ce qui ne l'est pas :
   — les sections dont le groupe a besoin — la réunion, l'épargne, les crédits, les reçus, la caisse
     sociale, les amendes, les codes perdus, le partage — sont écrites en kiswahili et en lingála ;
   — les sections de métier — l'animateur, l'organisation, le dossier IMF, la validation d'Ubora —
     restent en français : elles s'adressent à des salariés qui travaillent en français, et les
     traduire aurait coûté le temps qu'il fallait aux sections du village ;
   — ce qui n'est pas traduit s'affiche en français, avec une ligne qui le dit, au lieu de faire
     croire que la langue est complète.

   Tout ceci est un brouillon : à faire relire par des locuteurs de la zone avant de s'y fier. */
'use strict';

const GUIDE_TR = {

  /* ===================== KISWAHILI ===================== */
  sw: {
    bref: {
      t: 'Akiba kwa kifupi',
      b: `
      <p>Akiba ni <b>daftari la kikundi ndani ya simu</b>. Inachukua nafasi ya madaftari ya karatasi — sanduku, daftari la kila mwanachama, daftari la mikopo, kumbukumbu za mkutano — na <b>inafanya kazi bila mtandao</b>.</p>
      <ul>
        <li><b>Kila faranga inaandikwa pale pale inapotembea</b>, ndani ya daftari lililofungwa kwa muhuri : akibadilisha hata tarakimu moja, inaonekana mara moja.</li>
        <li><b>Simu ndiyo inayohesabu.</b> Hakuna kosa la hesabu, hakuna mabishano ya hesabu mwishoni mwa mkutano.</li>
        <li><b>Mwezeshaji na shirika wanapata takwimu kwa mbali</b> na wanafika pale panapohitajika tu.</li>
        <li><b>Historia ya kikundi inathibitika</b> : hiyo ndiyo inayofungua mazungumzo na taasisi ya mikopo (IMF).</li>
      </ul>
      <h4>Nani anatumia Akiba ?</h4>
      <ul>
        <li><b>Uongozi wa kikundi</b> (mwenyekiti, katibu, mweka hazina) unaendesha mkutano na kuandika pesa.</li>
        <li><b>Washika funguo</b> watatu wanathibitisha hesabu ya sanduku kwa namba zao za siri.</li>
        <li><b>Kila mwanachama</b> anaweza kufungua daftari lake : akiba yake, mikopo yake, faini zake.</li>
        <li><b>Mwezeshaji</b> anafuatilia vikundi vingi na kuandika ziara zake. <b>Habadilishi chochote.</b></li>
        <li><b>Shirika</b> linaona vikundi vyote linavyofuatilia.</li>
      </ul>
      <p>Akiba imetengenezwa na <b>Entreprise Sociale Ubora</b>, ambayo pia inatoa msaada : simu au WhatsApp <b>0998 275 144</b>, barua pepe <b>contact@uborahub.com</b>.</p>
      <div class="tip">Kikundi <b>huru</b> (bila shirika) kinatumia sehemu ya kikundi tu. Hakuna mtu mwingine anayeona taarifa zake.</div>`,
    },
    debut: {
      t: 'Kuunda AVEC na kuanza',
      b: `
      <p>Gusa <b>Créer une AVEC</b> kwenye ukurasa wa mwanzo. Mara ya kwanza, Akiba inaomba <b>namba ya uthibitisho</b> inayotolewa na Entreprise Sociale Ubora. Kila kitu kinatayarishwa katika <b>hatua 5</b>, na mkutano mkuu ukiwa pamoja. Panga saa moja hivi, na usiikatishe.</p>
      <ol>
        <li><b>Kikundi</b> : jina, kisha mahali — mkoa, wilaya au mji, sekta, kijiji. Kisha <b>siku ya mkutano</b> na mwendo (kila wiki au kila wiki mbili). Siku hii ndiyo itakayotumika pia kwa tarehe za kulipa mikopo.</li>
        <li><b>Alama ya kikundi</b> : chagua alama na rangi ambayo kila mtu anaitambua, hata asiyejua kusoma. Itaonekana kwenye ukurasa wa mwanzo wa simu na kwenye kadi za wanachama.</li>
        <li><b>Mahali (GPS)</b> — si lazima : bonyeza « Chukua mahali sasa » mkiwa <b>nje, wazi kwa anga</b>, pale kikundi kinapokutana. <b>Mtandao hauhitajiki</b> : simu inasoma satelaiti. Mahali panaandikwa ndani ya daftari lililofungwa.</li>
        <li><b>Kanuni</b> : thamani ya hisa, hisa kwa kila mkutano, mfuko wa kusaidiana, muda wa mzunguko, riba, mkopo wa juu kabisa, muda wa mikopo, faini. Mfano wenye namba unaonyesha kanuni zinatoa nini.</li>
        <li><b>Wanachama</b> : fomu moja kwa kila mtu. <b>Lazima</b> : jina na jinsia. <b>Si lazima</b> : picha, tarehe ya kuzaliwa au umri, simu, kazi, anwani. Kikundi kinakubali watu <b>15 hadi 35</b>.</li>
        <li><b>Uongozi</b> : mwenyekiti, katibu, mweka hazina, wahesabu wawili na <b>washika funguo watatu</b>. Mweka hazina anashika sanduku, kwa hiyo <b>hawezi kushika ufunguo</b>.</li>
        <li><b>Kuanza</b> : <b>kikundi kipya</b> (sanduku tupu) au <b>kikundi kilichokuwapo</b> (nakili daftari lenu la karatasi).</li>
      </ol>
      <h4>Kikundi kilichokuwa na daftari la karatasi</h4>
      <p>Chagua « kikundi kilichokuwapo » na nakili daftari : hisa za kila mwanachama, kilichobaki kwenye kila mkopo, mfuko wa kusaidiana, kisha pesa zilizohesabiwa ndani ya sanduku. Akiba inaandika yote katika kikao « Marudio ya daftari », kilichofungwa kwa muhuri. Kama pesa hazilingani na daftari, tofauti inaonyeshwa.</p>
      <div class="tip">Mwishoni, Akiba inaonyesha <b>namba ya siri tofauti kwa kila mwanachama, mara moja tu</b>. Ziandike kwenye vikaratasi vidogo na uwape mkononi, siyo kwa WhatsApp.</div>`,
    },
    reunion: {
      t: 'Mkutano, hatua kwa hatua',
      b: `
      <p>Mkutano unafuata <b>hatua nane</b>, katika utaratibu ule ule wa daftari la karatasi. Akiba inaongoza : hatua moja kwa wakati, na huwezi kurukaruka. Sauti inaweza kusoma kila hatua kwa sauti kubwa.</p>
      <ol>
        <li><b>Kufungua</b> : washika funguo watatu wanafungua sanduku mbele ya watu wote. Wahesabu wanahesabu pesa <b>kwa sauti</b>, na idadi inaandikwa. Kama haikubaliani na kilichotarajiwa, tofauti inaandikwa pamoja na maelezo.</li>
        <li><b>Mahudhurio</b> : gusa jina la kila asiyekuwepo. Faini ya kutohudhuria inawekwa yenyewe.</li>
        <li><b>Mfuko wa kusaidiana</b> : kila mtu anatoa kiasi kilichopigiwa kura.</li>
        <li><b>Akiba</b> : kila mwanachama ananunua hisa zake, kutoka moja hadi kiwango kilichopigiwa kura. Mwanachama asiyeweza leo ananunua sifuri — si kosa.</li>
        <li><b>Marejesho</b> : kila mwenye mkopo analipa anavyoweza. Akiba inahesabu riba yenyewe.</li>
        <li><b>Mikopo mipya</b> : mkutano unakubali au unakataa. Akiba inakataa ombi linalopita kiwango kilichopigiwa kura.</li>
        <li><b>Faini</b> : kuchelewa, kelele, simu — kama kanuni zinasema.</li>
        <li><b>Kufunga</b> : wahesabu wanahesabu tena mbele ya watu wote. Washika funguo watatu wanaweka namba zao za siri. Mkutano unafungwa kwa muhuri.</li>
      </ol>
      <div class="tip">Mshika ufunguo <b>hayupo</b> ? Gusa jina lake, kisha « Hayupo », na mjumbe mwingine wa uongozi anaweka namba yake badala yake. Yote yanaandikwa : nani alikosekana, nani alichukua nafasi yake.</div>
      <p>Baada ya kufunga, Akiba inatoa <b>risiti ya kila mwanachama</b> na <b>daftari la mkutano</b> la kuchapisha. Chapisha daftari kila mkutano na ulihifadhi : kama simu ikipotea, karatasi hizo ndizo kumbukumbu yenu.</p>`,
    },
    epargne: {
      t: 'Akiba na hisa',
      b: `
      <p>Kila mkutano, mwanachama ananunua <b>hisa</b> : kutoka moja hadi kiwango kilichopigiwa kura (mara nyingi 5). Hisa moja ina bei moja kwa wote, iliyopigiwa kura mwanzoni mwa mzunguko.</p>
      <p>Kununua hisa nyingi zaidi maana yake : kuweka akiba zaidi, kukopa zaidi, na kupata <b>faida kubwa zaidi</b> wakati wa mgawanyo.</p>
      <p>Mwanachama asiyeweza kununua leo anaandikwa <b>hisa sifuri</b>. Hakuna faini kwa hilo : kikundi kinaandika ukweli, hakihukumu.</p>
      <div class="tip">Katika daftari lake, kila mwanachama anaona hisa zake, akiba yake, na <b>thamani yake kama mkigawana leo</b>. Anaweza pia kuandika <b>ndoto</b> yake — paa, mwaka wa shule, mbuzi — na Akiba itamwambia kila mkutano atafika lini kwa mwendo wake halisi.</div>`,
    },
    credit: {
      t: 'Mikopo',
      b: `
      <p>Mwanachama anaomba mkopo mbele ya mkutano. Akiba inaonyesha <b>anachoweza kukopa</b> : akiba yake ikizidishwa na kiwango kilichopigiwa kura (mara nyingi mara 3), na kamwe zaidi ya pesa zilizo sandukuni.</p>
      <ul>
        <li><b>Kusudi la mkopo</b> linaandikwa : biashara, kilimo, shule, afya, ujenzi. Hivi ndivyo kikundi kinajua pesa zake zinafanya nini.</li>
        <li><b>Riba</b> inahesabiwa na simu, kwa mwezi, kwa kiwango kilichopigiwa kura.</li>
        <li><b>Tarehe ya kulipa</b> haiwezi kuanguka siku ambayo kikundi hakikutani : Akiba inaisogeza mbele hadi mkutano unaofuata.</li>
        <li>Marejesho yanakubaliwa <b>kidogo kidogo</b> : mwanachama analipa anachoweza kila mkutano.</li>
      </ul>
      <p>Mkopo uliochelewa unaonekana mara moja kwenye ukurasa wa mwanzo wa kikundi, na mwezeshaji anaona onyo lake.</p>
      <div class="tip">Mweka hazina hawezi kujipa mkopo peke yake : kila mkopo unathibitishwa na mjumbe wa pili wa uongozi.</div>`,
    },
    recus: {
      t: 'Risiti za wanachama',
      b: `
      <p>Baada ya kufunga mkutano, Akiba inatoa <b>risiti moja kwa kila mwanachama aliyehudhuria</b> : akiba ya siku, mkopo, faini, na muhuri wa mkutano.</p>
      <ul>
        <li><b>Kuchapisha</b> kwenye mashine ya POS, au kwa printa ya Bluetooth (RawBT).</li>
        <li><b>Kushiriki</b> maandishi kwa WhatsApp, kama mwanachama ana simu.</li>
        <li><b>Risiti fupi</b> : mistari kumi badala ya thelathini — karatasi kidogo, bei ndogo. Habari muhimu na muhuri vinabaki.</li>
      </ul>
      <p>Kila risiti ina <b>namba ya uthibitisho</b>. Kama mwanachama akitia shaka risiti yake, gusa « Kagua risiti » : Akiba inahesabu tena bila mtandao na inasema daftari linasemaje.</p>
      <h4>Daftari la mkutano</h4>
      <p>Mbali na risiti, Akiba inachapisha <b>daftari la mkutano mzima</b> : maandiko yote, jumla, ufunguzi na ufungaji, tofauti ya sanduku, na muhuri. <b>Chapisha kila mkutano</b> na uweke karatasi kwenye faili, kwa utaratibu. Kama simu ikipotea au ikiibiwa, karatasi hizo ndizo zinazoruhusu kuanza tena.</p>`,
    },
    cartes: {
      t: 'Kadi za wanachama',
      b: `
      <p>Akiba inachapisha <b>kadi ya kila mwanachama</b>, kwa ukubwa wa kadi ya benki : jina, nafasi yake, namba yake, tarehe aliyoingia, alama ya kikundi, picha yake kama ameitoa, na QR code.</p>
      <ul>
        <li><b>Karatasi ya A4</b> ya kawaida : kadi kumi kwa ukurasa. Chapisha, kisha kata kwa kufuata mistari.</li>
        <li><b>Mashine ya POS</b> : kadi moja moja kwenye ukanda wa 58 mm.</li>
      </ul>
      <p><b>Hakuna namba ya siri, hakuna kiasi</b> kwenye kadi : ikipotea, ikiazimwa au ikipigwa picha, hakuna hatari.</p>
      <div class="tip">« Kagua kadi » inasoma QR na kuhesabu tena <b>bila mtandao</b>, kwenye simu yoyote ya kikundi. Kadi iliyonakiliwa, au iliyotoka kikundi kingine, inakataliwa.</div>`,
    },
    social: {
      t: 'Mfuko wa kusaidiana',
      b: `
      <p>Kila mkutano, kila mwanachama anatoa kiasi kidogo kilekile kwenye <b>mfuko wa kusaidiana</b>. Mfuko huu <b>si akiba</b> : haugawanywi mwisho wa mzunguko, unabaki kwa kikundi kwa mzunguko unaofuata.</p>
      <p>Unatumika kusaidia mwanachama kwenye shida : msiba, ugonjwa, ajali, kuzaliwa kwa mtoto. Msaada unaamuliwa na mkutano, na <b>unaandikwa pamoja na sababu yake</b> : kikundi kinajua kila wakati pesa za mfuko ziko wapi.</p>`,
    },
    amendes: {
      t: 'Faini',
      b: `
      <p>Faini zinapigiwa kura na mkutano mwanzoni mwa mzunguko, na hazibadiliki katikati ya mzunguko. Mara nyingi : <b>kutohudhuria</b>, <b>kuchelewa</b>, kelele, simu inayolia.</p>
      <p>Faini ya kutohudhuria inawekwa yenyewe wakati wa mahudhurio. Faini nyingine zinaongezwa kwa mkono, hatua ya 7.</p>
      <p>Faini isiyolipwa leo inabaki <b>inadaiwa</b> : inaonekana kwenye daftari la mwanachama, na inatolewa kwenye fungu lake wakati wa mgawanyo.</p>
      <h4>Kuchelewa au kutohudhuria kwa sababu</h4>
      <p>Msiba, ugonjwa, kuzaa, njia iliyokatika : mkutano unaweza kuamua kuwa hakuna faini. Kwenye hatua ya <b>mahudhurio</b>, gusa <b>« Toa sababu »</b> chini ya jina la mtu, chagua sababu au iandike, na faini <b>haitapendekezwa</b> tena kwenye hatua ya 7.</p>
      <p>Sababu inaandikwa kwenye daftari lililofungwa, inachapishwa kwenye daftari la mkutano, na inahesabiwa peke yake kwenye taarifa ya shirika : kikundi kilichozika wanachama wawili kisionekane kama kikundi kizembe.</p>
      <div class="tip">Sababu si upendeleo wa uongozi : mkutano ndio unaoamua, kwa sauti. Uongozi unaweza kurudisha faini wakati wowote, na Akiba inahifadhi nani alitoa sababu gani.</div>`,
    },
    perdu: {
      t: 'Namba ya siri imepotea',
      b: `
      <p>Mwanachama amesahau namba yake ya siri ? Kwenye ukurasa wa mwanzo, gusa kitufe <b>AVEC</b>, kisha chini <b>« Nimesahau namba yangu ya siri »</b>. Njia tatu :</p>
      <ol>
        <li><b>Wajumbe wawili wa uongozi</b> wanaweka namba zao : ndiyo njia ya kawaida, na inatosha.</li>
        <li><b>Kadi ya dharura</b> : namba sita za matumizi ya mara moja, zilizochapishwa wakati wa kuunda kikundi.</li>
        <li><b>Simu kwa mwezeshaji</b>, kama kikundi kinafuatiliwa.</li>
      </ol>
      <p>Mwanachama kisha anachagua namba mpya, <b>ambayo haionyeshwi kamwe</b> kwenye skrini. Yote yanaandikwa kwenye daftari la usalama.</p>
      <div class="tip">Kadi ya dharura inahifadhiwa <b>kwenye karatasi, ndani ya sanduku lililofungwa</b> — kamwe siyo ndani ya simu.</div>`,
    },
    securite: {
      t: 'Usalama na kinga dhidi ya udanganyifu',
      b: `
      <p>Kila andiko ndani ya Akiba linabeba <b>alama ya andiko lililotangulia</b>. Kubadilisha tarakimu moja kunavunja mnyororo, na Akiba inaonyesha mara moja mahali palipovunjika. Hakuna anayeweza kufuta au kubadilisha kimyakimya — wala uongozi, wala mwezeshaji, wala sisi.</p>
      <ul>
        <li><b>Sanduku linahesabiwa mara mbili kwa mkutano</b>, mwanzo na mwisho, mbele ya watu wote.</li>
        <li><b>Washika funguo watatu</b> wanathibitisha kufunga kwa namba zao.</li>
        <li><b>Mweka hazina hawezi kushika ufunguo</b> : anayeshika pesa si anayefungua sanduku.</li>
        <li><b>Daftari la usalama</b> linaandika kila jambo muhimu : namba iliyobadilishwa, nafasi iliyobadilishwa, ufunguo uliokabidhiwa.</li>
      </ul>
      <p>Mwezeshaji anaona takwimu lakini <b>habadilishi chochote</b> : anaangalia, haandiki.</p>`,
    },
    cles: {
      t: 'Mshika ufunguo hayupo, uongozi unabadilika',
      b: `
      <p><b>Mshika ufunguo hayupo leo ?</b> Wakati wa kufunga, gusa jina lake kisha « Hayupo ». Mjumbe mwingine wa uongozi anaweka namba yake badala yake. Mkutano unafungwa kawaida, na daftari linaandika nani alikosekana na nani alichukua nafasi yake.</p>
      <p><b>Uongozi unabadilika katikati ya mzunguko ?</b> Inawezekana : uchaguzi mpya, kujiuzulu, kuondoka, ugonjwa au kifo. Nenda <b>Zaidi › Uongozi na washika funguo</b>. Mabadiliko yanathibitishwa na mjumbe wa pili wa uongozi wa sasa, na yanaandikwa : nani amepoteza nafasi, nani ameichukua, nani amethibitisha.</p>
      <div class="tip">Badilisha nafasi <b>baada ya kufunga mkutano</b>, siyo katikati : funguo zinatumika kufunga sanduku.</div>`,
    },
    membres: {
      t: 'Kushughulikia wanachama',
      b: `
      <p><b>Mwanachama mpya</b> katikati ya mzunguko : <b>Wanachama › Ongeza</b>. Ananunua hisa kuanzia mkutano wake wa kwanza. Wakati wa mgawanyo atapata faida ya <b>muda alioutumia tu</b> ndani ya kikundi : asiyekuwapo mwanzoni hachukui faida iliyopatikana kabla hajafika.</p>
      <p><b>Mwanachama anaondoka</b> : gusa jina lake, kisha « Kuondoka kwenye kikundi ». Akiba inarudisha akiba yake yote na kufunga daftari lake. Faida iliyopatikana kwa pesa zake inabaki kwa kikundi.</p>
      <p><b>Taarifa zinabadilika</b> (simu, kazi, anwani, picha) : gusa jina, kisha « Badilisha taarifa ». Kila mabadiliko yanaandikwa.</p>`,
    },
    partage: {
      t: 'Mwisho wa mzunguko na mgawanyo',
      b: `
      <p>Mwisho wa mzunguko, kikundi kinagawana kila kitu na kinaanza upya. Mgawanyo unafanyika <b>katika kikao chake</b>, siyo mwishoni mwa mkutano wa kawaida.</p>
      <p>Kabla ya kugawana, mambo manne lazima yawe sawa :</p>
      <ol>
        <li><b>Mikopo yote imelipwa</b> — ya ndani na ya nje.</li>
        <li><b>Mkutano wa mwisho umefungwa.</b></li>
        <li><b>Sanduku limehesabiwa</b> na linalingana.</li>
        <li><b>Mkutano mkuu umeamua</b> kugawana.</li>
      </ol>
      <h4>Hesabu inakwenda hivi</h4>
      <p>Kila mwanachama kwanza <b>anachukua akiba yake yote</b>. Kisha <b>faida</b> inagawanywa kulingana na akiba ya kila mmoja <b>na muda alioutumia</b> ndani ya sanduku. Kinachodaiwa (mkopo, faini) kinatolewa kwenye fungu lake. <b>Mfuko wa kusaidiana haugawanywi</b> : unabaki kwa mzunguko ujao.</p>
      <p>Kama kikundi kina <b>mkopo wa nje</b>, mkopeshaji analipwa <b>kabla</b> ya mgawanyo.</p>
      <p>Akiba inaonyesha jedwali kamili kabla ya kufanya chochote, na inaomba <b>namba ya siri ya mwenyekiti</b> ili kuthibitisha. Baada ya hapo, mzunguko unafungwa : hakuna kurudi nyuma.</p>
      <div class="tip">Mgawanyo <b>kabla ya tarehe</b> unawezekana kama mkutano umeamua — kwa mfano kabla ya msimu wa kupanda au mwanzo wa mwaka wa shule. Akiba inaonya kama mzunguko bado una zaidi ya wiki mbili, lakini haikatazi.</div>`,
    },
    cycle: {
      t: 'Kuanza mzunguko mpya',
      b: `
      <p>Baada ya mgawanyo, kikundi kinaweza kuanza mzunguko mpya mara moja. Gusa <b>Anza mzunguko mpya</b>.</p>
      <ul>
        <li>Kanuni zinapigiwa kura <b>upya</b> : thamani ya hisa inaweza kubadilika, pia riba na faini.</li>
        <li>Uongozi unachaguliwa upya, au unabaki ule ule.</li>
        <li>Wanachama wanaweza kuingia au kuondoka.</li>
        <li><b>Mfuko wa kusaidiana unabaki</b> kama ulivyo : hauanzi upya na sifuri.</li>
      </ul>
      <p>Mizunguko ya zamani inabaki ndani ya simu, na daftari lake lililofungwa : <b>Zaidi › Mizunguko iliyopita</b>.</p>`,
    },
    reseau: {
      t: 'Bila mtandao, na usawazishaji',
      b: `
      <p>Akiba <b>haihitaji mtandao</b> kufanya kazi. Mkutano unafanyika, pesa zinaandikwa, risiti zinachapishwa — yote bila mtandao, na yote yanabaki ndani ya simu.</p>
      <p>Mtandao unapopatikana, Akiba inatuma maandiko mapya kwa mwezeshaji yenyewe. Kama kikundi hakina mtandao kabisa, mwezeshaji anachukua taarifa kwa <b>faili</b> wakati wa ziara yake.</p>
      <p>Ukurasa wa mwanzo unaonyesha kila wakati <b>ni maandiko mangapi bado ya kutuma</b>.</p>`,
    },
    installer: {
      t: 'Aikoni, kinga na nakala ya akiba',
      b: `
      <p><b>Weka aikoni kwenye skrini</b> : gusa « Sakinisha Akiba kwenye kifaa hiki ». Baada ya hapo Akiba inafunguka kama programu nyingine yoyote, bila mtandao, na bila kupitia kivinjari.</p>
      <p><b>Hifadhi nakala mara kwa mara</b> : <b>Zaidi › Sakinisha na hifadhi</b>. Faili inahifadhiwa kwenye simu ; ipeleke kwenye kadi ya kumbukumbu au kwa WhatsApp kwa mwezeshaji. Kama simu ikipotea, nakala hii na madaftari yaliyochapishwa ndiyo yanayorudisha kila kitu.</p>
      <div class="tip">Simu moja tu ndiyo inayoendesha mikutano ya kikundi. Kubadilisha simu : <b>Zaidi › Badilisha simu</b>. Simu ya zamani inabaki na nakala lakini haiwezi kufungua mkutano : hakuna madaftari mawili tofauti.</div>`,
    },
    audio: {
      t: 'Kusikiliza badala ya kusoma',
      b: `
      <p>Kila ukurasa muhimu una kitufe <b>« Sikiliza »</b> : simu inasoma kwa sauti kubwa, <b>bila mtandao</b>. Hii ni kwa ajili ya anayesoma kwa shida, na kwa ajili ya kusikilizwa na watu wote wa mkutano.</p>
      <p>Mkutano pia unaongozwa kwa sauti : kila hatua kati ya nane inatangazwa.</p>
      <p>Sauti inategemea simu. Kwenye simu nyingi za Android, pakua sauti ya Kiswahili katika <b>Mipangilio › Lugha › Matamshi</b>, kisha ichague katika <b>Zaidi › Sauti ya kusoma</b>.</p>`,
    },
    mots: {
      t: 'Maneno ya kujua',
      b: `
      <ul>
        <li><b>AVEC</b> — kikundi cha watu 15 hadi 35 wa kijiji kimoja wanaoweka akiba pamoja na kukopeshana.</li>
        <li><b>Hisa</b> — kipimo cha akiba. Kila mkutano, mwanachama ananunua hisa moja hadi tano.</li>
        <li><b>Mzunguko</b> — muda kati ya mwanzo na mgawanyo : mara nyingi miezi 9 au 12.</li>
        <li><b>Mfuko wa kusaidiana</b> — pesa za msaada wakati wa shida. Haugawanywi.</li>
        <li><b>Mgawanyo</b> — mwisho wa mzunguko : kila mtu anachukua akiba yake na fungu lake la faida.</li>
        <li><b>Muhuri</b> — alama inayofunga mkutano na kuzuia kubadilisha chochote baadaye.</li>
        <li><b>IMF</b> — taasisi ya mikopo midogo, inayoweza kukopesha kikundi.</li>
      </ul>`,
    },
  },

  /* ===================== LINGÁLA ===================== */
  ln: {
    bref: {
      t: 'Akiba na mokuse',
      b: `
      <p>Akiba ezali <b>buku ya lisanga kati na telefone</b>. Ezwi esika ya babuku ya papye — sanduku, buku ya moto na moto, buku ya banyongo, mikanda ya likita — mpe <b>esalaka ata rezo ezali te</b>.</p>
      <ul>
        <li><b>Falanga nyonso ekomami na ngonga oyo etamboli</b>, na buku ekangami na elembo : soki moto abongoli ata motango moko, emonani mbala moko.</li>
        <li><b>Telefone nde etangaka.</b> Libunga ya kotanga ezali te, matata ya mituya na nsuka ya likita ezali lisusu te.</li>
        <li><b>Molakisi mpe ebongiseli bazwaka mituya mosika</b>, mpe bakei kaka esika esengeli.</li>
        <li><b>Lisolo ya lisanga ekoki kotalema</b> : yango nde efungolaka lisolo na IMF.</li>
      </ul>
      <h4>Banani basalelaka Akiba ?</h4>
      <ul>
        <li><b>Bakonzi ya lisanga</b> (mokonzi, mokomi, mobombi mbongo) basalaka likita mpe bakomaka mbongo.</li>
        <li><b>Babateli fungola</b> misato bandimaka botangi ya sanduku na bakode na bango.</li>
        <li><b>Moto nyonso ya lisanga</b> akoki kofungola buku na ye : mbongo na ye, banyongo na ye, balamande na ye.</li>
        <li><b>Molakisi</b> alandaka masanga ebele mpe akomaka botali na ye. <b>Abongolaka eloko te.</b></li>
        <li><b>Ebongiseli</b> emonaka masanga nyonso oyo elandaka.</li>
      </ul>
      <p>Akiba esalemi na <b>Entreprise Sociale Ubora</b>, oyo epesaka mpe lisalisi : telefone to WhatsApp <b>0998 275 144</b>, email <b>contact@uborahub.com</b>.</p>
      <div class="tip">Lisanga <b>ya yango moko</b> (ebongiseli ezali te) esalelaka kaka eteni ya lisanga. Moto mosusu amonaka makambo na bango te.</div>`,
    },
    debut: {
      t: 'Kosala lisanga mpe kobanda',
      b: `
      <p>Simba <b>Kosala lisanga</b> na ekran ya ebandeli. Mbala ya liboso, Akiba esengaka <b>kode ya kondima</b> oyo Entreprise Sociale Ubora epesaka. Nyonso ebongisami na <b>bitape 5</b>, na likita mobimba. Bozwa pene na ngonga moko, mpe bokata yango te.</p>
      <ol>
        <li><b>Lisanga</b> : nkombo, na sima esika — provense, teritware to engumba, sekteri, mboka. Na sima <b>mokolo ya likita</b> mpe lolenge (poso na poso to baposo mibale).</li>
        <li><b>Elembo ya lisanga</b> : pona elembo mpe langi oyo moto nyonso akoyeba, ata soki ayebi kotanga te. Ekomonana na ekran ya ebandeli mpe na bakarte ya bato.</li>
        <li><b>Esika (GPS)</b> — soki bolingi : finá « Kozwa esika sikoyo » bozali <b>libanda, na likolo polele</b>, esika lisanga ekutanaka. <b>Rezo esengeli te</b> : telefone etangaka basatelite.</li>
        <li><b>Mibeko</b> : motuya ya eteni, biteni na likita moko, sanduku ya lisalisi, bolai ya mobu, litomba, nyongo oyo eleki monene, bolai ya banyongo, balamande.</li>
        <li><b>Bato ya lisanga</b> : fise moko na moto moko. <b>Esengeli</b> : nkombo mpe soki azali mwasi to mobali. <b>Soki bolingi</b> : foto, mokolo ya mbotama to mibu, telefone, mosala, esika afandaka. Lisanga endimaka bato <b>15 kino 35</b>.</li>
        <li><b>Bakonzi</b> : mokonzi, mokomi, mobombi mbongo, batangi mibale mpe <b>babateli fungola misato</b>. Mobombi mbongo abatelaka sanduku, yango wana <b>akoki kobatela fungola te</b>.</li>
        <li><b>Kobanda</b> : <b>lisanga ya sika</b> (sanduku ezali mpamba) to <b>lisanga ezalaki deja</b> (bokoma buku na bino ya papye).</li>
      </ol>
      <div class="tip">Na nsuka, Akiba elakisaka <b>kode ya sekele ekeseni mpo na moto nyonso, mbala moko kaka</b>. Bokoma yango na mwa bapapye mpe bopesa na maboko, na WhatsApp te.</div>`,
    },
    reunion: {
      t: 'Likita, etape na etape',
      b: `
      <p>Likita elandaka <b>bitape mwambe</b>, na molongo kaka lokola buku ya papye. Akiba ekambaka : etape moko na mbala moko, mpe okoki kopumbwa te. Mongongo ekoki kotanga etape nyonso na makasi.</p>
      <ol>
        <li><b>Kofungola</b> : babateli fungola misato bafungolaka sanduku liboso ya bato nyonso. Batangi batangaka mbongo <b>na mongongo makasi</b>, mpe motango ekomami.</li>
        <li><b>Koya na likita</b> : simba nkombo ya moto nyonso oyo azali te. Lamande ya kozanga ebakisami yango moko.</li>
        <li><b>Sanduku ya lisalisi</b> : moto nyonso apesaka motuya oyo baponaki.</li>
        <li><b>Kobomba</b> : moto nyonso asombaka biteni na ye, banda moko kino motango oyo baponaki. Oyo akoki te lelo asombaka zero — ezali mabe te.</li>
        <li><b>Kozongisa nyongo</b> : moto nyonso oyo azali na nyongo afutaka ndenge akoki. Akiba etangaka litomba yango moko.</li>
        <li><b>Banyongo ya sika</b> : likita endimi to eboyi. Akiba eboyaka bosengi oyo eleki motango oyo baponaki.</li>
        <li><b>Balamande</b> : retare, makelele, telefone — ndenge mibeko elobi.</li>
        <li><b>Kokanga</b> : batangi batangaka lisusu liboso ya bato nyonso. Babateli fungola misato batiaka bakode na bango. Likita ekangami na elembo.</li>
      </ol>
      <div class="tip">Mobateli fungola <b>azali te</b> ? Simba nkombo na ye, na sima « Azali te », mpe mokonzi mosusu atiaka kode na ye na esika na ye. Nyonso ekomami : nani azangaki, nani azwaki esika na ye.</div>
      <p>Sima ya kokanga, Akiba ebimisaka <b>risi ya moto nyonso</b> mpe <b>buku ya likita</b> ya kobimisa. Bobimisa buku na likita nyonso mpe bobomba yango : soki telefone ebungi, bapapye yango nde bokundoli na bino.</p>`,
    },
    epargne: {
      t: 'Kobomba mpe biteni',
      b: `
      <p>Na likita nyonso, moto ya lisanga asombaka <b>biteni</b> : banda moko kino motango oyo baponaki (mbala mingi 5). Eteni moko ezali na ntalo moko mpo na bato nyonso.</p>
      <p>Kosomba biteni mingi elingi koloba : kobomba mingi, kodefa mingi, mpe kozwa <b>litomba monene</b> na ntango ya bokaboli.</p>
      <p>Moto oyo akoki kosomba te lelo akomami na <b>biteni zero</b>. Lamande ezali te mpo na yango : lisanga ekomaka solo, esambisaka te.</p>
      <div class="tip">Na buku na ye, moto nyonso amonaka biteni na ye, mbongo na ye, mpe <b>motuya na ye soki bakaboli lelo</b>. Akoki mpe kokoma <b>ndoto</b> na ye — nsamba, mobu ya kelasi, ntaba — mpe Akiba ekoloba na likita nyonso ntango nini akokoma.</div>`,
    },
    credit: {
      t: 'Banyongo',
      b: `
      <p>Moto ya lisanga asengaka nyongo liboso ya likita. Akiba elakisaka <b>oyo akoki kodefa</b> : mbongo na ye ebakisami na motango oyo baponaki (mbala mingi mbala 3), mpe ata moke te koleka mbongo oyo ezali na sanduku.</p>
      <ul>
        <li><b>Ntina ya nyongo</b> ekomami : mombongo, bilanga, kelasi, bokolongono, kotonga ndako.</li>
        <li><b>Litomba</b> etangami na telefone, sanza na sanza.</li>
        <li><b>Mokolo ya kofuta</b> ekoki kokweya te na mokolo oyo lisanga ekutanaka te : Akiba epusaka yango tii likita oyo elandi.</li>
        <li>Kozongisa endimami <b>moke moke</b> : moto afutaka oyo akoki na likita nyonso.</li>
      </ul>
      <p>Nyongo ya retare emonanaka mbala moko na ekran ya ebandeli, mpe molakisi amonaka elembo na ye.</p>
      <div class="tip">Mobombi mbongo akoki komipesa nyongo ye moko te : nyongo nyonso endimami na mokonzi mosusu ya lisanga.</div>`,
    },
    recus: {
      t: 'Barisi ya bato ya lisanga',
      b: `
      <p>Sima ya kokanga likita, Akiba ebimisaka <b>risi moko mpo na moto nyonso oyo ayaki</b> : mbongo ya mokolo, nyongo, balamande, mpe elembo ya likita.</p>
      <ul>
        <li><b>Kobimisa</b> na masini ya POS, to na masini ya Bluetooth (RawBT).</li>
        <li><b>Kokabola</b> makomi na WhatsApp, soki moto azali na telefone.</li>
        <li><b>Barisi ya mokuse</b> : milongo zomi na esika ya tuku misato — papye moke, mbongo moke.</li>
      </ul>
      <p>Risi nyonso ezali na <b>nimero ya kotalisa</b>. Soki moto atii tembe na risi na ye, simba « Kotala risi » : Akiba etangaka lisusu ata rezo ezali te.</p>
      <h4>Buku ya likita</h4>
      <p>Longola barisi, Akiba ebimisaka mpe <b>buku ya likita mobimba</b> : makomi nyonso, mituya, bofungoli mpe bokangi, bokeseni ya sanduku, mpe elembo. <b>Bobimisa yango na likita nyonso</b> mpe botia bapapye na dosye, na molongo. Soki telefone ebungi to bayibi yango, bapapye yango nde ekopesa nzela ya kobanda lisusu.</p>`,
    },
    cartes: {
      t: 'Bakarte ya bato ya lisanga',
      b: `
      <p>Akiba ebimisaka <b>karte ya moto nyonso</b>, na bonene ya karte ya banki : nkombo, mosala na ye, nimero na ye, mokolo akotaki, elembo ya lisanga, foto na ye soki apesi yango, mpe QR code.</p>
      <ul>
        <li><b>Lokasa ya A4</b> ya momeseno : bakarte zomi na lokasa moko. Bobimisa, na sima bokata na milongo.</li>
        <li><b>Masini ya POS</b> : karte moko moko na molongo ya 58 mm.</li>
      </ul>
      <p><b>Kode ya sekele ezali te, motuya ezali te</b> na karte : soki ebungi to bazwi foto na yango, likama ezali te.</p>
      <div class="tip">« Kotala karte » etangaka QR mpe esalaka lisusu botangi <b>ata rezo ezali te</b>, na telefone nyonso ya lisanga. Karte oyo bakomi lisusu, to oyo euti na lisanga mosusu, eboyami.</div>`,
    },
    social: {
      t: 'Sanduku ya lisalisi',
      b: `
      <p>Na likita nyonso, moto nyonso apesaka mwa motuya se moko na <b>sanduku ya lisalisi</b>. Sanduku oyo <b>ezali kobomba te</b> : ekabolami te na nsuka ya mobu, etikalaka na lisanga mpo na mobu oyo elandi.</p>
      <p>Esalelamaka mpo na kosalisa moto na mpasi : liwa, bokono, likama, mbotama ya mwana. Lisalisi endimami na likita, mpe <b>ekomami elongo na ntina na yango</b>.</p>`,
    },
    amendes: {
      t: 'Balamande',
      b: `
      <p>Balamande eponami na likita na ebandeli ya mobu, mpe ebongwanaka te na kati ya mobu. Mbala mingi : <b>kozanga koya</b>, <b>retare</b>, makelele, telefone oyo ezali kolela.</p>
      <p>Lamande ya kozanga ebakisami yango moko na ntango ya kotala banani bayei. Balamande mosusu ebakisami na loboko, na etape ya 7.</p>
      <p>Lamande oyo efutami te lelo etikalaka <b>ya kofuta</b> : emonanaka na buku ya moto, mpe elongolami na eteni na ye na ntango ya bokaboli.</p>
      <h4>Retare to kozanga na ntina</h4>
      <p>Liwa, bokono, kobota, nzela ekatani : likita ekoki kokata ete lamande ezali te. Na etape ya <b>koya na likita</b>, simba <b>« Kopesa ntina »</b> na nse ya nkombo ya moto, pona ntina to koma yango, mpe lamande <b>ekoproposama lisusu te</b> na etape ya 7.</p>
      <p>Ntina ekomami na buku ekangami, ebimisami na buku ya likita, mpe etangami na pembeni na lapolo ya ebongiseli : lisanga oyo ekundaki bato mibale esengeli emonana lokola lisanga ya bozangi bokebi te.</p>
      <div class="tip">Ntina ezali likabo ya bakonzi te : likita nde ekataka, na mongongo makasi. Bakonzi bakoki kozongisa lamande ntango nyonso, mpe Akiba ebombaka nani apesaki ntina nini.</div>`,
    },
    perdu: {
      t: 'Kode ya sekele ebungi',
      b: `
      <p>Moto abosani kode na ye ? Na ekran ya ebandeli, simba bouton <b>AVEC</b>, na sima na nse <b>« Nabosani kode na ngai »</b>. Banzela misato :</p>
      <ol>
        <li><b>Bakonzi mibale ya lisanga</b> batiaka bakode na bango : yango nde nzela ya momeseno, mpe ekoki.</li>
        <li><b>Karte ya lisalisi</b> : bakode motoba ya mbala moko, ebimisami na ntango ya kosala lisanga.</li>
        <li><b>Kobenga molakisi</b>, soki lisanga ezali kolandama.</li>
      </ol>
      <p>Moto aponaka na sima kode ya sika, <b>oyo emonanaka ata moke te</b> na ekran. Nyonso ekomami na buku ya libateli.</p>
      <div class="tip">Karte ya lisalisi ebombami <b>na papye, kati na sanduku ekangami na fungola</b> — ata moke te kati na telefone.</div>`,
    },
    securite: {
      t: 'Libateli mpe kokeba na bokosi',
      b: `
      <p>Likomi nyonso kati na Akiba ememaka <b>elembo ya likomi oyo ewutaki liboso</b>. Kobongola ata motango moko ebukaka monyololo, mpe Akiba elakisaka mbala moko esika ebukani. Moto akoki kolongola to kobongola na kimia te — ezala bakonzi, ezala molakisi, ezala biso.</p>
      <ul>
        <li><b>Sanduku etangami mbala mibale na likita</b>, na ebandeli mpe na nsuka, liboso ya bato nyonso.</li>
        <li><b>Babateli fungola misato</b> bandimaka bokangi na bakode na bango.</li>
        <li><b>Mobombi mbongo akoki kobatela fungola te</b> : oyo abatelaka mbongo azali te oyo afungolaka sanduku.</li>
        <li><b>Buku ya libateli</b> ekomaka likambo nyonso ya ntina : kode ebongwani, mosala ebongwani, fungola epesami.</li>
      </ul>
      <p>Molakisi amonaka mituya kasi <b>abongolaka eloko te</b> : atalaka, akomaka te.</p>`,
    },
    cles: {
      t: 'Mobateli fungola azali te, bakonzi babongwani',
      b: `
      <p><b>Mobateli fungola azali te lelo ?</b> Na ntango ya kokanga, simba nkombo na ye na sima « Azali te ». Mokonzi mosusu atiaka kode na ye na esika na ye. Likita ekangami malamu, mpe buku ekomaka nani azangaki mpe nani azwaki esika na ye.</p>
      <p><b>Bakonzi babongwani na kati ya mobu ?</b> Ekoki : maponami ya sika, kotika mosala, kokende, bokono to liwa. Kende na <b>Mosusu › Bakonzi mpe babateli fungola</b>. Mbongwana endimami na mokonzi mosusu ya lisanga ya sikoyo, mpe ekomami : nani abungisi mosala, nani azwi yango, nani andimi.</p>
      <div class="tip">Bobongola mikumba <b>sima ya kokanga likita</b>, na kati te : bafungola esalelamaka mpo na kokanga sanduku.</div>`,
    },
    membres: {
      t: 'Kotala bato ya lisanga',
      b: `
      <p><b>Moto ya sika</b> na kati ya mobu : <b>Bato ya lisanga › Kobakisa</b>. Asombaka biteni banda likita na ye ya liboso. Na ntango ya bokaboli akozwa litomba kaka ya <b>ntango oyo alekisaki</b> na lisanga.</p>
      <p><b>Moto azali kobima</b> : simba nkombo na ye, na sima « Kobima na lisanga ». Akiba ezongisaka mbongo na ye nyonso mpe ekangaka buku na ye. Litomba oyo ezwamaki na mbongo na ye etikalaka na lisanga.</p>
      <p><b>Makambo ebongwani</b> (telefone, mosala, esika, foto) : simba nkombo, na sima « Kobongola makambo ». Mbongwana nyonso ekomami.</p>`,
    },
    partage: {
      t: 'Nsuka ya mobu mpe bokaboli',
      b: `
      <p>Na nsuka ya mobu, lisanga ekaboli nyonso mpe ebandi lisusu. Bokaboli esalemaka na <b>likita na yango moko</b>, na nsuka ya likita ya momeseno te.</p>
      <p>Liboso ya kokabola, makambo minei esengeli ezala malamu :</p>
      <ol>
        <li><b>Banyongo nyonso efutami</b> — ya kati mpe ya libanda.</li>
        <li><b>Likita ya nsuka ekangami.</b></li>
        <li><b>Sanduku etangami</b> mpe ekokani.</li>
        <li><b>Likita endimi</b> kokabola.</li>
      </ol>
      <h4>Botangi ekendaka boye</h4>
      <p>Moto nyonso azwaka liboso <b>mbongo na ye nyonso oyo abombaki</b>. Na sima <b>litomba</b> ekabolami na ndenge ya mbongo ya moto na moto <b>mpe ntango oyo elekaki</b> kati na sanduku. Oyo moto azali naino na nyongo (nyongo, balamande) elongolami na eteni na ye. <b>Sanduku ya lisalisi ekabolami te</b> : etikalaka mpo na mobu oyo elandi.</p>
      <p>Soki lisanga ezali na <b>nyongo ya libanda</b>, modefisi afutami <b>liboso</b> ya bokaboli.</p>
      <p>Akiba elakisaka tabo mobimba liboso ya kosala eloko, mpe esengaka <b>kode ya mokonzi ya lisanga</b> mpo na kondima. Sima ya yango, mobu ekangami : kozonga nsima ezali te.</p>
      <div class="tip">Bokaboli <b>liboso ya mokolo</b> ekoki soki likita endimi — na ndakisa liboso ya eleko ya kolona to ya kobanda kelasi. Akiba ekebisaka soki mobu ezali naino na baposo koleka mibale, kasi epekisaka te.</div>`,
    },
    cycle: {
      t: 'Kobanda mobu ya sika',
      b: `
      <p>Sima ya bokaboli, lisanga ekoki kobanda mobu ya sika mbala moko. Simba <b>Kobanda mobu ya sika</b>.</p>
      <ul>
        <li>Mibeko eponami <b>lisusu</b> : motuya ya eteni ekoki kobongwana, ndenge moko litomba mpe balamande.</li>
        <li>Bakonzi baponami lisusu, to batikali se bango.</li>
        <li>Bato bakoki kokota to kobima.</li>
        <li><b>Sanduku ya lisalisi etikalaka</b> ndenge ezali : ebandaka lisusu na zero te.</li>
      </ul>
      <p>Mibu eleki etikalaka kati na telefone, na buku na yango ekangami : <b>Mosusu › Mibu eleki</b>.</p>`,
    },
    reseau: {
      t: 'Ata rezo ezali te',
      b: `
      <p>Akiba <b>esengeli na rezo te</b> mpo na kosala. Likita esalemaka, mbongo ekomami, barisi ebimisami — nyonso ata rezo ezali te, mpe nyonso etikalaka kati na telefone.</p>
      <p>Tango rezo ezali, Akiba etindaka makomi ya sika epai ya molakisi yango moko. Soki lisanga ezali na rezo ata moke te, molakisi azwaka makambo na <b>fisye</b> na ntango ya botali na ye.</p>
      <p>Ekran ya ebandeli elakisaka ntango nyonso <b>makomi boni etikali ya kotinda</b>.</p>`,
    },
    installer: {
      t: 'Elembo, libateli mpe bobombi',
      b: `
      <p><b>Kotia elembo na ekran</b> : simba « Kotia Akiba na masini oyo ». Na sima Akiba efungwamaka lokola application nyonso, ata rezo ezali te.</p>
      <p><b>Bobomba kopi mbala na mbala</b> : <b>Mosusu › Kotia mpe kobomba</b>. Fisye ebombami na telefone ; botinda yango na karte ya memware to na WhatsApp epai ya molakisi. Soki telefone ebungi, kopi yango mpe babuku oyo bobimisaki nde ekozongisa nyonso.</p>
      <div class="tip">Kaka telefone moko nde esalaka makita ya lisanga. Kobongola telefone : <b>Mosusu › Kobongola telefone</b>. Telefone ya kala etikalaka na kopi kasi ekoki kofungola likita te.</div>`,
    },
    audio: {
      t: 'Koyoka na esika ya kotanga',
      b: `
      <p>Ekran nyonso ya ntina ezali na bouton <b>« Koyoka »</b> : telefone etangaka na mongongo makasi, <b>ata rezo ezali te</b>. Ezali mpo na moto oyo atangaka malamu te, mpe mpo na bato nyonso ya likita bayoka.</p>
      <p>Likita mpe ekambami na mongongo : etape nyonso ya mwambe esakolami.</p>
      <p>Mongongo ewutaka na telefone. Na bateelefone mingi ya Android, bozwa mongongo na <b>Paramètres › Langue › Synthèse vocale</b>, na sima bopona yango na <b>Mosusu › Mongongo ya kotanga</b>.</p>`,
    },
    mots: {
      t: 'Maloba ya koyeba',
      b: `
      <ul>
        <li><b>AVEC</b> — lisanga ya bato 15 kino 35 ya mboka moko oyo babombaka mbongo esika moko mpe badefisanaka.</li>
        <li><b>Eteni</b> — emekeli ya kobomba. Na likita nyonso, moto asombaka eteni moko kino mitano.</li>
        <li><b>Mobu</b> — ntango kati ya ebandeli mpe bokaboli : mbala mingi sanza 9 to 12.</li>
        <li><b>Sanduku ya lisalisi</b> — mbongo ya kosunga na mpasi. Ekabolami te.</li>
        <li><b>Bokaboli</b> — nsuka ya mobu : moto nyonso azwaka mbongo na ye mpe eteni na ye ya litomba.</li>
        <li><b>Elembo</b> — oyo ekangaka likita mpe epekisaka kobongola na sima.</li>
        <li><b>IMF</b> — ndako ya mikrofinanse, oyo ekoki kodefisa lisanga.</li>
      </ul>`,
    },
  },
};

/* la section dans la langue choisie, ou le français avec une ligne qui le dit */
function guideSection(g) {
  const l = typeof I18N !== 'undefined' ? (I18N._mem || I18N.cur()) : 'fr';
  const tr = (GUIDE_TR[l] || {})[g.id];
  if (tr) return { t: tr.t, b: tr.b, traduit: true };
  return { t: g.t, b: g.b, traduit: false, lang: l };
}
/* combien de sections sont écrites dans cette langue — le guide se mesure en sections, pas en phrases */
function guideCouverture(l, sections) {
  if (l === 'fr') return 1;
  const d = GUIDE_TR[l] || {};
  const n = sections.filter(g => d[g.id]).length;
  return sections.length ? n / sections.length : 0;
}
