import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";

interface ZoneManagerProps {
    restaurantSlug: string;
}

interface Zone {
    id: string;
    nom: string;
    active: boolean;
    order: number;
    serviceType: string;
}

const ZoneManager: React.FC<ZoneManagerProps> = ({ restaurantSlug }) => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ type: string; message: string } | null>(null);
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
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
            })) as Zone[];

            setZones(zonesData);
            setResult({ type: 'success', message: `✅ ${zonesData.length} zone(s) récupérée(s)` });
        } catch (error: any) {
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
                order: parseInt(String(newZone.order)) || 1,
                serviceType: newZone.serviceType
            });

            setNewZone({ nom: '', active: true, order: 1, serviceType: 'TAKEAWAY' });
            setResult({ type: 'success', message: '✅ Zone ajoutée avec succès!' });
            await fetchZones();
        } catch (error: any) {
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
                order: parseInt(String(editingZone.order)) || 1,
                serviceType: editingZone.serviceType
            });

            setEditingZone(null);
            setResult({ type: 'success', message: '✅ Zone mise à jour avec succès!' });
            await fetchZones();
        } catch (error: any) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteZone = async (zoneId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;

        setIsLoading(true);
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const zoneRef = doc(db, `restaurants/${restaurantSlug}/zones/${zoneId}`);
            await deleteDoc(zoneRef);

            setResult({ type: 'success', message: '✅ Zone supprimée avec succès!' });
            await fetchZones();
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
                                    onChange={(e) => setNewZone({ ...newZone, order: Number(e.target.value) })}
                                />
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newZone.serviceType}
                                    onChange={(e) => setNewZone({ ...newZone, serviceType: e.target.value })}
                                >
                                    <option value="TAKEAWAY">TAKEAWAY</option>
                                    <option value="DINING">DINING</option>
                                    <option value="DELIVERY">DELIVERY</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="new-active"
                                        checked={newZone.active}
                                        onCheckedChange={(checked) => setNewZone({ ...newZone, active: !!checked })}
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
                                                onChange={(e) => setEditingZone({ ...editingZone, order: Number(e.target.value) })}
                                            />
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={editingZone.serviceType}
                                                onChange={(e) => setEditingZone({ ...editingZone, serviceType: e.target.value })}
                                            >
                                                <option value="TAKEAWAY">TAKEAWAY</option>
                                                <option value="DINING">DINING</option>
                                                <option value="DELIVERY">DELIVERY</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    checked={editingZone.active}
                                                    onCheckedChange={(checked) => setEditingZone({ ...editingZone, active: !!checked })}
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

export default ZoneManager;