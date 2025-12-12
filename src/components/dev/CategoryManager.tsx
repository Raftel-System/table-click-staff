import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X, FolderOpen, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MenuCategory {
    id: string;
    nom: string;
    ordre?: number;
    active: boolean;
}

interface CategoryManagerProps {
    restaurantSlug: string;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ restaurantSlug }) => {
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
    }, [restaurantSlug]);

    const loadCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const categoriesRef = collection(db, `restaurants/${restaurantSlug}/menuCategories`);
            const snapshot = await getDocs(categoriesRef);
            const cats: MenuCategory[] = [];
            snapshot.forEach((doc) => {
                cats.push({ id: doc.id, ...doc.data() } as MenuCategory);
            });
            console.log('Catégories chargées:', cats);
            setCategories(cats.sort((a, b) => (a.ordre || 999) - (b.ordre || 999)));
        } catch (err: any) {
            setError(`Erreur de chargement: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const validateJson = (jsonString: string): { valid: boolean; data?: any; error?: string } => {
        try {
            const parsed = JSON.parse(jsonString);

            // Validation des champs requis
            if (!parsed.nom || typeof parsed.nom !== 'string') {
                return { valid: false, error: 'Le champ "nom" est requis et doit être une chaîne' };
            }
            if (parsed.active === undefined || typeof parsed.active !== 'boolean') {
                return { valid: false, error: 'Le champ "active" est requis et doit être un booléen' };
            }
            if (parsed.ordre !== undefined && typeof parsed.ordre !== 'number') {
                return { valid: false, error: 'Le champ "ordre" doit être un nombre' };
            }

            return { valid: true, data: parsed };
        } catch (e: any) {
            return { valid: false, error: `JSON invalide: ${e.message}` };
        }
    };

    const handleAddNew = () => {
        const template = {
            nom: "Nouvelle catégorie",
            active: true,
            ordre: categories.length + 1
        };
        setJsonInput(JSON.stringify(template, null, 2));
        setIsAddingNew(true);
        setEditingId(null);
        setJsonError(null);
        setError(null);
        setSuccess(null);
    };

    const handleEdit = (category: MenuCategory) => {
        const editData = {
            nom: category.nom,
            active: category.active,
            ordre: category.ordre || 1
        };
        setJsonInput(JSON.stringify(editData, null, 2));
        setEditingId(category.id);
        setIsAddingNew(false);
        setJsonError(null);
        setError(null);
        setSuccess(null);
    };

    const handleSave = async () => {
        setJsonError(null);
        setError(null);
        setSuccess(null);

        const validation = validateJson(jsonInput);
        if (!validation.valid) {
            setJsonError(validation.error!);
            return;
        }

        try {
            const data = validation.data;

            if (isAddingNew) {
                // Créer une nouvelle catégorie
                const newId = data.nom.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const categoryRef = doc(db, `restaurants/${restaurantSlug}/menuCategories`, newId);
                await setDoc(categoryRef, {
                    ...data,
                    id: newId
                });
                setSuccess(`✅ Catégorie "${data.nom}" créée avec succès`);
            } else if (editingId) {
                // Modifier une catégorie existante
                const categoryRef = doc(db, `restaurants/${restaurantSlug}/menuCategories`, editingId);
                await setDoc(categoryRef, data, { merge: true });
                setSuccess(`✅ Catégorie "${data.nom}" modifiée avec succès`);
            }

            await loadCategories();
            handleCancel();
        } catch (err: any) {
            setError(`❌ Erreur: ${err.message}`);
        }
    };

    const handleDelete = async (id: string, nom: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${nom}" ?\n\nAttention : Vérifiez qu'aucun item de menu n'utilise cette catégorie !`)) return;

        try {
            const categoryRef = doc(db, `restaurants/${restaurantSlug}/menuCategories`, id);
            await deleteDoc(categoryRef);
            setSuccess(`✅ Catégorie "${nom}" supprimée`);
            await loadCategories();
        } catch (err: any) {
            setError(`❌ Erreur de suppression: ${err.message}`);
        }
    };

    const handleCancel = () => {
        setIsAddingNew(false);
        setEditingId(null);
        setJsonInput('');
        setJsonError(null);
    };

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des catégories...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center space-x-2">
                        <FolderOpen className="w-6 h-6" />
                        <span>Catégories de Menu</span>
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {categories.length} catégorie(s)
                    </p>
                </div>
                {!isAddingNew && !editingId && (
                    <div className="flex space-x-2">
                        <Button
                            onClick={loadCategories}
                            variant="outline"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualiser
                        </Button>
                        <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter une catégorie
                        </Button>
                    </div>
                )}
            </div>

            {/* Alerts */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}

            {/* Add/Edit Form */}
            {(isAddingNew || editingId) && (
                <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{isAddingNew ? '➕ Ajouter une nouvelle catégorie' : '✏️ Modifier la catégorie'}</span>
                            <Button variant="ghost" size="sm" onClick={handleCancel}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Éditez le JSON ci-dessous. Champs requis: nom, active
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">JSON de la catégorie:</label>
                            <Textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="font-mono text-sm min-h-[200px]"
                                placeholder="Entrez le JSON..."
                            />
                            {jsonError && (
                                <p className="text-red-600 text-sm mt-2">❌ {jsonError}</p>
                            )}
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium mb-2">💡 Exemple de JSON:</p>
                            <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`{
  "nom": "Hors d'œuvre chaud",
  "active": true,
  "ordre": 3
}`}
                            </pre>
                        </div>

                        <div className="flex space-x-2">
                            <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
                                <Save className="w-4 h-4 mr-2" />
                                Sauvegarder
                            </Button>
                            <Button onClick={handleCancel} variant="outline" className="flex-1">
                                <X className="w-4 h-4 mr-2" />
                                Annuler
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Categories List */}
            {!isAddingNew && !editingId && (
                <div className="grid gap-4">
                    {categories.map((category) => (
                        <Card key={category.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-lg font-semibold">{category.nom}</h3>
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                Ordre: {category.ordre || 'N/A'}
                                            </span>
                                            {category.active ? (
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                                    ✅ Active
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                                    ❌ Inactive
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-2">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                ID: {category.id}
                                            </code>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(category)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(category.id, category.nom)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {categories.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center text-gray-500">
                                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Aucune catégorie trouvée</p>
                                <p className="text-sm mt-2">
                                    Ajoutez votre première catégorie de menu
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategoryManager;