import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, Plus, Pencil, Trash2, CheckCircle, XCircle, Filter } from "lucide-react";

interface TableManagerProps {
    restaurantSlug: string;
}

interface Zone {
    id: string;
    nom: string;
}

interface TableData {
    id: string;
    numero: string;
    zoneId: string;
    capacite: number;
    active: boolean;
    statut?: string;
    order?: number;
}

const TableManager: React.FC<TableManagerProps> = ({ restaurantSlug }) => {
    const [tables, setTables] = useState<TableData[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ type: string; message: string } | null>(null);
    const [editingTable, setEditingTable] = useState<TableData | null>(null);
    const [newTable, setNewTable] = useState({
        numero: '',
        zoneId: '',
        capacite: 4,
        active: true,
        order: 1
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
            })) as Zone[];

            setZones(zonesData);
        } catch (error) {
            console.error('Erreur lors de la récupération des zones:', error);
        }
    };

    const fetchTables = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const { collection, getDocs } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            await fetchZones();

            const tablesRef = collection(db, `restaurants/${restaurantSlug}/tables`);
            // On retire le orderBy pour éviter les erreurs si le champ n'existe pas
            const snapshot = await getDocs(tablesRef);

            const tablesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                order: doc.data().order || 999 // Valeur par défaut si order n'existe pas
            })) as TableData[];

            // Tri manuel par order
            tablesData.sort((a, b) => (a.order || 999) - (b.order || 999));

            setTables(tablesData);
            setResult({ type: 'success', message: `✅ ${tablesData.length} table(s) récupérée(s)` });
        } catch (error: any) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
            console.error('Erreur complète:', error);
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
                capacite: parseInt(String(newTable.capacite)) || 4,
                active: newTable.active,
                order: parseInt(String(newTable.order)) || 1,
                statut: 'LIBRE'
            });

            setNewTable({ numero: '', zoneId: '', capacite: 4, active: true, order: 1 });
            setResult({ type: 'success', message: '✅ Table ajoutée avec succès!' });
            await fetchTables();
        } catch (error: any) {
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
                capacite: parseInt(String(editingTable.capacite)) || 4,
                active: editingTable.active,
                order: parseInt(String(editingTable.order)) || 1
            });

            setEditingTable(null);
            setResult({ type: 'success', message: '✅ Table mise à jour avec succès!' });
            await fetchTables();
        } catch (error: any) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTable = async (tableId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) return;

        setIsLoading(true);
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const tableRef = doc(db, `restaurants/${restaurantSlug}/tables/${tableId}`);
            await deleteDoc(tableRef);

            setResult({ type: 'success', message: '✅ Table supprimée avec succès!' });
            await fetchTables();
        } catch (error: any) {
            setResult({ type: 'error', message: `❌ Erreur: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const getZoneName = (zoneId: string) => {
        const zone = zones.find(z => z.id === zoneId);
        return zone ? zone.nom : 'Zone inconnue';
    };

    const filteredTables = selectedZoneFilter === 'all'
        ? tables
        : tables.filter(table => table.zoneId === selectedZoneFilter);

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
                    {/* Filtre par zone */}
                    <div className="border rounded-lg p-4 bg-slate-50">
                        <div className="flex items-center space-x-2 mb-3">
                            <Filter className="w-4 h-4" />
                            <h4 className="font-semibold">Filtrer par zone</h4>
                        </div>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={selectedZoneFilter}
                            onChange={(e) => setSelectedZoneFilter(e.target.value)}
                        >
                            <option value="all">Toutes les zones ({tables.length})</option>
                            {zones.map((zone) => (
                                <option key={zone.id} value={zone.id}>
                                    {zone.nom} ({tables.filter(t => t.zoneId === zone.id).length})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Formulaire d'ajout */}
                    <div className="border rounded-lg p-4 bg-blue-50">
                        <h4 className="font-semibold mb-3 flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter une nouvelle table
                        </h4>
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <Input
                                    placeholder="Numéro de table *"
                                    value={newTable.numero}
                                    onChange={(e) => setNewTable({ ...newTable, numero: e.target.value })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Capacité *"
                                    value={newTable.capacite}
                                    onChange={(e) => setNewTable({ ...newTable, capacite: Number(e.target.value) })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Order *"
                                    value={newTable.order}
                                    onChange={(e) => setNewTable({ ...newTable, order: Number(e.target.value) })}
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
                                        onCheckedChange={(checked) => setNewTable({ ...newTable, active: !!checked })}
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

                    {/* Liste des tables filtrées */}
                    <div className="space-y-3">
                        {filteredTables.length === 0 && !isLoading && (
                            <p className="text-center text-gray-500 py-8">
                                {selectedZoneFilter === 'all'
                                    ? 'Aucune table trouvée. Cliquez sur "Actualiser" ou ajoutez-en une.'
                                    : 'Aucune table dans cette zone.'}
                            </p>
                        )}

                        {filteredTables.map((table) => (
                            <div key={table.id} className="border rounded-lg p-4">
                                {editingTable?.id === table.id ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-3">
                                            <Input
                                                placeholder="Numéro de table"
                                                value={editingTable.numero}
                                                onChange={(e) => setEditingTable({ ...editingTable, numero: e.target.value })}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Capacité"
                                                value={editingTable.capacite}
                                                onChange={(e) => setEditingTable({ ...editingTable, capacite: Number(e.target.value) })}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Order"
                                                value={editingTable.order || 1}
                                                onChange={(e) => setEditingTable({ ...editingTable, order: Number(e.target.value) })}
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
                                                    onCheckedChange={(checked) => setEditingTable({ ...editingTable, active: !!checked })}
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
                                                <p><strong>Order:</strong> {table.order || 'Non défini'}</p>
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

export default TableManager;