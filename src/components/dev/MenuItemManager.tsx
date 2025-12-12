import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X, UtensilsCrossed, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MenuItem {
    id: string;
    nom: string;
    description?: string;
    prix: number;
    categorieId: string;
    disponible: boolean;
    isPopular?: boolean;
    isSpecial?: boolean;
    ordre?: number;
    isComposedMenu?: boolean;
    composedMenuConfig?: {
        basePrice: number;
        steps: any[];
    };
}

interface MenuCategory {
    id: string;
    nom: string;
    ordre?: number;
}

interface MenuItemManagerProps {
    restaurantSlug: string;
}

const MenuItemManager: React.FC<MenuItemManagerProps> = ({ restaurantSlug }) => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [restaurantSlug]);

    const filteredItems = selectedCategory === 'all'
        ? menuItems
        : menuItems.filter(item => item.categorieId === selectedCategory);

    useEffect(() => {
        console.log('Catégorie sélectionnée:', selectedCategory);
        console.log('Nombre total d\'items:', menuItems.length);
        console.log('Items filtrés:', filteredItems.length);
        if (selectedCategory !== 'all') {
            console.log('Items de cette catégorie:', filteredItems);
        }
    }, [selectedCategory, menuItems]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await Promise.all([
                loadMenuItems(),
                loadCategories()
            ]);
        } catch (err: any) {
            setError(`Erreur de chargement: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMenuItems = async () => {
        const itemsRef = collection(db, `restaurants/${restaurantSlug}/menuItems`);
        const snapshot = await getDocs(itemsRef);
        const items: MenuItem[] = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as MenuItem);
        });
        console.log('Menu Items chargés:', items);
        setMenuItems(items.sort((a, b) => (a.ordre || 999) - (b.ordre || 999)));
    };

    const loadCategories = async () => {
        const categoriesRef = collection(db, `restaurants/${restaurantSlug}/menuCategories`);
        const snapshot = await getDocs(categoriesRef);
        const cats: MenuCategory[] = [];
        snapshot.forEach((doc) => {
            cats.push({ id: doc.id, ...doc.data() } as MenuCategory);
        });
        setCategories(cats.sort((a, b) => (a.ordre || 999) - (b.ordre || 999)));
    };

    const validateJson = (jsonString: string): { valid: boolean; data?: any; error?: string } => {
        try {
            const parsed = JSON.parse(jsonString);

            // Validation des champs requis
            if (!parsed.nom || typeof parsed.nom !== 'string') {
                return { valid: false, error: 'Le champ "nom" est requis et doit être une chaîne' };
            }
            if (parsed.prix === undefined || typeof parsed.prix !== 'number') {
                return { valid: false, error: 'Le champ "prix" est requis et doit être un nombre' };
            }
            if (!parsed.categorieId || typeof parsed.categorieId !== 'string') {
                return { valid: false, error: 'Le champ "categorieId" est requis et doit être une chaîne' };
            }
            if (parsed.disponible === undefined || typeof parsed.disponible !== 'boolean') {
                return { valid: false, error: 'Le champ "disponible" est requis et doit être un booléen' };
            }

            return { valid: true, data: parsed };
        } catch (e: any) {
            return { valid: false, error: `JSON invalide: ${e.message}` };
        }
    };

    const handleAddNew = () => {
        const template = {
            nom: "Nouveau plat",
            description: "Description du plat",
            prix: 15,
            categorieId: categories[0]?.id || "12eacc",
            disponible: true,
            isPopular: false,
            isSpecial: false,
            ordre: menuItems.length + 1,
            isComposedMenu: false // Mettre à true pour un menu composé
            // composedMenuConfig: {} // Décommenter et remplir si isComposedMenu = true
        };
        setJsonInput(JSON.stringify(template, null, 2));
        setIsAddingNew(true);
        setEditingId(null);
        setJsonError(null);
        setError(null);
        setSuccess(null);
    };

    const handleEdit = (item: MenuItem) => {
        console.log('🔍 Item à éditer:', item);
        console.log('🔍 isComposedMenu:', item.isComposedMenu);
        console.log('🔍 composedMenuConfig:', item.composedMenuConfig);
        console.log('🔍 Tous les champs de l\'item:', Object.keys(item));

        const editData: any = {
            nom: item.nom,
            description: item.description || "",
            prix: item.prix,
            categorieId: item.categorieId,
            disponible: item.disponible,
            isPopular: item.isPopular || false,
            isSpecial: item.isSpecial || false,
            ordre: item.ordre || 1,
            isComposedMenu: item.isComposedMenu || false
        };

        // Ajouter composedMenuConfig seulement si c'est un menu composé
        if (item.isComposedMenu && item.composedMenuConfig) {
            editData.composedMenuConfig = item.composedMenuConfig;
        }

        console.log('✏️ Données éditées:', editData);

        setJsonInput(JSON.stringify(editData, null, 2));
        setEditingId(item.id);
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
                // Créer un nouvel item
                const newId = data.nom.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const itemRef = doc(db, `restaurants/${restaurantSlug}/menuItems`, newId);
                await setDoc(itemRef, {
                    ...data,
                    id: newId
                });
                setSuccess(`✅ Item "${data.nom}" créé avec succès`);
            } else if (editingId) {
                // Modifier un item existant
                const itemRef = doc(db, `restaurants/${restaurantSlug}/menuItems`, editingId);
                await setDoc(itemRef, data, { merge: true });
                setSuccess(`✅ Item "${data.nom}" modifié avec succès`);
            }

            await loadMenuItems();
            handleCancel();
        } catch (err: any) {
            setError(`❌ Erreur: ${err.message}`);
        }
    };

    const handleDelete = async (id: string, nom: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) return;

        try {
            const itemRef = doc(db, `restaurants/${restaurantSlug}/menuItems`, id);
            await deleteDoc(itemRef);
            setSuccess(`✅ Item "${nom}" supprimé`);
            await loadMenuItems();
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

    const getCategoryName = (categoryId: string) => {
        return categories.find(cat => cat.id === categoryId)?.nom || categoryId;
    };

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des items...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center space-x-2">
                        <UtensilsCrossed className="w-6 h-6" />
                        <span>Menu Items</span>
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {filteredItems.length} item(s) • {categories.length} catégorie(s)
                    </p>
                </div>
                {!isAddingNew && !editingId && (
                    <div className="flex space-x-2">
                        <Button
                            onClick={loadData}
                            variant="outline"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualiser
                        </Button>
                        <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter un item
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

            {/* Category Filter */}
            {!isAddingNew && !editingId && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <label className="font-medium">Filtrer par catégorie:</label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-[300px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Toutes les catégories ({menuItems.length})
                                        </SelectItem>
                                        {categories.map(cat => {
                                            const count = menuItems.filter(item => item.categorieId === cat.id).length;
                                            return (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.nom} ({count})
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-sm text-gray-600">
                                {selectedCategory === 'all'
                                    ? `${menuItems.length} items au total`
                                    : `${filteredItems.length} items dans cette catégorie`
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Add/Edit Form */}
            {(isAddingNew || editingId) && (
                <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{isAddingNew ? '➕ Ajouter un nouveau item' : '✏️ Modifier l\'item'}</span>
                            <Button variant="ghost" size="sm" onClick={handleCancel}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Éditez le JSON ci-dessous. Champs requis: nom, prix, categorieId, disponible. Pour un menu composé: isComposedMenu=true + composedMenuConfig
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">JSON du menu item:</label>
                            <Textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="font-mono text-sm min-h-[300px]"
                                placeholder="Entrez le JSON..."
                            />
                            {jsonError && (
                                <p className="text-red-600 text-sm mt-2">❌ {jsonError}</p>
                            )}
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium mb-2">📋 Catégories disponibles:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span className="font-medium">{cat.nom}</span>
                                        <code className="text-xs bg-gray-200 px-2 py-1 rounded">{cat.id}</code>
                                    </div>
                                ))}
                            </div>
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

            {/* Items List */}
            {!isAddingNew && !editingId && (
                <div className="grid gap-4">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-lg font-semibold">{item.nom}</h3>
                                            {item.isComposedMenu && (
                                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                                                    🍽️ Menu Composé
                                                </span>
                                            )}
                                            {item.isPopular && (
                                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                                    ⭐ Populaire
                                                </span>
                                            )}
                                            {item.isSpecial && (
                                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                                    ✨ Spécial
                                                </span>
                                            )}
                                            {!item.disponible && (
                                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                                    ❌ Indisponible
                                                </span>
                                            )}
                                        </div>

                                        {item.description && (
                                            <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                                        )}

                                        <div className="flex items-center space-x-4 text-sm">
                                            <span className="font-semibold text-purple-600">{item.prix}€</span>
                                            <span className="text-gray-500">
                                                📂 {getCategoryName(item.categorieId)}
                                            </span>
                                            {item.isComposedMenu && item.composedMenuConfig && (
                                                <span className="text-orange-600 font-medium">
                                                    🍽️ {item.composedMenuConfig.steps?.length || 0} étapes
                                                </span>
                                            )}
                                            <span className="text-gray-400">
                                                Ordre: {item.ordre || 'N/A'}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-center space-x-2">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                ID: {item.id}
                                            </code>
                                            {item.isComposedMenu && (
                                                <code className="text-xs bg-orange-100 px-2 py-1 rounded">
                                                    Menu Composé
                                                </code>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex space-x-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(item)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(item.id, item.nom)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredItems.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center text-gray-500">
                                <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Aucun item trouvé</p>
                                <p className="text-sm mt-2">
                                    {selectedCategory === 'all'
                                        ? 'Ajoutez votre premier item de menu'
                                        : 'Aucun item dans cette catégorie'}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default MenuItemManager;