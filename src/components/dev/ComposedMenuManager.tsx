import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, UtensilsCrossed } from "lucide-react";

interface ComposedMenuManagerProps {
    restaurantSlug: string;
}

const ComposedMenuManager: React.FC<ComposedMenuManagerProps> = ({ restaurantSlug }) => {
    const [menuItemId, setMenuItemId] = useState('');
    const [stepsJson, setStepsJson] = useState('');
    const [overwriteSteps, setOverwriteSteps] = useState(false);
    const [result, setResult] = useState<{ type: string; message: string; details?: any } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retrievedMenuItem, setRetrievedMenuItem] = useState<any>(null);
    const [isRetrieving, setIsRetrieving] = useState(false);

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
        { "id": "sand-chboeuf", "nom": "Chawarma bœuf", "priceAdjustment": 0 }
      ]
    }
  ]
}`;

    const handleRetrieveMenuItem = async () => {
        if (!menuItemId.trim()) {
            setResult({ type: 'error', message: '❌ L\'ID du menu item est requis.' });
            return;
        }

        setIsRetrieving(true);
        setResult(null);
        setRetrievedMenuItem(null);

        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const menuItemRef = doc(db, `restaurants/${restaurantSlug}/menuItems/${menuItemId.trim()}`);
            const menuItemSnap = await getDoc(menuItemRef);

            if (menuItemSnap.exists()) {
                const menuItemData = { id: menuItemSnap.id, ...menuItemSnap.data() };
                setRetrievedMenuItem(menuItemData);
                setResult({ type: 'success', message: '✅ Menu item récupéré avec succès!' });
            } else {
                setResult({ type: 'error', message: `❌ Menu item "${menuItemId.trim()}" non trouvé.` });
            }
        } catch (error: any) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsRetrieving(false);
        }
    };

    const validateStepsJson = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.steps || !Array.isArray(parsed.steps)) {
                return { isValid: false, error: 'Le JSON doit contenir un tableau "steps".' };
            }
            for (let i = 0; i < parsed.steps.length; i++) {
                const step = parsed.steps[i];
                if (!step.id || !step.nom || !step.options) {
                    return { isValid: false, error: `L'étape ${i + 1} manque de champs requis.` };
                }
            }
            return { isValid: true, data: parsed };
        } catch (error) {
            return { isValid: false, error: 'Format JSON invalide.' };
        }
    };

    const handleSubmit = async () => {
        if (!menuItemId.trim() || !stepsJson.trim()) {
            setResult({ type: 'error', message: '❌ Tous les champs sont requis.' });
            return;
        }

        const validation = validateStepsJson(stepsJson);
        if (!validation.isValid) {
            setResult({ type: 'error', message: `❌ ${validation.error}` });
            return;
        }

        setIsLoading(true);
        setResult({ type: 'loading', message: '⏳ Configuration en cours...' });

        try {
            const { doc, updateDoc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const menuItemRef = doc(db, `restaurants/${restaurantSlug}/menuItems/${menuItemId.trim()}`);
            const menuItemSnap = await getDoc(menuItemRef);

            if (!menuItemSnap.exists()) {
                setResult({ type: 'error', message: `❌ Menu item "${menuItemId.trim()}" non trouvé.` });
                setIsLoading(false);
                return;
            }

            const updateData: any = {
                isComposedMenu: true,
                'composedMenuConfig.steps': validation.data.steps
            };

            if (overwriteSteps) {
                const currentData = menuItemSnap.data();
                updateData.composedMenuConfig = {
                    basePrice: currentData.composedMenuConfig?.basePrice || currentData.prix || 0,
                    steps: validation.data.steps
                };
            }

            await updateDoc(menuItemRef, updateData);

            setResult({
                type: 'success',
                message: '✅ Configuration appliquée avec succès!',
                details: {
                    menuItem: menuItemId.trim(),
                    stepsCount: validation.data.steps.length,
                    overwrite: overwriteSteps
                }
            });

            if (retrievedMenuItem && retrievedMenuItem.id === menuItemId.trim()) {
                setTimeout(handleRetrieveMenuItem, 1000);
            }
        } catch (error: any) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <UtensilsCrossed className="w-5 h-5" />
                        <span>Configuration du Menu Item</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">ID du menu item *</label>
                        <div className="flex space-x-2">
                            <Input
                                placeholder="ex: menu-dejeuner-libanais"
                                value={menuItemId}
                                onChange={(e) => setMenuItemId(e.target.value)}
                            />
                            <Button onClick={handleRetrieveMenuItem} disabled={isRetrieving} variant="outline">
                                {isRetrieving ? '⏳' : '🔍'}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">JSON des étapes *</label>
                        <Textarea
                            placeholder="Collez votre JSON ici..."
                            value={stepsJson}
                            onChange={(e) => setStepsJson(e.target.value)}
                            className="min-h-[200px] font-mono text-sm"
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

                    <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
                        {isLoading ? '⏳ Configuration...' : '🚀 Appliquer la configuration'}
                    </Button>

                    {result && (
                        <Alert variant={result.type === 'error' ? 'destructive' : 'default'}
                               className={result.type === 'success' ? 'border-green-200 bg-green-50' : ''}>
                            {result.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
                            <AlertDescription className={result.type === 'success' ? 'text-green-800' : ''}>
                                {result.message}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {retrievedMenuItem ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Menu Item Récupéré</span>
                            <Badge className="bg-orange-600">🔥 Live</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="preview">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="preview">Aperçu</TabsTrigger>
                                <TabsTrigger value="json">JSON</TabsTrigger>
                            </TabsList>
                            <TabsContent value="preview" className="mt-4 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{retrievedMenuItem.nom}</h3>
                                    <p className="text-sm text-gray-600">{retrievedMenuItem.description}</p>
                                    <div className="text-2xl font-bold mt-2">{retrievedMenuItem.prix}€</div>
                                </div>
                                {retrievedMenuItem.composedMenuConfig && (
                                    <div className="space-y-3">
                                        {retrievedMenuItem.composedMenuConfig.steps.map((step: any) => (
                                            <div key={step.id} className="border rounded-lg p-3">
                                                <h5 className="font-medium">{step.nom}</h5>
                                                <Badge variant="outline">{step.options.length} options</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                <Card>
                    <CardHeader>
                        <CardTitle>💡 Format d'exemple</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                            <pre className="text-xs">{exampleJson}</pre>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ComposedMenuManager;