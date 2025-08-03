import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PhoneInputValidated } from "@/components/PhoneInputValidated";
import { UserPlus, UserMinus, Users, Loader2 } from "lucide-react";

export function SupportNetworkSettings() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState<'phone' | 'email'>(
    'phone'
  );
  const { toast } = useToast();

  useEffect(() => {
    loadSupportNetwork();
  }, []);

  async function loadSupportNetwork() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('support_network')
        .select(
          `
          id,
          supporter:supporter_id (
            user_id,
            full_name,
            display_name,
            phone_number,
            email
          ),
          relationship_type,
          created_at
        `
        )
        .eq('user_id', user.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading support network:', error);
    }
  }

  async function searchUser() {
    if (!searchQuery) return;

    setLoading(true);
    try {
      const searchField = searchBy === 'phone' ? 'phone_number' : 'email';
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name')
        .eq(searchField, searchQuery)
        .eq('is_searchable', true)
        .single();

      if (error || !data) {
        toast({
          title: "User not found",
          description: "No user found with that " + searchBy,
          variant: "destructive",
        });
        return;
      }

      // Check if already in network
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const existing = members.find(
        (m) => m.supporter.user_id === data.user_id
      );

      if (existing) {
        toast({
          title: "Already connected",
          description: "This user is already in your support network",
          variant: "destructive",
        });
        return;
      }

      // Add to network
      const { error: addError } = await supabase
        .from('support_network')
        .insert({
          user_id: user!.id,
          supporter_id: data.user_id,
          relationship_type: 'peer',
        });

      if (addError) throw addError;

      toast({
        title: "Success",
        description: `Added ${data.display_name || data.full_name} to your support network`,
      });

      setSearchQuery("");
      loadSupportNetwork();
    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: "Error",
        description: "Failed to add user to network",
        variant: "destructive",
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
        title: "Success",
        description: "Removed from support network",
      });

      loadSupportNetwork();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
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
          <div className="flex gap-2">
            <Button
              variant={searchBy === 'phone' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchBy('phone')}
            >
              By Phone
            </Button>
            <Button
              variant={searchBy === 'email' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchBy('email')}
            >
              By Email
            </Button>
          </div>

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
              />
            )}
          </div>

          <Button
            onClick={searchUser}
            disabled={loading || !searchQuery}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add to Support Network
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
            {members.length} {members.length === 1 ? 'member' : 'members'} in your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No support members yet. Add someone above!
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {member.supporter.display_name || member.supporter.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.supporter.phone_number}
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

