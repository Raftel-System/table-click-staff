import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, LogOut, Zap, CheckCircle, XCircle, Search, UtensilsCrossed, MapPin, Table } from "lucide-react";


import ComposedMenuManager from "@/components/dev/ComposedMenuManager.tsx";
import ZoneManager from "@/components/dev/ZoneManager.tsx";
import TableManager from "@/components/dev/TableManager.tsx";

const DevPage: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [restaurantSlug, setRestaurantSlug] = useState('');
    const [restaurantData, setRestaurantData] = useState<any>(null);
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
        } catch (error: any) {
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