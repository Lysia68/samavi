import LegalLayout from "@/components/LegalLayout"

export default function CGU() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation" updated="Mars 2025">
      <h2>1. Objet</h2>
      <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme <strong>Fydelys</strong> (fydelys.fr), service de gestion de studios de bien-être édité par <strong>Lysia SAS</strong>, société par actions simplifiée au capital de 5 000 €, dont le siège est 2 Rue de Bâle, 68180 Horbourg-Wihr, RCS Colmar 829 391 382.</p>
      <p>En créant un compte ou en utilisant Fydelys, vous acceptez sans réserve les présentes CGU.</p>

      <h2>2. Description du service</h2>
      <p>Fydelys est une plateforme SaaS (Software as a Service) permettant aux gérants de studios de bien-être (yoga, pilates, méditation, danse, etc.) de :</p>
      <ul>
        <li>Gérer leur planning de séances et cours</li>
        <li>Administrer leurs membres et adhérents</li>
        <li>Gérer leurs coachs et intervenants</li>
        <li>Encaisser des paiements via Stripe</li>
        <li>Disposer d'un espace dédié sur un sous-domaine personnalisé</li>
      </ul>

      <h2>3. Accès au service</h2>
      <h3>3.1 Inscription</h3>
      <p>L'accès à Fydelys nécessite la création d'un compte via une adresse email valide. L'inscription est réservée aux personnes majeures (18 ans ou plus) et aux professionnels agissant dans le cadre de leur activité.</p>

      <h3>3.2 Période d'essai</h3>
      <p>Toute nouvelle inscription bénéficie d'une période d'essai gratuite de <strong>15 jours</strong> sans engagement et sans carte bancaire requise. À l'issue de cette période, la souscription à un plan payant est nécessaire pour maintenir l'accès.</p>

      <h3>3.3 Comptes et rôles</h3>
      <p>La plateforme distingue plusieurs rôles : Admin (gérant du studio), Coach (intervenant) et Adhérent. Les droits d'accès varient selon le rôle attribué.</p>

      <h2>4. Abonnements et facturation</h2>
      <h3>4.1 Plans tarifaires</h3>
      <p>Fydelys propose trois plans d'abonnement mensuel : Essentiel (9€/mois), Standard (29€/mois) et Pro (69€/mois). Les tarifs sont indiqués HT et peuvent être modifiés avec un préavis de 30 jours.</p>

      <h3>4.2 Paiement</h3>
      <p>Les paiements sont traités par <strong>Stripe</strong>, prestataire de services de paiement certifié PCI-DSS. En souscrivant un abonnement, vous autorisez le prélèvement automatique mensuel sur votre moyen de paiement.</p>

      <h3>4.3 Résiliation</h3>
      <p>Vous pouvez résilier votre abonnement à tout moment depuis votre espace de facturation. La résiliation prend effet à la fin de la période d'abonnement en cours. Aucun remboursement n'est effectué pour la période entamée.</p>

      <h2>5. Obligations de l'utilisateur</h2>
      <p>En utilisant Fydelys, vous vous engagez à :</p>
      <ul>
        <li>Fournir des informations exactes lors de l'inscription</li>
        <li>Ne pas utiliser le service à des fins illicites ou frauduleuses</li>
        <li>Respecter la vie privée des membres de votre studio</li>
        <li>Obtenir les consentements nécessaires pour les données de vos adhérents</li>
        <li>Ne pas tenter de compromettre la sécurité de la plateforme</li>
        <li>Ne pas revendre ou sous-licencier l'accès au service</li>
      </ul>

      <h2>6. Données des utilisateurs finaux (adhérents)</h2>
      <p>En tant que gérant de studio, vous êtes responsable du traitement des données personnelles de vos membres. Fydelys agit en tant que sous-traitant au sens du RGPD. Vous devez informer vos adhérents de la collecte et du traitement de leurs données et obtenir les consentements requis.</p>

      <h2>7. Disponibilité et maintenance</h2>
      <p>Lysia s'efforce d'assurer la disponibilité de la plateforme 24h/24, 7j/7. Des interruptions ponctuelles peuvent intervenir pour maintenance. Lysia ne saurait être tenue responsable des interruptions de service indépendantes de sa volonté (force majeure, pannes d'hébergeur, etc.).</p>

      <h2>8. Propriété intellectuelle</h2>
      <p>Fydelys et l'ensemble de ses composants (code, design, logo, marque) sont la propriété exclusive de Lysia. L'utilisateur bénéficie d'une licence d'utilisation non exclusive, non transférable, limitée à l'usage du service.</p>
      <p>Les données créées par l'utilisateur (planning, fiches membres, etc.) restent sa propriété. Lysia s'engage à ne pas les exploiter à d'autres fins que la fourniture du service.</p>

      <h2>9. Limitation de responsabilité</h2>
      <p>La responsabilité de Lysia est limitée aux dommages directs causés par une faute de sa part. En aucun cas Lysia ne saurait être tenue responsable des dommages indirects, pertes d'exploitation ou manque à gagner.</p>

      <h2>10. Modification des CGU</h2>
      <p>Lysia SAS se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email de toute modification substantielle. La poursuite de l'utilisation du service vaut acceptation des nouvelles CGU.</p>

      <h2>11. Droit applicable et juridiction</h2>
      <p>Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux du ressort de Colmar seront seuls compétents.</p>

      <h2>12. Contact</h2>
      <p>Pour toute question relative aux présentes CGU : <a href="mailto:info@lysia.fr">info@lysia.fr</a><br/>Lysia SAS — 2 Rue de Bâle, 68180 Horbourg-Wihr</p>
    </LegalLayout>
  )
}
