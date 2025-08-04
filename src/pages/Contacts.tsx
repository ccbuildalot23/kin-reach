import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Users, Phone, Plus, Edit2, Trash2, Moon, Sun, User, Heart, Shield, Sparkles, MessageSquare, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FloatingCrisisButton } from '@/components/FloatingCrisisButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SupportPerson {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isActive: boolean;
  category?: 'crisis' | 'daily' | 'celebrate';
  isSponsor?: boolean;
}

const Contacts = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [supportNetwork, setSupportNetwork] = useState<SupportPerson[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<SupportPerson | null>(null);
  const [newContact, setNewContact] = useState({ 
    name: '', 
    phoneNumber: '', 
    relationship: '', 
    category: 'daily' as 'crisis' | 'daily' | 'celebrate',
    isSponsor: false 
  });

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-purple-600 font-medium">Gathering your support team...</p>
          <p className="text-purple-500 text-sm mt-2">People who care about you</p>
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
        isActive: true,
        category: newContact.category,
        isSponsor: newContact.isSponsor
      };
      
      setSupportNetwork([...supportNetwork, contact]);
      setNewContact({ name: '', phoneNumber: '', relationship: '', category: 'daily', isSponsor: false });
      setShowAddDialog(false);
      
      toast({
        title: "💙 New support added",
        description: `${contact.name} is now part of your recovery journey.`,
        className: "bg-purple-100 text-purple-900 border-purple-200",
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
        title: "✓ Updated with care",
        description: "Your support team information is saved.",
        className: "bg-green-100 text-green-900 border-green-200",
      });
    }
  };

  const handleDeleteContact = (id: string) => {
    const contact = supportNetwork.find(c => c.id === id);
    setSupportNetwork(supportNetwork.filter(c => c.id !== id));
    toast({
      title: "Removed with love",
      description: `${contact?.name} is no longer in your support team, but the memories remain.",
      className: "bg-blue-100 text-blue-900 border-blue-200",
    });
  };

  const toggleContactActive = (id: string) => {
    setSupportNetwork(supportNetwork.map(contact => 
      contact.id === id ? { ...contact, isActive: !contact.isActive } : contact
    ));
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50"
    )}>
      <FloatingCrisisButton userId={user?.id || ''} />
      
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-30 animate-pulse",
          darkMode ? "bg-gradient-to-br from-purple-700 to-pink-800" : "bg-gradient-to-br from-purple-200 to-pink-300"
        )}></div>
        <div className={cn(
          "absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse",
          darkMode ? "bg-gradient-to-br from-blue-700 to-cyan-800" : "bg-gradient-to-br from-blue-200 to-cyan-300"
        )}></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10 pt-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your Support Team
              </h1>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              People who walk this journey with you 💙
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
        <Card className={`mb-6 ${darkMode ? 'bg-gray-800/80' : 'bg-gradient-to-br from-purple-100 to-pink-100'} backdrop-blur-sm border-purple-200`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{supportNetwork.filter(c => c.category === 'crisis').length}</div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Crisis Support</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {supportNetwork.filter(c => c.category === 'daily').length}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Daily Check-ins</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {supportNetwork.filter(c => c.category === 'celebrate').length}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Celebrate Wins</p>
              </div>
            </div>
            {supportNetwork.some(c => c.isSponsor) && (
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-gray-700 text-center">
                <Sparkles className="w-5 h-5 text-yellow-500 inline mr-2" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                  You have a sponsor in your team!
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Contact Button */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
              <Plus className="w-5 h-5 mr-2" />
              Add Someone Who Cares
            </Button>
          </DialogTrigger>
          <DialogContent className={darkMode ? 'bg-gray-800 text-white' : ''}>
            <DialogHeader>
              <DialogTitle>Add to Your Support Team</DialogTitle>
              <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
                Every person you add strengthens your recovery network 💙
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Their Name *</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  placeholder="Someone special"
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
                <Label htmlFor="relationship">Relationship</Label>
                <Input
                  id="relationship"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                  placeholder="Friend, Family, Sponsor, Therapist..."
                  className={darkMode ? 'bg-gray-700 text-white' : ''}
                />
              </div>
              <div>
                <Label htmlFor="category">When to contact them?</Label>
                <Select 
                  value={newContact.category} 
                  onValueChange={(value: 'crisis' | 'daily' | 'celebrate') => 
                    setNewContact({...newContact, category: value})
                  }
                >
                  <SelectTrigger className={darkMode ? 'bg-gray-700 text-white' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crisis">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Crisis situations
                      </span>
                    </SelectItem>
                    <SelectItem value="daily">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        Daily support
                      </span>
                    </SelectItem>
                    <SelectItem value="celebrate">
                      <span className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-green-500" />
                        Celebrate wins
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isSponsor"
                  checked={newContact.isSponsor}
                  onChange={(e) => setNewContact({...newContact, isSponsor: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isSponsor" className="font-normal cursor-pointer">
                  This person is my sponsor
                </Label>
              </div>
              <Button 
                onClick={handleAddContact}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                disabled={!newContact.name || !newContact.phoneNumber}
              >
                <Heart className="w-4 h-4 mr-2" />
                Add to My Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contacts List */}
        {supportNetwork.length === 0 ? (
          <Card className={`${darkMode ? 'bg-gray-800/80' : 'bg-gradient-to-br from-purple-100 to-pink-100'} backdrop-blur-sm border-purple-200`}>
            <CardContent className="p-12 text-center">
              <Heart className={`w-16 h-16 mx-auto mb-4 text-purple-400`} />
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Build Your Support Team
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                Recovery is easier when you're not alone 💙
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Add people who believe in your recovery journey
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Group by category */}
            {['crisis', 'daily', 'celebrate'].map(category => {
              const categoryContacts = supportNetwork.filter(c => c.category === category);
              if (categoryContacts.length === 0) return null;
              
              return (
                <div key={category} className="space-y-4">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                    {category === 'crisis' && <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      Call When Struggling
                    </>}
                    {category === 'daily' && <>
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Daily Support
                    </>}
                    {category === 'celebrate' && <>
                      <Trophy className="w-5 h-5 text-green-500" />
                      Celebrate Wins With
                    </>}
                  </h3>
                  
                  {categoryContacts.map(contact => (
                    <Card 
                      key={contact.id} 
                      className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm ${
                        !contact.isActive ? 'opacity-60' : ''
                      } border-l-4 ${
                        category === 'crisis' ? 'border-l-red-400' : 
                        category === 'daily' ? 'border-l-blue-400' : 
                        'border-l-green-400'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-full ${
                              contact.isActive 
                                ? category === 'crisis' ? 'bg-gradient-to-br from-red-400 to-pink-500' :
                                  category === 'daily' ? 'bg-gradient-to-br from-blue-400 to-purple-500' :
                                  'bg-gradient-to-br from-green-400 to-emerald-500'
                                : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              {contact.isSponsor ? (
                                <Sparkles className="w-6 h-6 text-white" />
                              ) : (
                                <User className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
                                {contact.name}
                                {contact.isSponsor && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                    Sponsor
                                  </span>
                                )}
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
                            {contact.isActive ? '💙 Available' : '💤 Unavailable'}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `tel:${contact.phoneNumber}`}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Call
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `sms:${contact.phoneNumber}`}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Text
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Contact Dialog */}
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className={darkMode ? 'bg-gray-800 text-white' : ''}>
            <DialogHeader>
              <DialogTitle>Update Support Person</DialogTitle>
              <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
                Keep your support team information current 💙
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