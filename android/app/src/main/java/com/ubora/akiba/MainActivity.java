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
  }

  /**
   * Au retour d'un écran du téléphone — celui qui accorde la protection contre la suppression —
   * la page doit se redessiner, sinon elle montre encore l'état d'avant. On ne redessine que
   * l'écran « Installer et protéger » : ailleurs, une saisie pourrait être en cours.
   */
  @Override protected void onResume() {
    super.onResume();
    if (vue != null) vue.evaluateJavascript(
        "typeof App !== 'undefined' && App.screen === 'dev.backup' && typeof render === 'function' && render()", null);
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
