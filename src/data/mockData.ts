import type {CommandeEmporter} from '../types';


// Commandes emporter
export const commandesEmporter: CommandeEmporter[] = [
  { id: 'CMD1', numero: 1247, heure: '14:30', duree: 25, statut: 'EN_COURS' },
  { id: 'CMD2', numero: 1248, heure: '14:45', duree: 10, statut: 'PRETE' },
  { id: 'CMD3', numero: 1249, heure: '15:00', duree: 5, statut: 'EN_COURS' },
  { id: 'CMD4', numero: 1250, heure: '15:15', duree: 20, statut: 'EN_COURS' },
  { id: 'CMD5', numero: 1251, heure: '15:30', duree: 15, statut: 'PRETE' },
  { id: 'CMD6', numero: 1252, heure: '15:45', duree: 12, statut: 'EN_COURS' },
];



// Fonction utilitaire pour obtenir les statistiques des zones
export const getZoneStats = () => ({
  emporter: {
    total: commandesEmporter.length,
    enCours: commandesEmporter.filter(c => c.statut === 'EN_COURS').length,
    pretes: commandesEmporter.filter(c => c.statut === 'PRETE').length
  }
});