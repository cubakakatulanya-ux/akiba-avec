package com.ubora.akiba;

import android.annotation.SuppressLint;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.OnBackPressedCallback;
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
  private static final String DOMAINE = "akiba.uborardc.com";

  private WebView vue;

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

    /* le pont vers le matériel du terminal : pour l'instant, l'imprimante */
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
