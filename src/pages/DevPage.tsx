import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, LogOut, Zap, CheckCircle, XCircle, Settings, Database, Search, Eye, Code2 } from "lucide-react";

const DevPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [restaurantSlug, setRestaurantSlug] = useState('');
    const [menuItemId, setMenuItemId] = useState('');
    const [stepsJson, setStepsJson] = useState('');
    const [overwriteSteps, setOverwriteSteps] = useState(false);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retrievedMenuItem, setRetrievedMenuItem] = useState(null);
    const [isRetrieving, setIsRetrieving] = useState(false);
    const [retrieveError, setRetrieveError] = useState(null);

    const ACCESS_CODE = 'dev123';

    const exampleJson = `{
  "steps": [
    {
      "id": "sandwich-step",
      "nom": "Sandwich",
      "required": true,
      "minSelections": 1,
      "maxSelections": 1,
      "options": [
        { "id": "sand-chpoulet", "nom": "Chawarma poulet", "priceAdjustment": 0 },
        { "id": "sand-chboeuf", "nom": "Chawarma bœuf", "priceAdjustment": 0 },
        { "id": "sand-taouk", "nom": "Taouk (poulet mariné citron)", "priceAdjustment": 0 },
        { "id": "sand-sawda", "nom": "Sawda (foies de volaille flambés au citron)", "priceAdjustment": 0 },
        { "id": "sand-falafel", "nom": "Falafel", "priceAdjustment": 0 }
      ]
    },
    {
      "id": "beignets-step",
      "nom": "Deux beignets au choix",
      "required": true,
      "minSelections": 2,
      "maxSelections": 2,
      "options": [
        { "id": "beignet-viande", "nom": "Beignet viande", "priceAdjustment": 0 },
        { "id": "beignet-fromage", "nom": "Beignet fromage", "priceAdjustment": 0 },
        { "id": "beignet-epinard", "nom": "Beignet épinard", "priceAdjustment": 0 },
        { "id": "beignet-pomme", "nom": "Beignet pomme de terre", "priceAdjustment": 0 },
        { "id": "beignet-champignon", "nom": "Beignet champignon", "priceAdjustment": 0 },
        { "id": "beignet-mixte", "nom": "Beignet mixte", "priceAdjustment": 0 }
      ]
    },
    {
      "id": "boisson-step",
      "nom": "Boisson",
      "required": true,
      "minSelections": 1,
      "maxSelections": 1,
      "options": [
        { "id": "boisson-cola", "nom": "Coca-Cola (33cl)", "priceAdjustment": 0 },
        { "id": "boisson-cola-light", "nom": "Coca-Cola Light (33cl)", "priceAdjustment": 0 },
        { "id": "boisson-fanta", "nom": "Fanta (33cl)", "priceAdjustment": 0 },
        { "id": "boisson-eau", "nom": "Eau (33cl)", "priceAdjustment": 0 }
      ]
    },
    {
      "id": "dessert-step",
      "nom": "Dessert",
      "required": true,
      "minSelections": 1,
      "maxSelections": 1,
      "options": [
        { "id": "dessert-maamoul", "nom": "Maamoul (datte ou pistache)", "priceAdjustment": 0 },
        { "id": "dessert-mouhalabia", "nom": "Mouhalabia (flan à la fleur d'oranger)", "priceAdjustment": 0 },
        { "id": "dessert-baklawa", "nom": "Baklawa (feuilletés aux fruits secs)", "priceAdjustment": 0 },
        { "id": "dessert-thecafe", "nom": "Thé ou café gourmand (3 mini desserts)", "priceAdjustment": 0 },
        { "id": "dessert-knafeh", "nom": "Knafeh (pâte kadaïf, fromage, sirop)", "priceAdjustment": 0 }
      ]
    }
  ]
}`;

    const handleLogin = () => {
        if (accessCode === ACCESS_CODE) {
            setIsAuthenticated(true);
            setAccessCode('');
            setResult(null);
        } else {
            setResult({
                type: 'error',
                message: '❌ Code d\'accès invalide. Veuillez réessayer.'
            });
            setAccessCode('');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setRestaurantSlug('');
        setMenuItemId('');
        setStepsJson('');
        setOverwriteSteps(false);
        setResult(null);
        setRetrievedMenuItem(null);
        setRetrieveError(null);
    };

    const handleRetrieveMenuItem = async () => {
        if (!restaurantSlug.trim()) {
            setRetrieveError('Le slug du restaurant est requis.');
            return;
        }

        if (!menuItemId.trim()) {
            setRetrieveError('L\'ID du menu item est requis.');
            return;
        }

        setIsRetrieving(true);
        setRetrieveError(null);
        setRetrievedMenuItem(null);

        try {
            // Import Firebase functions
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // Create document reference
            const menuItemRef = doc(db, `restaurants/${restaurantSlug.trim()}/menuItems/${menuItemId.trim()}`);

            // Get document
            const menuItemSnap = await getDoc(menuItemRef);

            if (menuItemSnap.exists()) {
                const menuItemData = {
                    id: menuItemSnap.id,
                    ...menuItemSnap.data()
                };

                console.log('Retrieved Menu Item from Firestore:', JSON.stringify(menuItemData, null, 2));
                setRetrievedMenuItem(menuItemData);
            } else {
                setRetrieveError(`Menu item avec l'ID "${menuItemId.trim()}" non trouvé dans le restaurant "${restaurantSlug.trim()}".`);
            }

        } catch (error) {
            console.error('❌ Erreur lors de la récupération du menu item:', error);
            setRetrieveError(`Erreur lors de la récupération du menu item: ${error.message}`);
        } finally {
            setIsRetrieving(false);
        }
    };

    const validateStepsJson = (jsonString) => {
        try {
            const parsed = JSON.parse(jsonString);

            if (!parsed.steps || !Array.isArray(parsed.steps)) {
                return { isValid: false, error: 'Le JSON doit contenir un tableau "steps".' };
            }

            for (let i = 0; i < parsed.steps.length; i++) {
                const step = parsed.steps[i];
                if (!step.id || !step.nom || !step.options) {
                    return {
                        isValid: false,
                        error: `L'étape ${i + 1} manque de champs requis (id, nom, options).`
                    };
                }

                if (!Array.isArray(step.options)) {
                    return {
                        isValid: false,
                        error: `L'étape ${i + 1} : les options doivent être un tableau.`
                    };
                }

                for (let j = 0; j < step.options.length; j++) {
                    const option = step.options[j];
                    if (!option.id || !option.nom || option.priceAdjustment === undefined) {
                        return {
                            isValid: false,
                            error: `L'étape ${i + 1}, option ${j + 1} manque de champs requis (id, nom, priceAdjustment).`
                        };
                    }
                }
            }

            return { isValid: true, data: parsed };
        } catch (error) {
            return { isValid: false, error: 'Format JSON invalide. Vérifiez la syntaxe.' };
        }
    };

    const handleSubmit = async () => {
        if (!restaurantSlug.trim()) {
            setResult({
                type: 'error',
                message: '❌ Le slug du restaurant est requis.'
            });
            return;
        }

        if (!menuItemId.trim()) {
            setResult({
                type: 'error',
                message: '❌ L\'ID du menu item est requis.'
            });
            return;
        }

        if (!stepsJson.trim()) {
            setResult({
                type: 'error',
                message: '❌ Le JSON des étapes est requis.'
            });
            return;
        }

        const validation = validateStepsJson(stepsJson);
        if (!validation.isValid) {
            setResult({
                type: 'error',
                message: `❌ ${validation.error}`
            });
            return;
        }

        setIsLoading(true);
        setResult({
            type: 'loading',
            message: '⏳ Configuration en cours...'
        });

        try {
            // Import Firebase functions
            const { doc, updateDoc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const menuItemRef = doc(db, `restaurants/${restaurantSlug.trim()}/menuItems/${menuItemId.trim()}`);

            // Check if menu item exists first
            const menuItemSnap = await getDoc(menuItemRef);
            if (!menuItemSnap.exists()) {
                setResult({
                    type: 'error',
                    message: `❌ Menu item avec l'ID "${menuItemId.trim()}" non trouvé dans le restaurant "${restaurantSlug.trim()}".`
                });
                setIsLoading(false);
                return;
            }

            // Prepare update data
            const updateData = {
                isComposedMenu: true,
                'composedMenuConfig.steps': validation.data.steps
            };

            // If overwrite is checked, update the entire composedMenuConfig
            if (overwriteSteps) {
                const currentData = menuItemSnap.data();
                updateData.composedMenuConfig = {
                    basePrice: currentData.composedMenuConfig?.basePrice || currentData.prix || 0,
                    steps: validation.data.steps
                };
            }

            // Update the document
            await updateDoc(menuItemRef, updateData);

            const payload = {
                restaurantSlug: restaurantSlug.trim(),
                menuItemId: menuItemId.trim(),
                steps: validation.data.steps,
                overwrite: overwriteSteps,
                timestamp: new Date().toISOString(),
                updateData
            };

            console.log('✅ Menu item updated successfully!');
            console.log('Update payload:', JSON.stringify(payload, null, 2));

            setResult({
                type: 'success',
                message: `✅ Configuration appliquée avec succès dans Firebase!`,
                details: {
                    restaurant: restaurantSlug.trim(),
                    menuItem: menuItemId.trim(),
                    stepsCount: validation.data.steps.length,
                    overwrite: overwriteSteps,
                    timestamp: new Date().toLocaleString(),
                    firebaseUpdate: true
                }
            });

            // Auto-refresh the retrieved menu item if it's the same one
            if (retrievedMenuItem && retrievedMenuItem.id === menuItemId.trim()) {
                setTimeout(() => {
                    handleRetrieveMenuItem();
                }, 1000);
            }

        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour Firebase:', error);
            setResult({
                type: 'error',
                message: `❌ Erreur lors de l'application de la configuration: ${error.message}`
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleJsonPaste = (e) => {
        const text = e.target.value;
        setStepsJson(text);

        // Auto-format JSON après un délai
        setTimeout(() => {
            try {
                const parsed = JSON.parse(text);
                setStepsJson(JSON.stringify(parsed, null, 2));
            } catch (error) {
                // Garder l'original si ce n'est pas un JSON valide
            }
        }, 500);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    const renderMenuItemPreview = () => {
        if (!retrievedMenuItem) return null;

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-semibold text-lg">{retrievedMenuItem.nom}</h3>
                        <p className="text-sm text-gray-600">{retrievedMenuItem.description}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{retrievedMenuItem.prix}€</div>
                        <div className="flex justify-end gap-2 mt-2">
                            {retrievedMenuItem.isPopular && <Badge variant="secondary">Populaire</Badge>}
                            {retrievedMenuItem.isComposedMenu && <Badge>Menu Composé</Badge>}
                            <Badge variant={retrievedMenuItem.disponible ? "default" : "destructive"}>
                                {retrievedMenuItem.disponible ? "Disponible" : "Indisponible"}
                            </Badge>
                        </div>
                    </div>
                </div>

                {retrievedMenuItem.composedMenuConfig && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Configuration du Menu Composé</h4>
                            <p className="text-sm"><strong>Prix de base:</strong> {retrievedMenuItem.composedMenuConfig.basePrice}€</p>
                            <p className="text-sm"><strong>Nombre d'étapes:</strong> {retrievedMenuItem.composedMenuConfig.steps.length}</p>
                        </div>

                        <div className="space-y-3">
                            {retrievedMenuItem.composedMenuConfig.steps.map((step, index) => (
                                <div key={step.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h5 className="font-medium">{step.nom}</h5>
                                            <p className="text-xs text-gray-500">
                                                {step.required ? "Obligatoire" : "Optionnel"} •
                                                {step.minSelections === step.maxSelections
                                                    ? ` ${step.minSelections} sélection(s)`
                                                    : ` ${step.minSelections}-${step.maxSelections} sélections`
                                                }
                                            </p>
                                        </div>
                                        <Badge variant="outline">{step.options.length} options</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {step.options.map((option) => (
                                            <div key={option.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                                <span>{option.nom}</span>
                                                <span className="font-medium">
                          {option.priceAdjustment > 0 && '+'}
                                                    {option.priceAdjustment !== 0 && `${option.priceAdjustment}€`}
                                                    {option.priceAdjustment === 0 && 'Inclus'}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">🔧 Dev Portal</CardTitle>
                        <CardDescription>
                            Gestionnaire de configuration des étapes de menu
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Code d'accès</label>
                            <Input
                                type="password"
                                placeholder="Entrez le code d'accès"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                        </div>
                        <Button onClick={handleLogin} className="w-full">
                            Accéder au portail
                        </Button>
                        {result && result.type === 'error' && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>{result.message}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">🔧 Dev Portal</CardTitle>
                                    <CardDescription>Gestionnaire de configuration des étapes de menu</CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Déconnexion
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Configuration */}
                    <div className="space-y-6">
                        {/* Configuration du restaurant */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Database className="w-5 h-5" />
                                    <span>Configuration</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Slug du restaurant *</label>
                                    <Input
                                        placeholder="ex: restaurant-libanais-paris"
                                        value={restaurantSlug}
                                        onChange={(e) => setRestaurantSlug(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">ID du menu item *</label>
                                    <Input
                                        placeholder="ex: menu-dejeuner-libanais"
                                        value={menuItemId}
                                        onChange={(e) => setMenuItemId(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="overwrite"
                                        checked={overwriteSteps}
                                        onCheckedChange={setOverwriteSteps}
                                    />
                                    <label htmlFor="overwrite" className="text-sm font-medium">
                                        Écraser les étapes existantes
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Retrieve Menu Item */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Search className="w-5 h-5" />
                                    <span>Récupérer Menu Item</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={handleRetrieveMenuItem}
                                    disabled={isRetrieving}
                                    className="w-full"
                                >
                                    {isRetrieving ? (
                                        <>⏳ Récupération...</>
                                    ) : (
                                        <>🔍 Récupérer Menu Item</>
                                    )}
                                </Button>
                                {retrieveError && (
                                    <Alert variant="destructive" className="mt-4">
                                        <XCircle className="h-4 w-4" />
                                        <AlertDescription>{retrieveError}</AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        {/* Configuration JSON */}
                        <Card>
                            <CardHeader>
                                <CardTitle>📋 Configuration JSON des étapes</CardTitle>
                                <CardDescription>
                                    Collez votre configuration JSON des étapes ici
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">JSON des étapes *</label>
                                    <Textarea
                                        placeholder="Collez votre JSON ici..."
                                        value={stepsJson}
                                        onChange={(e) => handleJsonPaste(e)}
                                        className="min-h-[200px] font-mono text-sm"
                                    />
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                >
                                    {isLoading ? (
                                        <>⏳ Configuration en cours...</>
                                    ) : (
                                        <>🚀 Appliquer la configuration</>
                                    )}
                                </Button>

                                {/* Result */}
                                {result && (
                                    <div className="mt-4">
                                        {result.type === 'success' && (
                                            <Alert className="border-green-200 bg-green-50">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <AlertDescription className="text-green-800">
                                                    <div className="space-y-2">
                                                        <div>{result.message}</div>
                                                        {result.details && (
                                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                                <Badge variant="secondary">Restaurant: {result.details.restaurant}</Badge>
                                                                <Badge variant="secondary">Menu: {result.details.menuItem}</Badge>
                                                                <Badge variant="secondary">Étapes: {result.details.stepsCount}</Badge>
                                                                <Badge variant="secondary">Écrasement: {result.details.overwrite ? 'Oui' : 'Non'}</Badge>
                                                                {result.details.firebaseUpdate && (
                                                                    <Badge className="bg-green-600">✅ Firebase</Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="text-xs mt-2 text-green-600">
                                                            Consultez la console du navigateur pour le payload complet.
                                                        </div>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {result.type === 'error' && (
                                            <Alert variant="destructive">
                                                <XCircle className="h-4 w-4" />
                                                <AlertDescription>{result.message}</AlertDescription>
                                            </Alert>
                                        )}

                                        {result.type === 'loading' && (
                                            <Alert className="border-blue-200 bg-blue-50">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                                <AlertDescription className="text-blue-800">{result.message}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Preview & Example */}
                    <div className="space-y-6">
                        {/* Menu Item Preview/JSON */}
                        {retrievedMenuItem ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Eye className="w-5 h-5" />
                                            <span>Menu Item Récupéré</span>
                                        </div>
                                        <Badge className="bg-orange-600">🔥 Firebase Live</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="preview" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="preview" className="flex items-center space-x-2">
                                                <Eye className="w-4 h-4" />
                                                <span>Aperçu</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="json" className="flex items-center space-x-2">
                                                <Code2 className="w-4 h-4" />
                                                <span>JSON</span>
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="preview" className="mt-4">
                                            {renderMenuItemPreview()}
                                        </TabsContent>
                                        <TabsContent value="json" className="mt-4">
                                            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                                                <pre className="text-xs">{JSON.stringify(retrievedMenuItem, null, 2)}</pre>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        ) : (
                            /* Exemple JSON */
                            <Card>
                                <CardHeader>
                                    <CardTitle>💡 Format d'exemple</CardTitle>
                                    <CardDescription>
                                        Structure JSON attendue pour les étapes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                                        <pre className="text-xs">{exampleJson}</pre>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DevPage;