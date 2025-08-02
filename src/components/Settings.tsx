import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SMSIntegration } from "@/components/SMSIntegration";
import { ArrowLeft, Plus, X, Edit2, TestTube2, Heart, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SupportPerson {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isActive: boolean;
}

interface SettingsProps {
  supportNetwork: SupportPerson[];
  messageTemplate: string;
  userId: string;
  onUpdateNetwork: (network: SupportPerson[]) => void;
  onUpdateMessage: (message: string) => void;
  onBack: () => void;
}

export const Settings = ({ 
  supportNetwork, 
  messageTemplate, 
  userId,
  onUpdateNetwork, 
  onUpdateMessage, 
  onBack 
}: SettingsProps) => {
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '', relationship: '' });
  const [editingMessage, setEditingMessage] = useState(false);
  const [tempMessage, setTempMessage] = useState(messageTemplate);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editedContact, setEditedContact] = useState({ name: '', phoneNumber: '', relationship: '' });

  const addContact = () => {
    if (!newContact.name.trim() || !newContact.phoneNumber.trim()) {
      toast({
        title: "Please fill in name and phone number",
        description: "We need both to reach your support person.",
        variant: "destructive",
      });
      return;
    }

    if (supportNetwork.length >= 5) {
      toast({
        title: "Maximum 5 contacts",
        description: "You can have up to 5 people in your support network.",
        variant: "destructive",
      });
      return;
    }

    const contact: SupportPerson = {
      id: Date.now().toString(),
      name: newContact.name.trim(),
      phoneNumber: newContact.phoneNumber.trim(),
      relationship: newContact.relationship.trim() || undefined,
      isActive: true
    };

    onUpdateNetwork([...supportNetwork, contact]);
    setNewContact({ name: '', phoneNumber: '', relationship: '' });
    
    toast({
      title: "Support person added",
      description: `${contact.name} is now in your network.`,
      className: "bg-accent text-accent-foreground",
    });
  };

  const removeContact = (id: string) => {
    onUpdateNetwork(supportNetwork.filter(contact => contact.id !== id));
    toast({
      title: "Contact removed",
      description: "They've been removed from your support network.",
    });
  };

  const toggleContactActive = (id: string) => {
    onUpdateNetwork(
      supportNetwork.map(contact =>
        contact.id === id ? { ...contact, isActive: !contact.isActive } : contact
      )
    );
  };

  const startEditingContact = (contact: SupportPerson) => {
    setEditingContact(contact.id);
    setEditedContact({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship || ''
    });
  };

  const saveContactEdit = () => {
    if (!editedContact.name.trim() || !editedContact.phoneNumber.trim()) {
      toast({
        title: "Please fill in name and phone number",
        variant: "destructive",
      });
      return;
    }

    onUpdateNetwork(
      supportNetwork.map(contact =>
        contact.id === editingContact
          ? {
              ...contact,
              name: editedContact.name.trim(),
              phoneNumber: editedContact.phoneNumber.trim(),
              relationship: editedContact.relationship.trim() || undefined
            }
          : contact
      )
    );

    setEditingContact(null);
    toast({
      title: "Contact updated",
      className: "bg-accent text-accent-foreground",
    });
  };

  const saveMessage = () => {
    onUpdateMessage(tempMessage);
    setEditingMessage(false);
    toast({
      title: "Message updated",
      description: "Your new message has been saved.",
      className: "bg-accent text-accent-foreground",
    });
  };

  const testMessage = () => {
    toast({
      title: "This is your message",
      description: `"${messageTemplate}" will be sent to your support network.`,
      className: "bg-accent text-accent-foreground",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>

        {/* My Support Network */}
        <Card className="warm-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-accent" />
              <span>My Support Network</span>
            </CardTitle>
            <CardDescription>
              Edit your contacts or add new people (up to 5 total)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add new contact */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium">Add Someone New</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-name">Name</Label>
                  <Input
                    id="new-name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    placeholder="Their name"
                    className="warm-input"
                  />
                </div>
                <div>
                  <Label htmlFor="new-phone">Phone Number</Label>
                  <Input
                    id="new-phone"
                    value={newContact.phoneNumber}
                    onChange={(e) => setNewContact({...newContact, phoneNumber: e.target.value})}
                    placeholder="Their phone number"
                    className="warm-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-relationship">Relationship (optional)</Label>
                <Input
                  id="new-relationship"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                  placeholder="Friend, Family, Therapist..."
                  className="warm-input"
                />
              </div>
              <Button onClick={addContact} className="w-full bg-secondary hover:bg-secondary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add to Support Network
              </Button>
            </div>

            {/* Existing contacts */}
            {supportNetwork.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Your People</h3>
                {supportNetwork.map((contact) => (
                  <div key={contact.id} className="p-4 border border-border rounded-lg space-y-3">
                    {editingContact === contact.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            value={editedContact.name}
                            onChange={(e) => setEditedContact({...editedContact, name: e.target.value})}
                            placeholder="Name"
                            className="warm-input"
                          />
                          <Input
                            value={editedContact.phoneNumber}
                            onChange={(e) => setEditedContact({...editedContact, phoneNumber: e.target.value})}
                            placeholder="Phone number"
                            className="warm-input"
                          />
                        </div>
                        <Input
                          value={editedContact.relationship}
                          onChange={(e) => setEditedContact({...editedContact, relationship: e.target.value})}
                          placeholder="Relationship"
                          className="warm-input"
                        />
                        <div className="flex space-x-2">
                          <Button onClick={saveContactEdit} size="sm">Save</Button>
                          <Button onClick={() => setEditingContact(null)} variant="outline" size="sm">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{contact.name}</h4>
                            <p className="text-sm text-muted-foreground">{contact.phoneNumber}</p>
                            {contact.relationship && (
                              <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => startEditingContact(contact)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => removeContact(contact.id)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={contact.isActive}
                            onCheckedChange={() => toggleContactActive(contact.id)}
                          />
                          <Label className="text-sm">
                            {contact.isActive ? 'Will be contacted' : 'Disabled'}
                          </Label>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Message */}
        <Card className="warm-card">
          <CardHeader>
            <CardTitle>My Message</CardTitle>
            <CardDescription>
              This is what your support network will receive when you reach out
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingMessage ? (
              <div className="space-y-4">
                <Textarea
                  value={tempMessage}
                  onChange={(e) => setTempMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="warm-input min-h-[100px]"
                />
                <div className="flex space-x-2">
                  <Button onClick={saveMessage}>Save Message</Button>
                  <Button 
                    onClick={() => {
                      setEditingMessage(false);
                      setTempMessage(messageTemplate);
                    }} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-l-primary">
                  <p className="text-foreground">"{messageTemplate}"</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => {
                      setEditingMessage(true);
                      setTempMessage(messageTemplate);
                    }}
                    variant="outline"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Message
                  </Button>
                  <Button onClick={testMessage} variant="outline">
                    <TestTube2 className="w-4 h-4 mr-2" />
                    Test Message
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMS Integration */}
        <Card className="warm-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              <span>SMS Integration</span>
            </CardTitle>
            <CardDescription>
              Manage your SMS notifications and emergency contact settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SMSIntegration userId={userId} />
          </CardContent>
        </Card>

        {/* About */}
        <Card className="warm-card">
          <CardHeader>
            <CardTitle>About Connect Button</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Connect Button is designed for moments when reaching out feels hard but necessary. 
                With one tap, your trusted support network knows you need them.
              </p>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Remember:</p>
                <ul className="space-y-1 ml-4">
                  <li>• It's always okay to ask for help</li>
                  <li>• Your struggles are valid</li>
                  <li>• You're not alone</li>
                  <li>• This feeling will pass</li>
                </ul>
              </div>
              <p className="text-xs">
                Your privacy is sacred. Everything stays on your device. 
                No accounts, no tracking, no sharing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
