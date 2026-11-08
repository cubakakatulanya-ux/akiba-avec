package com.ubora.akiba;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

/**
 * Akiba, dans une application Android.
 *
 * L'écran n'est qu'une WebView qui affiche la page déjà écrite. Tout ce que fait cette classe,
 * c'est la servir correctement :
 *
 *   — sous l'adresse du site, et non sous « file:// », pour que l'application et la page web
 *     partagent la même origine. C'est ce qui permet de retrouver un cahier déjà enregistré sur
 *     ce terminal : mêmes données, mêmes codes, mêmes réunions ;
 *   — depuis les fichiers embarqués dans l'application, donc sans réseau, dès le premier
 *     démarrage, y compris dans un village sans couverture ;
 *   — avec le bouton Retour du téléphone branché sur celui de l'application, pour que la touche
 *     physique du terminal fasse ce que le secrétaire attend.
 */
public class MainActivity extends AppCompatActivity {

  /** Le domaine du site. Ne pas le changer : c'est lui qui relie l'application aux données
   *  déjà enregistrées sur le terminal. En changer couperait le cahier existant. */
  private static final String DOMAINE = BuildConfig.DOMAINE;   // akiba.uborardc.com ou akibas.uborardc.com, selon l'application fabriquée

  private WebView vue;

  /* ---------- recevoir un fichier ----------
     « Recevoir une AVEC », « Restaurer une sauvegarde » : la page ouvre un champ de fichier.
     Une WebView n'y répond pas toute seule — le bureau touchait le champ et il ne se passait
     rien. C'est ici qu'on ouvre le sélecteur du téléphone et qu'on rend le fichier choisi. */
  /* ---------- viser une image ----------
     La page demande l'appareil photo pour lire le QR d'une AVEC neuve ou vérifier une carte.
     Une WebView refuse toute seule, en silence : il faut lui dire oui ici, et demander d'abord
     la permission à Android. Tant que le secrétaire n'a pas visé, rien n'est demandé. */
  private android.webkit.PermissionRequest camera;
  private final ActivityResultLauncher<String> permissionCamera =
      registerForActivityResult(new ActivityResultContracts.RequestPermission(), accorde -> {
        if (camera == null) return;
        if (accorde) camera.grant(new String[]{ android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE });
        else camera.deny();                        // la page le dit, et propose le fichier
        camera = null;
      });

