import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PhoneInputValidated } from "@/components/PhoneInputValidated";
import {
  UserPlus,
  UserMinus,
  Users,
  Loader2,
  Search,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SupportMember {
  id: string;
  supporter: {
    user_id: string;
    full_name: string;
    display_name: string;
    phone_number: string;
    email: string;
  };
  relationship_type: string;
  created_at: string;
}

export function SupportNetworkSettings() {
  const [members, setMembers] = useState<SupportMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState<'phone' | 'email'>('phone');
  const { toast } = useToast();

  useEffect(() => {
    loadSupportNetwork();
  }, []);

  async function loadSupportNetwork() {
    try {
      setLoadingMembers(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      console.log('Loading support network for user:', user.id);

      const { data, error } = await supabase
        .from('support_network')
        .select(`
          id,
          supporter_id,
          relationship_type,
          created_at
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading support network:', error);
        toast({
          title: 'Error',
          description: 'Failed to load support network. Table might not exist.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Support network data:', data);

      if (data && data.length > 0) {
        const supporterIds = data.map((item) => item.supporter_id);

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name, display_name, phone_number, email')
          .in('user_id', supporterIds);

        if (profileError) {
          console.error('Error loading profiles:', profileError);
          return;
        }

        const membersWithProfiles = data.map((item) => {
          const profile = profiles?.find((p) => p.user_id === item.supporter_id);
          return {
            ...item,
            supporter:
              profile || {
                user_id: item.supporter_id,
                full_name: 'Unknown User',
                display_name: 'Unknown',
                phone_number: '',
                email: '',
              },
          };
        });

        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error in loadSupportNetwork:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoadingMembers(false);
    }
  }

  async function searchUser() {
    if (!searchQuery.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number or email',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      console.log(`Searching for user by ${searchBy}:`, searchQuery);

      const searchField = searchBy === 'phone' ? 'phone_number' : 'email';
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name')
        .eq(searchField, searchQuery)
        .maybeSingle();

      console.log('Search result:', data, 'Error:', error);

      if (!data) {
        toast({
          title: 'User not found',
          description: `No user found with that ${searchBy}`,
          variant: 'destructive',
        });
        return;
      }

      if (data.user_id === user.id) {
        toast({
          title: 'Error',
          description: 'You cannot add yourself to your support network',
          variant: 'destructive',
        });
        return;
      }

      const existing = members.find((m) => m.supporter.user_id === data.user_id);

      if (existing) {
        toast({
          title: 'Already connected',
          description: 'This user is already in your support network',
          variant: 'destructive',
        });
        return;
      }

      const { error: addError } = await supabase.from('support_network').insert({
        user_id: user.id,
        supporter_id: data.user_id,
        relationship_type: 'peer',
      });

      if (addError) {
        console.error('Error adding to network:', addError);
        throw addError;
      }

      toast({
        title: 'Success',
        description: `Added ${data.display_name || data.full_name} to your support network`,
      });

      setSearchQuery('');
      await loadSupportNetwork();
    } catch (error: any) {
      console.error('Error in searchUser:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add user to network',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(memberId: string) {
    try {
      const { error } = await supabase
        .from('support_network')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Removed from support network',
      });

      await loadSupportNetwork();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Support Member
          </CardTitle>
          <CardDescription>
            Search for users by phone number or email to add to your network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={searchBy}
            onValueChange={(value: 'phone' | 'email') => setSearchBy(value)}
          >
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="cursor-pointer">
                  Phone Number
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="cursor-pointer">
                  Email
                </Label>
              </div>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            {searchBy === 'phone' ? (
              <PhoneInputValidated
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Enter phone number"
              />
            ) : (
              <Input
                type="email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter email address"
                onKeyPress={(e) => e.key === 'Enter' && searchUser()}
              />
            )}
          </div>

          <Button
            onClick={searchUser}
            disabled={loading || !searchQuery.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search and Add
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Support Network
          </CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? 'member' : 'members'} in your
            network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">
                No support members yet. Add someone above!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.supporter.display_name ||
                        member.supporter.full_name ||
                        'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.supporter.phone_number ||
                        member.supporter.email ||
                        'No contact info'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {member.relationship_type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

