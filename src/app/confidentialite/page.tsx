import LegalLayout from "@/components/LegalLayout"

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="Mars 2025">
      <h2>1. Responsable du traitement</h2>
      <p>Le responsable du traitement des données personnelles collectées sur <strong>fydelys.fr</strong> est <strong>Lysia SAS</strong>, société par actions simplifiée au capital de 5 000 €, dont le siège social est situé 2 Rue de Bâle, 68180 Horbourg-Wihr, immatriculée au RCS de Colmar sous le numéro 829 391 382, représentée par Bernard Guthmann. Contact : <a href="mailto:info@lysia.fr">info@lysia.fr</a></p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons les données suivantes :</p>
      <ul>
        <li><strong>Lors de l'inscription :</strong> nom, prénom, adresse email, numéro de téléphone, nom du studio</li>
        <li><strong>Lors de l'utilisation :</strong> données de navigation, logs de connexion, adresse IP</li>
        <li><strong>Lors du paiement :</strong> les données bancaires sont traitées exclusivement par Stripe — nous ne stockons aucune donnée de carte bancaire</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Vos données sont utilisées pour :</p>
      <ul>
        <li>Créer et gérer votre compte Fydelys</li>
        <li>Fournir les services de gestion de studio (planning, membres, paiements)</li>
        <li>Envoyer des communications transactionnelles (confirmations, factures, magic links)</li>
        <li>Améliorer la plateforme et assurer la sécurité</li>
        <li>Respecter nos obligations légales</li>
      </ul>

      <h2>4. Base légale</h2>
      <p>Le traitement est fondé sur :</p>
      <ul>
        <li><strong>L'exécution d'un contrat</strong> — pour la fourniture de nos services</li>
        <li><strong>Le consentement</strong> — pour les communications marketing éventuelles</li>
        <li><strong>L'intérêt légitime</strong> — pour la sécurité et l'amélioration du service</li>
      </ul>

      <h2>5. Durée de conservation</h2>
      <p>Vos données sont conservées pendant toute la durée de votre compte actif, puis :</p>
      <ul>
        <li>3 ans après la clôture du compte pour les données de facturation (obligations fiscales)</li>
        <li>1 an pour les logs de connexion et données de navigation</li>
      </ul>

      <h2>6. Destinataires des données</h2>
      <p>Vos données peuvent être partagées avec :</p>
      <ul>
        <li><strong>Supabase</strong> (hébergement base de données) — <a href="https://supabase.com/privacy" target="_blank" rel="noopener">politique de confidentialité</a></li>
        <li><strong>Stripe</strong> (paiements) — <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener">politique de confidentialité</a></li>
        <li><strong>SendGrid/Twilio</strong> (emails transactionnels)</li>
        <li><strong>Vercel</strong> (hébergement) — <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">politique de confidentialité</a></li>
      </ul>
      <p>Aucune donnée n'est vendue à des tiers.</p>

      <h2>7. Vos droits (RGPD)</h2>
      <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
        <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
        <li><strong>Droit à l'effacement</strong> — demander la suppression de vos données</li>
        <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
        <li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li>
        <li><strong>Droit à la limitation</strong> — demander la limitation du traitement</li>
      </ul>
      <p>Pour exercer ces droits, contactez-nous à <a href="mailto:info@lysia.fr">info@lysia.fr</a>. Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> : <a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>.</p>

      <h2>8. Cookies</h2>
      <p>Fydelys utilise uniquement des cookies strictement nécessaires au fonctionnement de l'authentification (session Supabase). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>

      <h2>9. Sécurité</h2>
      <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS, authentification sécurisée, accès restreint aux données.</p>

      <h2>10. Modifications</h2>
      <p>Cette politique peut être mise à jour. Toute modification significative sera notifiée par email. La date de dernière mise à jour figure en haut de cette page.</p>

      <h2>11. Contact</h2>
      <p>Pour toute question relative à la protection de vos données : <a href="mailto:info@lysia.fr">info@lysia.fr</a></p>
    </LegalLayout>
  )
}
