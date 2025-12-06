import type { MenuStep } from '@/types';

export interface MenuStepSelections {
  [stepId: string]: string[]; // Array d'IDs des options sélectionnées
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StepValidation {
  stepId: string;
  stepName: string;
  isValid: boolean;
  selectedCount: number;
  minRequired: number;
  maxAllowed: number;
  missing: number;
  excess: number;
}

/**
 * Valide les sélections pour un step spécifique
 */
export const validateStep = (
  step: MenuStep, 
  selections: string[]
): StepValidation => {
  const selectedCount = selections.length;
  const missing = Math.max(0, step.minSelections - selectedCount);
  const excess = Math.max(0, selectedCount - step.maxSelections);
  const isValid = selectedCount >= step.minSelections && selectedCount <= step.maxSelections;

  return {
    stepId: step.id,
    stepName: step.nom,
    isValid,
    selectedCount,
    minRequired: step.minSelections,
    maxAllowed: step.maxSelections,
    missing,
    excess
  };
};

/**
 * Valide toutes les sélections d'un menu composé
 */
export const validateMenuSelections = (
  steps: MenuStep[], 
  selections: MenuStepSelections
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const step of steps) {
    const stepSelections = selections[step.id] || [];
    const validation = validateStep(step, stepSelections);

    if (!validation.isValid) {
      if (validation.missing > 0) {
        errors.push(
          `${step.nom}: ${validation.missing} sélection${validation.missing > 1 ? 's' : ''} manquante${validation.missing > 1 ? 's' : ''} (min: ${step.minSelections})`
        );
      }

      if (validation.excess > 0) {
        errors.push(
          `${step.nom}: ${validation.excess} sélection${validation.excess > 1 ? 's' : ''} en trop (max: ${step.maxSelections})`
        );
      }
    }

    // Avertissements pour les steps optionnels sans sélection
    if (!step.required && stepSelections.length === 0) {
      warnings.push(`${step.nom}: Aucune sélection (optionnel)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Calcule le prix total d'un menu avec les sélections
 */
export const calculateMenuPrice = (
  basePrice: number,
  steps: MenuStep[],
  selections: MenuStepSelections
): number => {
  const adjustments = steps.reduce((total, step) => {
    const stepSelections = selections[step.id] || [];
    
    return total + stepSelections.reduce((stepTotal, optionId) => {
      const option = step.options.find(o => o.id === optionId);
      return stepTotal + (option?.priceAdjustment || 0);
    }, 0);
  }, 0);

  return basePrice + adjustments;
};

/**
 * Génère une description textuelle des sélections
 */
export const generateMenuDescription = (
  steps: MenuStep[],
  selections: MenuStepSelections,
  separator: string = ' • '
): string => {
  const descriptions = steps
    .map(step => {
      const stepSelections = selections[step.id] || [];
      const selectedOptions = stepSelections
        .map(optionId => step.options.find(o => o.id === optionId)?.nom)
        .filter(Boolean);
      
      return selectedOptions.length > 0 ? selectedOptions.join(', ') : null;
    })
    .filter(Boolean);

  return descriptions.join(separator);
};

/**
 * Vérifie si on peut passer au step suivant
 */
export const canProceedToNextStep = (
  currentStep: MenuStep,
  selections: string[]
): boolean => {
  return selections.length >= currentStep.minSelections;
};

/**
 * Vérifie si on peut ajouter une option supplémentaire
 */
export const canAddOption = (
  step: MenuStep,
  currentSelections: string[]
): boolean => {
  return currentSelections.length < step.maxSelections;
};

/**
 * Vérifie si on peut retirer une option
 */
export const canRemoveOption = (
  step: MenuStep,
  currentSelections: string[],
  optionId: string
): boolean => {
  if (!currentSelections.includes(optionId)) return false;
  
  // Si c'est requis et qu'on est au minimum, on ne peut pas retirer
  if (step.required && currentSelections.length <= step.minSelections) {
    return false;
  }
  
  return true;
};

/**
 * Obtient le texte de statut pour un step
 */
export const getStepStatusText = (step: MenuStep, selections: string[]): {
  text: string;
  type: 'success' | 'warning' | 'error' | 'info';
} => {
  const validation = validateStep(step, selections);
  
  if (validation.isValid) {
    if (step.minSelections === step.maxSelections) {
      return {
        text: `${validation.selectedCount}/${step.maxSelections}`,
        type: 'success'
      };
    } else {
      return {
        text: `${validation.selectedCount} sélectionné(s) (min: ${step.minSelections}, max: ${step.maxSelections})`,
        type: 'success'
      };
    }
  }
  
  if (validation.missing > 0) {
    return {
      text: `${validation.selectedCount}/${step.minSelections} minimum requis`,
      type: step.required ? 'error' : 'warning'
    };
  }
  
  if (validation.excess > 0) {
    return {
      text: `${validation.selectedCount}/${step.maxSelections} maximum autorisé`,
      type: 'error'
    };
  }
  
  return {
    text: `${validation.selectedCount} sélectionné(s)`,
    type: 'info'
  };
};

// Tests unitaires basiques (à utiliser avec Jest ou autre framework de test)
export const runValidationTests = () => {
  console.group('🧪 Tests de validation des menus composés');
  
  // Test step simple
  const testStep: MenuStep = {
    id: 'test-step',
    nom: 'Test Step',
    required: true,
    minSelections: 1,
    maxSelections: 2,
    options: [
      { id: 'opt1', nom: 'Option 1', priceAdjustment: 0 },
      { id: 'opt2', nom: 'Option 2', priceAdjustment: 1.5 }
    ]
  };
  
  // Test 1: Validation step valide
  console.assert(
    validateStep(testStep, ['opt1']).isValid,
    '❌ Test 1 échoué: Step avec 1 sélection devrait être valide'
  );
  console.log('✅ Test 1: Step avec sélection valide');
  
  // Test 2: Validation step invalide (pas assez)
  console.assert(
    !validateStep(testStep, []).isValid,
    '❌ Test 2 échoué: Step sans sélection devrait être invalide'
  );
  console.log('✅ Test 2: Step sans sélection invalide');
  
  // Test 3: Validation step invalide (trop)
  console.assert(
    !validateStep(testStep, ['opt1', 'opt2', 'opt3']).isValid,
    '❌ Test 3 échoué: Step avec trop de sélections devrait être invalide'
  );
  console.log('✅ Test 3: Step avec trop de sélections invalide');
  
  // Test 4: Calcul de prix
  const price = calculateMenuPrice(10, [testStep], { 'test-step': ['opt2'] });
  console.assert(
    price === 11.5,
    `❌ Test 4 échoué: Prix calculé ${price}, attendu 11.5`
  );
  console.log('✅ Test 4: Calcul de prix correct');
  
  console.groupEnd();
};

// Décommenter pour exécuter les tests
// runValidationTests();