  private ValueCallback<Uri[]> fichierAttendu;
  private final ActivityResultLauncher<Intent> selecteur =
      registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), resultat -> {
        Uri[] choisis = null;
        if (resultat.getResultCode() == Activity.RESULT_OK && resultat.getData() != null) {
          choisis = WebChromeClient.FileChooserParams.parseResult(resultat.getResultCode(), resultat.getData());
        }
        if (fichierAttendu != null) { fichierAttendu.onReceiveValue(choisis); fichierAttendu = null; }
      });

  @SuppressLint("SetJavaScriptEnabled")
  @Override protected void onCreate(Bundle etat) {
    super.onCreate(etat);

    final WebViewAssetLoader chargeur = new WebViewAssetLoader.Builder()
        .setDomain(DOMAINE)
        .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
        .build();

    vue = new WebView(this);
    setContentView(vue);

    WebSettings reglages = vue.getSettings();
    reglages.setJavaScriptEnabled(true);
    reglages.setDomStorageEnabled(true);          // le cahier vit dans IndexedDB et localStorage
    reglages.setDatabaseEnabled(true);
    reglages.setMediaPlaybackRequiresUserGesture(false);   // les sons de l'application
    reglages.setAllowFileAccess(false);           // rien d'autre que nos fichiers
    reglages.setAllowContentAccess(false);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) reglages.setSafeBrowsingEnabled(false);

    vue.setWebViewClient(new WebViewClient() {
      @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
        return chargeur.shouldInterceptRequest(r.getUrl());
      }
      /* Un lien vers l'extérieur (le site d'Ubora, une aide) part dans le navigateur du
         terminal, pas dans l'application : on ne veut pas que le cahier serve de navigateur. */
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        String hote = r.getUrl().getHost();
        if (hote != null && hote.equals(DOMAINE)) return false;
        try { startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, r.getUrl())); }
        catch (Exception e) { /* aucun navigateur installé : on reste là plutôt que de planter */ }
        return true;
      }
    });

    vue.setWebChromeClient(new WebChromeClient() {
      @Override public void onPermissionRequest(android.webkit.PermissionRequest demande) {
        boolean veutCamera = false;
        for (String r : demande.getResources()) if (android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) veutCamera = true;
        if (!veutCamera) { demande.deny(); return; }   // Akiba ne demande rien d'autre
        if (androidx.core.content.ContextCompat.checkSelfPermission(MainActivity.this, android.Manifest.permission.CAMERA)
            == android.content.pm.PackageManager.PERMISSION_GRANTED) {
          demande.grant(new String[]{ android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE });
          return;
        }
        camera = demande;
        permissionCamera.launch(android.Manifest.permission.CAMERA);
      }
      @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> retour, FileChooserParams params) {
        if (fichierAttendu != null) fichierAttendu.onReceiveValue(null);   // un seul choix à la fois
        fichierAttendu = retour;
        /* On ouvre sur TOUS les fichiers, au lieu de suivre le filtre de la page. Un cahier
           Akiba porte l'extension « .akiba », qu'aucun téléphone ne connaît : en filtrant, le
           sélecteur l'affichait en gris, impossible à choisir. */
        Intent choix = new Intent(Intent.ACTION_GET_CONTENT);
        choix.addCategory(Intent.CATEGORY_OPENABLE);
        choix.setType("*/*");
        try { selecteur.launch(Intent.createChooser(choix, "Choisir le fichier")); return true; }
        catch (Exception e) { fichierAttendu = null; return false; }
      }
    });

    /* le pont vers le matériel du terminal : l'imprimante, et la sortie des fichiers */
    vue.addJavascriptInterface(new PontPOS(this), "AkibaPOS");

    /* Le bouton Retour du terminal suit l'historique de l'application. Sans cela, il quitterait
       l'application au milieu d'une réunion — et une réunion ouverte ne se quitte pas par
       accident. */
    getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
      @Override public void handleOnBackPressed() {
        if (vue.canGoBack()) vue.goBack(); else finish();
      }
    });

    vue.loadUrl("https://" + DOMAINE + "/index.html");

    /* un fichier touché dans WhatsApp a lancé l'application : on le garde, la page le
       réclamera dès qu'elle sera prête */
    garderFichier(getIntent());
  }

  /**
   * Au retour d'un écran du téléphone — celui qui accorde la protection contre la suppression —
   * la page doit se redessiner, sinon elle montre encore l'état d'avant. On ne redessine que
   * l'écran « Installer et protéger » : ailleurs, une saisie pourrait être en cours.
   */
  /** Le cahier reçu par « Ouvrir avec Akiba », en attente que la page soit prête. */
  private String fichierNom, fichierTexte;

  /**
   * Le groupe reçoit le cahier par WhatsApp et touche le fichier : Android propose Akiba,
   * et c'est ici que le fichier entre. Il n'est pas ouvert pour autant — il est chiffré,
   * et la page réclamera les huit signes dits de vive voix. Ce chemin ne remplace donc
   * aucune vérification : il remplace seulement le gestionnaire de fichiers.
   */
  private void garderFichier(Intent intention) {
    if (intention == null) return;
    Uri u = intention.getData();
    if (u == null && Intent.ACTION_SEND.equals(intention.getAction()))
      u = intention.getParcelableExtra(Intent.EXTRA_STREAM);
    if (u == null) return;
    try (InputStream flux = getContentResolver().openInputStream(u)) {
      if (flux == null) return;
      ByteArrayOutputStream sortie = new ByteArrayOutputStream();
      byte[] tampon = new byte[8192];
      int lu, total = 0;
      while ((lu = flux.read(tampon)) > 0) {
        total += lu;
        if (total > 12 * 1024 * 1024) return;      // un cahier ne pèse pas douze mégaoctets
        sortie.write(tampon, 0, lu);
      }
      fichierTexte = sortie.toString(StandardCharsets.UTF_8.name());
      fichierNom = nomDe(u);
      remettreFichier();
    } catch (Exception e) { fichierNom = null; fichierTexte = null; }
  }

  /** Le nom tel qu'il s'affichera au groupe : celui du message, à défaut un nom neutre. */
  private String nomDe(Uri u) {
    String n = u.getLastPathSegment();
    if (n != null) { int i = n.lastIndexOf('/'); if (i >= 0) n = n.substring(i + 1); }
    return (n == null || n.isEmpty()) ? "cahier.akiba" : n;
  }

  /** On ne remet le fichier que lorsque la page sait quoi en faire. */
  private void remettreFichier() {
    if (vue == null || fichierTexte == null) return;
    final String nom = javaEnJs(fichierNom), texte = javaEnJs(fichierTexte);
    vue.postDelayed(() -> {
      if (vue == null) return;
      vue.evaluateJavascript(
          "(typeof window.akibaFichierRecu === 'function') && window.akibaFichierRecu(\"" + nom + "\", \"" + texte + "\")",
          valeur -> { if (valeur != null && valeur.contains("true")) { fichierNom = null; fichierTexte = null; } });
    }, 1200);
  }

  /** Une chaîne Java telle qu'on peut l'écrire au milieu d'un appel JavaScript. */
  private static String javaEnJs(String t) {
    if (t == null) return "";
    StringBuilder b = new StringBuilder(t.length() + 32);
    for (int i = 0; i < t.length(); i++) {
      char c = t.charAt(i);
      if (c == '\\' || c == '"') b.append('\\').append(c);
      else if (c == '\n') b.append("\\n");
      else if (c == '\r') b.append("\\r");
      else if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
      else b.append(c);
    }
    return b.toString();
  }

  /** L'application était déjà ouverte : Android envoie le fichier par ici. */
  @Override protected void onNewIntent(Intent intention) {
    super.onNewIntent(intention);
    setIntent(intention);
    garderFichier(intention);
  }
  @Override protected void onResume() {
    super.onResume();
    if (vue != null) vue.evaluateJavascript(
        "typeof App !== 'undefined' && App.screen === 'dev.backup' && typeof render === 'function' && render()", null);
    if (fichierTexte != null) remettreFichier();
  }

  /** Laisser le cahier finir d'écrire avant que l'application s'efface de la mémoire. */
  @Override protected void onPause() {
    if (vue != null) vue.evaluateJavascript("typeof DB !== 'undefined' && DB.vide && DB.vide()", null);
    super.onPause();
  }

  @Override protected void onDestroy() {
    if (vue != null) { vue.destroy(); vue = null; }
    super.onDestroy();
  }
}
