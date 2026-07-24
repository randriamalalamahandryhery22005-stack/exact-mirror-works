export interface TutorialData {
  id: string;
  title: string;
  subtitle: string;
  steps: string[];
  accentColor: string;
  icon: string;
}

export const tutorials: TutorialData[] = [
  {
    id: "aviator-basique",
    title: "Aviator",
    subtitle: "Mode Basique",
    steps: [
      "Accédez au jeu Aviator depuis l'écran principal",
      "Sélectionnez le mode Basique",
      "Entrez l'heure actuelle (HH:MM)",
      "Entrez le coefficient observé en cours",
      "Cliquez sur « Prédire » pour les résultats",
      "Utilisez les prédictions pour vos mises",
    ],
    accentColor: "#F59E0B",
    icon: "✈️",
  },
  {
    id: "aviator-pro",
    title: "Aviator",
    subtitle: "Mode Professionnel",
    steps: [
      "Sélectionnez le mode Professionnel",
      "Entrez l'heure exacte de la plateforme",
      "Entrez le coefficient actuel",
      "Analyse via algorithme avancé",
      "Résultats avec niveau de confiance",
      "Suivez les recommandations de mise",
    ],
    accentColor: "#8B5CF6",
    icon: "🎯",
  },
  {
    id: "aviator-premium",
    title: "Aviator Premium",
    subtitle: "Temps Réel & Équilibré",
    steps: [
      "Accédez à Aviator Premium",
      "Choisissez Temps Réel ou Équilibré",
      "Temps Réel : mise à jour automatique",
      "Équilibré : calcul optimisé",
      "Observez stabilité et risque",
      "Taux de précision le plus élevé",
    ],
    accentColor: "#EC4899",
    icon: "💎",
  },
  {
    id: "cosmox",
    title: "CosmoX",
    subtitle: "Prédictions Cosmiques",
    steps: [
      "Ouvrez CosmoX depuis les jeux",
      "Entrez heure et coefficient",
      "Analyse multi-facteurs activée",
      "Consultez la fiabilité des résultats",
      "Appliquez sur la plateforme de paris",
    ],
    accentColor: "#06B6D4",
    icon: "🌌",
  },
  {
    id: "jetx",
    title: "JetX",
    subtitle: "Prédictions de Vol",
    steps: [
      "Accédez à JetX depuis l'écran principal",
      "Entrez les données de vol actuelles",
      "Calcul de la trajectoire probable",
      "Coefficient prédit et niveau de risque",
      "Optimisez vos mises",
    ],
    accentColor: "#10B981",
    icon: "🚀",
  },
  {
    id: "virtuel-football",
    title: "Virtuel Football",
    subtitle: "Prédictions de Matchs",
    steps: [
      "Ouvrez Virtuel Football",
      "Sélectionnez parmi 8 ligues",
      "Choisissez le match à analyser",
      "Scores calculés avec stats pondérées",
      "Score, gagnant, nombre de buts",
      "Niveau de confiance affiché",
    ],
    accentColor: "#22C55E",
    icon: "⚽",
  },
  {
    id: "penalty-shootout",
    title: "Penalty ShootOut",
    subtitle: "Tirs au But",
    steps: [
      "Accédez à Penalty ShootOut",
      "Entrez les paramètres en cours",
      "Analyse des probabilités par tir",
      "Score prédit et probabilité de victoire",
      "Placez vos mises avec les indicateurs",
    ],
    accentColor: "#EF4444",
    icon: "🥅",
  },
  {
    id: "studio-spribe",
    title: "Studio & Spribe",
    subtitle: "1XBET Optimisé",
    steps: [
      "Accédez depuis la section 1XBET",
      "Studio : Temps Réel ou Équilibré",
      "Spribe : entrez HH:MM:SS + coefficient",
      "Algorithmes optimisés pour 1XBET",
      "Résultats avec indicateurs de confiance",
      "Appliquez directement sur 1XBET",
    ],
    accentColor: "#F97316",
    icon: "🎰",
  },
];
