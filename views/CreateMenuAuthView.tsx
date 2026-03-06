import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as MenuService from '../services/menuService';
import { RestaurantNameEditor } from '../components/RestaurantNameEditor';
import AdminDashboard from './admin/AdminDashboard';

interface CreateMenuAuthViewProps {
  onBack: () => void;
  // ... other props needed for AdminDashboard
}

export const CreateMenuAuthView: React.FC<CreateMenuAuthViewProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || null);
        setUserId(session.user.id || null);
        const restaurant = await MenuService.getRestaurantByOwnerId(session.user.id);
        setHasRestaurant(!!restaurant);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUserEmail(session.user.email || null);
        setUserId(session.user.id || null);
        const restaurant = await MenuService.getRestaurantByOwnerId(session.user.id);
        setHasRestaurant(!!restaurant);
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isAuthenticated) {
    if (hasRestaurant === true) {
      // Redirect to admin dashboard
      return <div>Redirecting to Admin Dashboard...</div>;
    } else if (hasRestaurant === false) {
      return <RestaurantNameEditor userId={userId!} email={userEmail!} onComplete={() => window.location.reload()} />;
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <h2 className="text-3xl font-black text-slate-900">Create your menu</h2>
        {userEmail ? (
          <div className="space-y-4">
            <p>You are currently logged in as <strong>{userEmail}</strong></p>
            <button onClick={() => setIsAuthenticated(true)} className="w-full py-4 bg-slate-900 text-white rounded-xl">Continue</button>
          </div>
        ) : (
          <button onClick={handleGoogleLogin} className="w-full py-4 bg-slate-900 text-white rounded-xl">Login with Google</button>
        )}
        <button onClick={onBack} className="w-full py-4 text-slate-500">Back</button>
      </div>
    </div>
  );
};
