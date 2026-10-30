package com.ubora.akiba;

import android.content.Context;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.pdf.PdfDocument;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.pdf.PrintedPdfDocument;

import java.io.FileOutputStream;

/**
 * Le reçu, mis en page pour le système d'impression d'Android.
 *
 * C'est la voie qui ne demande rien à installer. Android ouvre sa propre fenêtre d'impression :
 * y apparaît l'imprimante du terminal si le fabricant en a déclaré une, et toujours
 * « Enregistrer au format PDF ». Sur un terminal dont on ne connaît pas le fabricant, c'est le
 * seul chemin qui a des chances de marcher sans rien savoir de lui.
 *
 * Le ticket est du texte à chasse fixe : on choisit la taille des caractères pour que la ligne
 * la plus large du rouleau — trente-deux signes en 58 mm, quarante-huit en 80 mm — tienne
 * exactement dans la largeur imprimable. C'est ce qui garde les colonnes alignées, et un reçu
 * dont les montants ne s'alignent pas est un reçu qu'on ne sait pas lire.
 */
final class FeuilleTicket extends PrintDocumentAdapter {

  private final Context contexte;
  private final String texte;
  private final int signesParLigne;
  private PrintAttributes attributs;

  FeuilleTicket(Context c, String texte, int signesParLigne) {
    this.contexte = c;
    this.texte = texte;
    this.signesParLigne = signesParLigne > 0 ? signesParLigne : 32;
  }

  @Override public void onLayout(PrintAttributes ancien, PrintAttributes nouveau,
                                 CancellationSignal annule, LayoutResultCallback retour, Bundle extra) {
    attributs = nouveau;
    if (annule != null && annule.isCanceled()) { retour.onLayoutCancelled(); return; }
    retour.onLayoutFinished(new PrintDocumentInfo.Builder("recu-akiba.pdf")
        .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
        .setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN)
        .build(), !nouveau.equals(ancien));
  }

  @Override public void onWrite(PageRange[] pages, ParcelFileDescriptor sortie,
                                CancellationSignal annule, WriteResultCallback retour) {
    PrintedPdfDocument pdf = new PrintedPdfDocument(contexte, attributs);
    try {
      PdfDocument.Page page = pdf.startPage(0);
      final int largeur = page.getInfo().getPageWidth();
      final int hauteur = page.getInfo().getPageHeight();
      final float marge = largeur * 0.04f;
      final float utile = largeur - 2 * marge;

      Paint p = new Paint();
      p.setTypeface(Typeface.MONOSPACE);
      p.setAntiAlias(true);
      /* on part d'une taille quelconque, on mesure, et on met à l'échelle : la ligne pleine
         doit occuper la largeur imprimable, ni plus ni moins */
      p.setTextSize(10f);
      StringBuilder pleine = new StringBuilder();
      for (int i = 0; i < signesParLigne; i++) pleine.append('M');
      float mesure = p.measureText(pleine.toString());
      if (mesure > 0) p.setTextSize(10f * utile / mesure);

      final float interligne = p.getTextSize() * 1.25f;
      float y = marge + interligne;
      for (String ligne : texte.split("\n", -1)) {
        if (y > hauteur - marge) break;            // une page suffit : un reçu tient sur un ticket
        p.setFakeBoldText(ligne.startsWith("*") || ligne.equals(ligne.toUpperCase()) && ligne.trim().length() > 2);
        page.getCanvas().drawText(ligne, marge, y, p);
        y += interligne;
      }
      pdf.finishPage(page);

      if (annule != null && annule.isCanceled()) { retour.onWriteCancelled(); return; }
      pdf.writeTo(new FileOutputStream(sortie.getFileDescriptor()));
      retour.onWriteFinished(new PageRange[] { PageRange.ALL_PAGES });
    } catch (Exception e) {
      retour.onWriteFailed(e.getMessage());
    } finally {
      pdf.close();
    }
  }
}
