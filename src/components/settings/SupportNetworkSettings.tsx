import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";

export function SupportNetworkSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Support Network
        </CardTitle>
        <CardDescription>
          Manage your support network and crisis contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Build Your Support Network</h3>
          <p className="text-muted-foreground mb-4">
            Connect with trusted friends, family, or sponsors who can support you in your recovery journey.
          </p>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Support Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}