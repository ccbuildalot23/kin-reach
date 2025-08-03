import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Users, Phone, Plus, Edit2, Trash2, Moon, Sun, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SupportPerson {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isActive: boolean;
}

const Contacts = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [supportNetwork, setSupportNetwork] = useState<SupportPerson[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<SupportPerson | null>(null);
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '', relationship: '' });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('connect-button-darkmode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('connect-button-darkmode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const savedNetwork = localStorage.getItem('connect-button-network');
    if (savedNetwork) {
      try {
        setSupportNetwork(JSON.parse(savedNetwork));
      } catch (error) {
        console.error('Error loading support network:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('connect-button-network', JSON.stringify(supportNetwork));
  }, [supportNetwork]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-8 h-8 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your support network...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleAddContact = () => {
    if (newContact.name && newContact.phoneNumber) {
      const contact: SupportPerson = {
        id: Date.now().toString(),
        name: newContact.name.trim(),
        phoneNumber: newContact.phoneNumber.trim(),
        relationship: newContact.relationship.trim() || undefined,
        isActive: true
      };
      
      setSupportNetwork([...supportNetwork, contact]);
      setNewContact({ name: '', phoneNumber: '', relationship: '' });
      setShowAddDialog(false);
      
      toast({
        title: "Contact added",
        description: `${contact.name} is now part of your support network.`,
        className: "bg-accent text-accent-foreground",
      });
    }
  };

  const handleUpdateContact = () => {
    if (editingContact && editingContact.name && editingContact.phoneNumber) {
      setSupportNetwork(supportNetwork.map(contact => 
        contact.id === editingContact.id ? editingContact : contact
      ));
      setEditingContact(null);
      
      toast({
        title: "Contact updated",
        description: "Changes saved successfully.",
        className: "bg-accent text-accent-foreground",
      });
    }
  };

  const handleDeleteContact = (id: string) => {
    const contact = supportNetwork.find(c => c.id === id);
    setSupportNetwork(supportNetwork.filter(c => c.id !== id));
    toast({
      title: "Contact removed",
      description: `${contact?.name} has been removed from your support network.`,
    });
  };

  const toggleContactActive = (id: string) => {
    setSupportNetwork(supportNetwork.map(contact => 
      contact.id === id ? { ...contact, isActive: !contact.isActive } : contact
    ));
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} p-4 transition-colors duration-300`}>
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 ${darkMode ? 'bg-gradient-to-br from-blue-700 to-indigo-800' : 'bg-gradient-to-br from-blue-200 to-indigo-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 ${darkMode ? 'bg-gradient-to-br from-purple-700 to-pink-800' : 'bg-gradient-to-br from-purple-200 to-pink-300'} rounded-full blur-3xl opacity-30 animate-pulse`}></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10 pt-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Support Network
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              People who care about you
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700'} shadow-md`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Stats Card */}
        <Card className={`mb-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{supportNetwork.length}</div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Contacts</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {supportNetwork.filter(c => c.isActive).length}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Contact Button */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Plus className="w-5 h-5 mr-2" />
              Add Support Person
            </Button>
          </DialogTrigger>
          <DialogContent className={darkMode ? 'bg-gray-800 text-white' : ''}>
            <DialogHeader>
              <DialogTitle>Add Support Person</DialogTitle>
              <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
                Add someone who can support you when you need it
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  placeholder="John Doe"
                  className={darkMode ? 'bg-gray-700 text-white' : ''}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newContact.phoneNumber}
                  onChange={(e) => setNewContact({...newContact, phoneNumber: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                  className={darkMode ? 'bg-gray-700 text-white' : ''}
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relationship (optional)</Label>
                <Input
                  id="relationship"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                  placeholder="Friend, Family member, Therapist..."
                  className={darkMode ? 'bg-gray-700 text-white' : ''}
                />
              </div>
              <Button 
                onClick={handleAddContact}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                disabled={!newContact.name || !newContact.phoneNumber}
              >
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contacts List */}
        {supportNetwork.length === 0 ? (
          <Card className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm`}>
            <CardContent className="p-12 text-center">
              <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                No contacts yet
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                Add people who can support you when you need it
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {supportNetwork.map(contact => (
              <Card 
                key={contact.id} 
                className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm ${
                  !contact.isActive ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-full ${
                        contact.isActive 
                          ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
                          : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {contact.name}
                        </h3>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} space-y-1 mt-1`}>
                          <p className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {contact.phoneNumber}
                          </p>
                          {contact.relationship && (
                            <p className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {contact.relationship}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingContact(contact);
                        }}
                        className={darkMode ? 'hover:bg-gray-700' : ''}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContact(contact.id)}
                        className={`${darkMode ? 'hover:bg-gray-700' : ''} text-red-500 hover:text-red-600`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {contact.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      variant={contact.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleContactActive(contact.id)}
                      className={contact.isActive ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {contact.isActive ? 'Active' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Contact Dialog */}
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className={darkMode ? 'bg-gray-800 text-white' : ''}>
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
                Update contact information
              </DialogDescription>
            </DialogHeader>
            {editingContact && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingContact.name}
                    onChange={(e) => setEditingContact({...editingContact, name: e.target.value})}
                    className={darkMode ? 'bg-gray-700 text-white' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone Number *</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editingContact.phoneNumber}
                    onChange={(e) => setEditingContact({...editingContact, phoneNumber: e.target.value})}
                    className={darkMode ? 'bg-gray-700 text-white' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-relationship">Relationship</Label>
                  <Input
                    id="edit-relationship"
                    value={editingContact.relationship || ''}
                    onChange={(e) => setEditingContact({...editingContact, relationship: e.target.value})}
                    className={darkMode ? 'bg-gray-700 text-white' : ''}
                  />
                </div>
                <Button 
                  onClick={handleUpdateContact}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  disabled={!editingContact.name || !editingContact.phoneNumber}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Contacts;