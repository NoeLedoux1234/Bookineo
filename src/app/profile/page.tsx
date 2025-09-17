'use client';

import { useEffect, useState } from 'react';

interface ProfileData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Données du formulaire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Récupérer les données du profil
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFirstName(data.profile.firstName || '');
        setLastName(data.profile.lastName || '');
        setBirthDate(
          data.profile.birthDate ? data.profile.birthDate.split('T')[0] : ''
        );
      } else {
        setMessage({
          type: 'error',
          text: 'Erreur lors du chargement du profil',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Conversion birthDate en ISO-8601 si présent
      let birthDateToSend = birthDate || null;
      if (birthDate && birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        birthDateToSend = new Date(birthDate).toISOString();
      }
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName || null,
          lastName: lastName || null,
          birthDate: birthDateToSend,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setEditing(false);
        setMessage({
          type: 'success',
          text: 'Profil mis à jour avec succès !',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Erreur lors de la mise à jour',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(profile?.firstName || '');
    setLastName(profile?.lastName || '');
    setBirthDate(profile?.birthDate ? profile.birthDate.split('T')[0] : '');
    setEditing(false);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-red-600">
          <div className="text-xl">Erreur lors du chargement du profil</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">
          Mon Profil
        </h1>

        {/* Message de confirmation/erreur */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <form onSubmit={handleSave} className="p-6">
            <div className="space-y-6">
              {/* Email (non modifiable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={!editing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    editing
                      ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-50 text-gray-600'
                  }`}
                  placeholder="Votre prénom"
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={!editing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    editing
                      ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-50 text-gray-600'
                  }`}
                  placeholder="Votre nom"
                />
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={!editing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    editing
                      ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-50 text-gray-600'
                  }`}
                />
              </div>

              {/* Informations de compte */}
              <div className="border-t pt-6">
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <span className="font-medium">Membre depuis :</span>{' '}
                    {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  <div>
                    <span className="font-medium">Dernière mise à jour :</span>{' '}
                    {new Date(profile.updatedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="mt-8 flex justify-end space-x-3">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Modifier
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
