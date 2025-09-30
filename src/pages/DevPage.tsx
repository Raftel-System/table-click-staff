import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, LogOut, Zap, CheckCircle, XCircle, Search, Eye, Code2, UtensilsCrossed, MapPin, Plus, Pencil, Trash2, Table } from "lucide-react";

// Composant: Gestion des Menus Composés
const ComposedMenuManager = ({ restaurantSlug }) => {
    const [menuItemId, setMenuItemId] = useState('');
    const [stepsJson, setStepsJson] = useState('');
    const [overwriteSteps, setOverwriteSteps] = useState(false);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retrievedMenuItem, setRetrievedMenuItem] = useState(null);
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
        } catch (error) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
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

            const updateData = {
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
        } catch (error) {
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
                                        {retrievedMenuItem.composedMenuConfig.steps.map((step) => (
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

// Composant: Gestion des Zones
const ZoneManager = ({ restaurantSlug }) => {
    const [zones, setZones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [editingZone, setEditingZone] = useState(null);
    const [newZone, setNewZone] = useState({
        nom: '',
        active: true,
        order: 1,
        serviceType: 'TAKEAWAY'
    });

    const fetchZones = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const zonesRef = collection(db, `restaurants/${restaurantSlug}/zones`);
            const q = query(zonesRef, orderBy('order'));
            const snapshot = await getDocs(q);

            const zonesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setZones(zonesData);
            setResult({ type: 'success', message: `✅ ${zonesData.length} zone(s) récupérée(s)` });
        } catch (error) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddZone = async () => {
        if (!newZone.nom.trim()) {
            setResult({ type: 'error', message: '❌ Le nom de la zone est requis.' });
            return;
        }

        setIsLoading(true);
        try {
            const { collection, addDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const zonesRef = collection(db, `restaurants/${restaurantSlug}/zones`);
            await addDoc(zonesRef, {
                nom: newZone.nom.trim(),
                active: newZone.active,
                order: parseInt(newZone.order) || 1,
                serviceType: newZone.serviceType
            });

            setNewZone({ nom: '', active: true, order: 1, serviceType: 'TAKEAWAY' });
            setResult({ type: 'success', message: '✅ Zone ajoutée avec succès!' });
            await fetchZones();
        } catch (error) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateZone = async () => {
        if (!editingZone || !editingZone.nom.trim()) {
            setResult({ type: 'error', message: '❌ Le nom de la zone est requis.' });
            return;
        }

        setIsLoading(true);
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const zoneRef = doc(db, `restaurants/${restaurantSlug}/zones/${editingZone.id}`);
            await updateDoc(zoneRef, {
                nom: editingZone.nom.trim(),
                active: editingZone.active,
                order: parseInt(editingZone.order) || 1,
                serviceType: editingZone.serviceType
            });

            setEditingZone(null);
            setResult({ type: 'success', message: '✅ Zone mise à jour avec succès!' });
            await fetchZones();
        } catch (error) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteZone = async (zoneId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;

        setIsLoading(true);
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const zoneRef = doc(db, `restaurants/${restaurantSlug}/zones/${zoneId}`);
            await deleteDoc(zoneRef);

            setResult({ type: 'success', message: '✅ Zone supprimée avec succès!' });
            await fetchZones();
        } catch (error) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <MapPin className="w-5 h-5" />
                            <span>Gestion des Zones</span>
                        </div>
                        <Button onClick={fetchZones} disabled={isLoading} variant="outline" size="sm">
                            {isLoading ? '⏳' : '🔄'} Actualiser
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 bg-blue-50">
                        <h4 className="font-semibold mb-3 flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter une nouvelle zone
                        </h4>
                        <div className="space-y-3">
                            <Input
                                placeholder="Nom de la zone (ex: Emporter) *"
                                value={newZone.nom}
                                onChange={(e) => setNewZone({ ...newZone, nom: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    type="number"
                                    placeholder="Order *"
                                    value={newZone.order}
                                    onChange={(e) => setNewZone({ ...newZone, order: e.target.value })}
                                />
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newZone.serviceType}
                                    onChange={(e) => setNewZone({ ...newZone, serviceType: e.target.value })}
                                >
                                    <option value="TAKEAWAY">TAKEAWAY</option>
                                    <option value="DINE_IN">DINE_IN</option>
                                    <option value="DELIVERY">DELIVERY</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="new-active"
                                        checked={newZone.active}
                                        onCheckedChange={(checked) => setNewZone({ ...newZone, active: checked })}
                                    />
                                    <label htmlFor="new-active" className="text-sm">Active</label>
                                </div>
                                <Button onClick={handleAddZone} disabled={isLoading} size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>

                    {result && (
                        <Alert variant={result.type === 'error' ? 'destructive' : 'default'}
                               className={result.type === 'success' ? 'border-green-200 bg-green-50' : ''}>
                            {result.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
                            <AlertDescription className={result.type === 'success' ? 'text-green-800' : ''}>
                                {result.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        {zones.length === 0 && !isLoading && (
                            <p className="text-center text-gray-500 py-8">Aucune zone trouvée. Cliquez sur "Actualiser" ou ajoutez-en une.</p>
                        )}

                        {zones.map((zone) => (
                            <div key={zone.id} className="border rounded-lg p-4">
                                {editingZone?.id === zone.id ? (
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Nom de la zone"
                                            value={editingZone.nom}
                                            onChange={(e) => setEditingZone({ ...editingZone, nom: e.target.value })}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                type="number"
                                                placeholder="Order"
                                                value={editingZone.order}
                                                onChange={(e) => setEditingZone({ ...editingZone, order: e.target.value })}
                                            />
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={editingZone.serviceType}
                                                onChange={(e) => setEditingZone({ ...editingZone, serviceType: e.target.value })}
                                            >
                                                <option value="TAKEAWAY">TAKEAWAY</option>
                                                <option value="DINE_IN">DINE_IN</option>
                                                <option value="DELIVERY">DELIVERY</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    checked={editingZone.active}
                                                    onCheckedChange={(checked) => setEditingZone({ ...editingZone, active: checked })}
                                                />
                                                <label className="text-sm">Active</label>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button onClick={() => setEditingZone(null)} variant="outline" size="sm">
                                                    Annuler
                                                </Button>
                                                <Button onClick={handleUpdateZone} size="sm">
                                                    Enregistrer
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h4 className="font-semibold">{zone.nom}</h4>
                                                <Badge variant={zone.active ? 'default' : 'secondary'}>
                                                    {zone.active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <Badge variant="outline">{zone.serviceType}</Badge>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p><strong>Order:</strong> {zone.order}</p>
                                                <p className="text-xs text-gray-400">ID: {zone.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={() => setEditingZone(zone)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteZone(zone.id)}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Composant: Gestion des Tables
const TableManager = ({ restaurantSlug }) => {
    const [tables, setTables] = useState([]);
    const [zones, setZones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [editingTable, setEditingTable] = useState(null);
    const [newTable, setNewTable] = useState({
        numero: '',
        zoneId: '',
        capacite: 4,
        active: true
    });

    const fetchZones = async () => {
        try {
            const { collection, getDocs } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const zonesRef = collection(db, `restaurants/${restaurantSlug}/zones`);
            const snapshot = await getDocs(zonesRef);

            const zonesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setZones(zonesData);
        } catch (error) {
            console.error('Erreur lors de la récupération des zones:', error);
        }
    };

    const fetchTables = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            await fetchZones();

            const tablesRef = collection(db, `restaurants/${restaurantSlug}/tables`);
            const q = query(tablesRef, orderBy('numero'));
            const snapshot = await getDocs(q);

            const tablesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setTables(tablesData);
            setResult({ type: 'success', message: `✅ ${tablesData.length} table(s) récupérée(s)` });
        } catch (error) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTable = async () => {
        if (!newTable.numero.trim() || !newTable.zoneId) {
            setResult({ type: 'error', message: '❌ Le numéro et la zone sont requis.' });
            return;
        }

        setIsLoading(true);
        try {
            const { collection, addDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const tablesRef = collection(db, `restaurants/${restaurantSlug}/tables`);
            await addDoc(tablesRef, {
                numero: newTable.numero.trim(),
                zoneId: newTable.zoneId,
                capacite: parseInt(newTable.capacite) || 4,
                active: newTable.active,
                statut: 'LIBRE' // Toujours LIBRE à la création
            });

            setNewTable({ numero: '', zoneId: '', capacite: 4, active: true });
            setResult({ type: 'success', message: '✅ Table ajoutée avec succès!' });
            await fetchTables();
        } catch (error) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTable = async () => {
        if (!editingTable || !editingTable.numero.trim() || !editingTable.zoneId) {
            setResult({ type: 'error', message: '❌ Le numéro et la zone sont requis.' });
            return;
        }

        setIsLoading(true);
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const tableRef = doc(db, `restaurants/${restaurantSlug}/tables/${editingTable.id}`);
            await updateDoc(tableRef, {
                numero: editingTable.numero.trim(),
                zoneId: editingTable.zoneId,
                capacite: parseInt(editingTable.capacite) || 4,
                active: editingTable.active
                // statut n'est PAS modifié ici, reste toujours LIBRE
            });

            setEditingTable(null);
            setResult({ type: 'success', message: '✅ Table mise à jour avec succès!' });
            await fetchTables();
        } catch (error) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTable = async (tableId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) return;

        setIsLoading(true);
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const tableRef = doc(db, `restaurants/${restaurantSlug}/tables/${tableId}`);
            await deleteDoc(tableRef);

            setResult({ type: 'success', message: '✅ Table supprimée avec succès!' });
            await fetchTables();
        } catch (error) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const getZoneName = (zoneId) => {
        const zone = zones.find(z => z.id === zoneId);
        return zone ? zone.nom : 'Zone inconnue';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Table className="w-5 h-5" />
                            <span>Gestion des Tables</span>
                        </div>
                        <Button onClick={fetchTables} disabled={isLoading} variant="outline" size="sm">
                            {isLoading ? '⏳' : '🔄'} Actualiser
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 bg-blue-50">
                        <h4 className="font-semibold mb-3 flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter une nouvelle table
                        </h4>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    placeholder="Numéro de table *"
                                    value={newTable.numero}
                                    onChange={(e) => setNewTable({ ...newTable, numero: e.target.value })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Capacité *"
                                    value={newTable.capacite}
                                    onChange={(e) => setNewTable({ ...newTable, capacite: e.target.value })}
                                />
                            </div>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newTable.zoneId}
                                onChange={(e) => setNewTable({ ...newTable, zoneId: e.target.value })}
                            >
                                <option value="">Sélectionnez une zone *</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>
                                        {zone.nom}
                                    </option>
                                ))}
                            </select>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="new-active"
                                        checked={newTable.active}
                                        onCheckedChange={(checked) => setNewTable({ ...newTable, active: checked })}
                                    />
                                    <label htmlFor="new-active" className="text-sm">Active</label>
                                </div>
                                <Button onClick={handleAddTable} disabled={isLoading} size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>

                    {result && (
                        <Alert variant={result.type === 'error' ? 'destructive' : 'default'}
                               className={result.type === 'success' ? 'border-green-200 bg-green-50' : ''}>
                            {result.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
                            <AlertDescription className={result.type === 'success' ? 'text-green-800' : ''}>
                                {result.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        {tables.length === 0 && !isLoading && (
                            <p className="text-center text-gray-500 py-8">Aucune table trouvée. Cliquez sur "Actualiser" ou ajoutez-en une.</p>
                        )}

                        {tables.map((table) => (
                            <div key={table.id} className="border rounded-lg p-4">
                                {editingTable?.id === table.id ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                placeholder="Numéro de table"
                                                value={editingTable.numero}
                                                onChange={(e) => setEditingTable({ ...editingTable, numero: e.target.value })}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Capacité"
                                                value={editingTable.capacite}
                                                onChange={(e) => setEditingTable({ ...editingTable, capacite: e.target.value })}
                                            />
                                        </div>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={editingTable.zoneId}
                                            onChange={(e) => setEditingTable({ ...editingTable, zoneId: e.target.value })}
                                        >
                                            <option value="">Sélectionnez une zone</option>
                                            {zones.map((zone) => (
                                                <option key={zone.id} value={zone.id}>
                                                    {zone.nom}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    checked={editingTable.active}
                                                    onCheckedChange={(checked) => setEditingTable({ ...editingTable, active: checked })}
                                                />
                                                <label className="text-sm">Active</label>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button onClick={() => setEditingTable(null)} variant="outline" size="sm">
                                                    Annuler
                                                </Button>
                                                <Button onClick={handleUpdateTable} size="sm">
                                                    Enregistrer
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h4 className="font-semibold text-lg">Table {table.numero}</h4>
                                                <Badge variant={table.active ? 'default' : 'secondary'}>
                                                    {table.active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    {table.statut || 'LIBRE'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p><strong>Zone:</strong> {getZoneName(table.zoneId)}</p>
                                                <p><strong>Capacité:</strong> {table.capacite} personnes</p>
                                                <p className="text-xs text-gray-400">ID: {table.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={() => setEditingTable(table)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteTable(table.id)}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Composant Principal
const DevPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [restaurantSlug, setRestaurantSlug] = useState('');
    const [restaurantData, setRestaurantData] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [activeTab, setActiveTab] = useState('menus');
    const [loginError, setLoginError] = useState('');

    const ACCESS_CODE = 'dev123';

    const handleLogin = () => {
        if (accessCode === ACCESS_CODE) {
            setIsAuthenticated(true);
            setAccessCode('');
            setLoginError('');
        } else {
            setLoginError('❌ Code d\'accès invalide.');
            setAccessCode('');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setRestaurantSlug('');
        setRestaurantData(null);
        setActiveTab('menus');
    };

    const handleVerifyRestaurant = async () => {
        if (!restaurantSlug.trim()) return;

        setIsVerifying(true);
        setRestaurantData(null);

        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // Chercher dans /restaurants/{slug}/settings/config
            const configRef = doc(db, `restaurants/${restaurantSlug.trim()}/settings/config`);
            const configSnap = await getDoc(configRef);

            console.log('Config snap exists:', configSnap.exists());
            console.log('Config data:', configSnap.data());

            if (configSnap.exists()) {
                const data = {
                    id: restaurantSlug.trim(),
                    ...configSnap.data()
                };
                console.log('Setting restaurant config data:', data);
                setRestaurantData(data);
            } else {
                console.log('Restaurant config not found');
                setRestaurantData({ notFound: true });
            }
        } catch (error) {
            console.error('Erreur:', error);
            setRestaurantData({ error: error.message });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResetRestaurant = () => {
        setRestaurantSlug('');
        setRestaurantData(null);
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
                        <CardDescription>Gestionnaire CRUD - Menus, Zones & Tables</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Code d'accès</label>
                            <Input
                                type="password"
                                placeholder="Entrez le code d'accès"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                        <Button onClick={handleLogin} className="w-full">
                            Accéder au portail
                        </Button>
                        {loginError && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>{loginError}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">🔧 Dev Portal</CardTitle>
                                    <CardDescription>Gestionnaire CRUD - Menus, Zones & Tables</CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Déconnexion
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Restaurant Search */}
                {!restaurantData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Search className="w-5 h-5" />
                                <span>Rechercher un Restaurant</span>
                            </CardTitle>
                            <CardDescription>
                                Entrez le slug du restaurant pour accéder aux fonctionnalités CRUD
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="ex: talya-bercy"
                                    value={restaurantSlug}
                                    onChange={(e) => setRestaurantSlug(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyRestaurant()}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleVerifyRestaurant}
                                    disabled={isVerifying || !restaurantSlug.trim()}
                                    size="lg"
                                >
                                    {isVerifying ? '⏳' : '🔍'}
                                </Button>
                            </div>

                            <div className="text-center py-8 text-gray-500">
                                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Recherchez un restaurant</p>
                                <p className="text-sm mt-2">Entrez le slug et cliquez sur rechercher</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Restaurant Not Found */}
                {restaurantData?.notFound && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Search className="w-5 h-5" />
                                <span>Rechercher un Restaurant</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="ex: talya-bercy"
                                    value={restaurantSlug}
                                    onChange={(e) => {
                                        setRestaurantSlug(e.target.value);
                                        setRestaurantData(null);
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyRestaurant()}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleVerifyRestaurant}
                                    disabled={isVerifying || !restaurantSlug.trim()}
                                    size="lg"
                                >
                                    {isVerifying ? '⏳' : '🔍'}
                                </Button>
                            </div>

                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    ❌ Restaurant "{restaurantSlug}" non trouvé dans Firebase.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}

                {/* Restaurant Error */}
                {restaurantData?.error && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Search className="w-5 h-5" />
                                <span>Rechercher un Restaurant</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="ex: talya-bercy"
                                    value={restaurantSlug}
                                    onChange={(e) => {
                                        setRestaurantSlug(e.target.value);
                                        setRestaurantData(null);
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyRestaurant()}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleVerifyRestaurant}
                                    disabled={isVerifying || !restaurantSlug.trim()}
                                    size="lg"
                                >
                                    {isVerifying ? '⏳' : '🔍'}
                                </Button>
                            </div>

                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    ❌ Erreur: {restaurantData.error}
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}

                {/* Restaurant Found - CRUD Tabs */}
                {restaurantData && !restaurantData.notFound && !restaurantData.error && (
                    <>
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-green-900">
                                                Restaurant trouvé : {restaurantData.nom || restaurantSlug}
                                            </h3>
                                            <p className="text-sm text-green-700">
                                                ID: {restaurantData.id}
                                            </p>
                                        </div>
                                    </div>
                                    <Button onClick={handleResetRestaurant} variant="outline" size="sm">
                                        Changer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="menus" className="flex items-center space-x-2">
                                            <UtensilsCrossed className="w-4 h-4" />
                                            <span>Menus Composés</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="zones" className="flex items-center space-x-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>Zones</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="tables" className="flex items-center space-x-2">
                                            <Table className="w-4 h-4" />
                                            <span>Tables</span>
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="menus" className="mt-6">
                                        <ComposedMenuManager restaurantSlug={restaurantSlug} />
                                    </TabsContent>
                                    <TabsContent value="zones" className="mt-6">
                                        <ZoneManager restaurantSlug={restaurantSlug} />
                                    </TabsContent>
                                    <TabsContent value="tables" className="mt-6">
                                        <TableManager restaurantSlug={restaurantSlug} />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};

export default DevPage;