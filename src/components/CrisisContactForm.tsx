import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { CrisisContactPhoneInput } from '@/components/PhoneInput';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneForSMS, validatePhoneNumber, formatPhoneForDisplay } from '@/lib/phoneUtils';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Phone, 
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface CrisisContact {
  id?: string;
  name: string;
  phone_number: string;
  relationship: string;
  priority_order: number;
  is_emergency_contact?: boolean;
  notify_for_crisis?: boolean;
  notify_for_milestones?: boolean;
  preferred_contact_method?: string;
}

interface CrisisContactFormProps {
  userId: string;
  onContactsChange?: (contacts: CrisisContact[]) => void;
}

export function CrisisContactForm({ userId, onContactsChange }: CrisisContactFormProps) {
  const [contacts, setContacts] = useState<CrisisContact[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<Partial<CrisisContact>>({
    name: '',
    phone_number: '',
    relationship: '',
    is_emergency_contact: true,
    notify_for_crisis: true,
    notify_for_milestones: false,
    preferred_contact_method: 'sms'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [userId]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crisis_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('priority_order', { ascending: true });

      if (error) throw error;

      setContacts(data || []);
      onContactsChange?.(data || []);
    } catch (error) {
      console.error('Error fetching crisis contacts:', error);
      toast.error('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async (contact: Partial<CrisisContact>, isNew: boolean = false) => {
    setSaving(true);
    try {
      // Validate phone number
      const phoneValidation = validatePhoneNumber(contact.phone_number || '');
      if (!phoneValidation.isValid) {
        toast.error(`Invalid phone number: ${phoneValidation.error}`);
        return;
      }

      const contactData = {
        user_id: userId,
        name: contact.name?.trim(),
        phone_number: formatPhoneForSMS(contact.phone_number || ''),
        relationship: contact.relationship?.trim(),
        priority_order: contact.priority_order || (contacts.length + 1),
        is_emergency_contact: contact.is_emergency_contact ?? true,
        notify_for_crisis: contact.notify_for_crisis ?? true,
        notify_for_milestones: contact.notify_for_milestones ?? false,
        preferred_contact_method: contact.preferred_contact_method || 'sms',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isNew) {
        const { error } = await supabase
          .from('crisis_contacts')
          .insert(contactData);

        if (error) throw error;

        setNewContact({
          name: '',
          phone_number: '',
          relationship: '',
          is_emergency_contact: true,
          notify_for_crisis: true,
          notify_for_milestones: false,
          preferred_contact_method: 'sms'
        });

        toast.success('Emergency contact added successfully!');
      } else {
        const { error } = await supabase
          .from('crisis_contacts')
          .update(contactData)
          .eq('id', contact.id);

        if (error) throw error;

        setEditingId(null);
        toast.success('Emergency contact updated successfully!');
      }

      await fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save emergency contact');
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('crisis_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast.success('Emergency contact deleted');
      await fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete emergency contact');
    }
  };

  const updatePriority = async (contactId: string, newPriority: number) => {
    try {
      const { error } = await supabase
        .from('crisis_contacts')
        .update({ priority_order: newPriority })
        .eq('id', contactId);

      if (error) throw error;

      await fetchContacts();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update contact priority');
    }
  };

  const ContactCard = ({ contact, isEditing }: { contact: CrisisContact; isEditing: boolean }) => {
    const [editData, setEditData] = useState(contact);

    if (isEditing) {
      return (
        <Card className="border-blue-200">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label>Relationship *</Label>
                <Input
                  value={editData.relationship}
                  onChange={(e) => setEditData({ ...editData, relationship: e.target.value })}
                  placeholder="e.g., Spouse, Friend, Parent"
                />
              </div>
            </div>

            <CrisisContactPhoneInput
              value={editData.phone_number}
              onChange={(displayValue, smsFormat) => {
                setEditData({ ...editData, phone_number: smsFormat });
              }}
              label="Emergency Contact Phone"
              required={true}
            />

            <div className="flex gap-2">
              <Button
                onClick={() => saveContact(editData, false)}
                disabled={saving || !editData.name || !editData.phone_number}
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => setEditingId(null)}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{contact.name}</h4>
                <Badge variant="outline">Priority {contact.priority_order}</Badge>
                {contact.notify_for_crisis && (
                  <Badge variant="default" className="bg-red-100 text-red-800">
                    Crisis Alerts
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{contact.relationship}</p>
              <p className="text-sm font-mono text-gray-500">
                {formatPhoneForDisplay(contact.phone_number)}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                onClick={() => updatePriority(contact.id!, contact.priority_order - 1)}
                disabled={contact.priority_order === 1}
                variant="ghost"
                size="sm"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => updatePriority(contact.id!, contact.priority_order + 1)}
                disabled={contact.priority_order === contacts.length}
                variant="ghost"
                size="sm"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setEditingId(contact.id!)}
                variant="ghost"
                size="sm"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => deleteContact(contact.id!)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {validatePhoneNumber(contact.phone_number).isValid && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Ready for SMS alerts
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          Loading emergency contacts...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Emergency Contacts
            <Badge variant="outline">{contacts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No emergency contacts configured. Add at least one contact to enable crisis alerts.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {contacts.length} emergency contact{contacts.length !== 1 ? 's' : ''} configured. 
                These contacts will be notified when you send a crisis alert.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Add New Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newContact.name || ''}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div>
              <Label>Relationship *</Label>
              <Input
                value={newContact.relationship || ''}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                placeholder="e.g., Spouse, Friend, Parent"
              />
            </div>
          </div>

          <CrisisContactPhoneInput
            value={newContact.phone_number || ''}
            onChange={(displayValue, smsFormat) => {
              setNewContact({ ...newContact, phone_number: smsFormat });
            }}
            label="Emergency Contact Phone"
            required={true}
          />

          <Button
            onClick={() => saveContact(newContact, true)}
            disabled={saving || !newContact.name || !newContact.phone_number}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {saving ? 'Adding Contact...' : 'Add Emergency Contact'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Contacts */}
      {contacts.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Your Emergency Contacts</h3>
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isEditing={editingId === contact.id}
            />
          ))}
        </div>
      )}

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 mb-2">How Crisis Alerts Work</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Contacts are notified in priority order (1 = highest priority)</li>
            <li>• All contacts marked for "Crisis Alerts" will receive SMS messages</li>
            <li>• Phone numbers must be US mobile numbers for SMS delivery</li>
            <li>• You can test the system with the SMS test component</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default CrisisContactForm;
