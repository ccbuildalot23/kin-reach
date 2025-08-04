import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Phone, Globe, Heart, Plus, ExternalLink, Trash2 } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  type: 'hotline' | 'website' | 'app' | 'book' | 'other';
  contact?: string;
  url?: string;
  description?: string;
}

export function ResourcesSettings() {
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      name: '988 Suicide & Crisis Lifeline',
      type: 'hotline',
      contact: '988',
      description: '24/7 crisis support'
    },
    {
      id: '2',
      name: 'Crisis Text Line',
      type: 'hotline',
      contact: 'Text HOME to 741741',
      description: 'Free 24/7 text support'
    },
    {
      id: '3',
      name: 'SAMHSA National Helpline',
      type: 'hotline',
      contact: '1-800-662-4357',
      description: 'Treatment referral and information'
    }
  ]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResource, setNewResource] = useState<Partial<Resource>>({
    type: 'website'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    try {
      const savedResources = localStorage.getItem('recovery-resources');
      if (savedResources) {
        setResources(JSON.parse(savedResources));
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  }

  async function saveResources() {
    setLoading(true);
    try {
      localStorage.setItem('recovery-resources', JSON.stringify(resources));
      toast({
        title: "Resources saved",
        description: "Your recovery resources have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const addResource = () => {
    if (!newResource.name) {
      toast({
        title: "Error",
        description: "Please enter a resource name",
        variant: "destructive",
      });
      return;
    }

    const resource: Resource = {
      id: Date.now().toString(),
      name: newResource.name,
      type: newResource.type || 'other',
      contact: newResource.contact,
      url: newResource.url,
      description: newResource.description
    };

    setResources([...resources, resource]);
    setNewResource({ type: 'website' });
    setShowAddResource(false);
  };

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'hotline': return Phone;
      case 'website': return Globe;
      case 'book': return BookOpen;
      default: return Heart;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Recovery Resources
          </CardTitle>
          <CardDescription>
            Your personal collection of helpful resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {resources.map((resource) => {
              const Icon = getResourceIcon(resource.type);
              return (
                <div key={resource.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex gap-3 flex-1">
                    <Icon className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <h4 className="font-medium">{resource.name}</h4>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                      )}
                      {resource.contact && (
                        <p className="text-sm">
                          <span className="font-medium">Contact:</span> {resource.contact}
                        </p>
                      )}
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Visit Resource <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {!['1', '2', '3'].includes(resource.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResource(resource.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {showAddResource ? (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <Input
                placeholder="Resource name"
                value={newResource.name || ''}
                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
              />
              <select
                className="w-full p-2 border rounded"
                value={newResource.type}
                onChange={(e) => setNewResource({ ...newResource, type: e.target.value as Resource['type'] })}
              >
                <option value="website">Website</option>
                <option value="hotline">Hotline</option>
                <option value="app">App</option>
                <option value="book">Book</option>
                <option value="other">Other</option>
              </select>
              <Input
                placeholder="Contact info (optional)"
                value={newResource.contact || ''}
                onChange={(e) => setNewResource({ ...newResource, contact: e.target.value })}
              />
              <Input
                placeholder="URL (optional)"
                value={newResource.url || ''}
                onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={newResource.description || ''}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={addResource} size="sm" className="flex-1">
                  Add Resource
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddResource(false);
                    setNewResource({ type: 'website' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAddResource(true)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Resource
            </Button>
          )}

          <Button onClick={saveResources} disabled={loading} className="w-full">
            Save Resources
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Quick Access Hotlines
          </CardTitle>
          <CardDescription>
            Important numbers always at your fingertips
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.href = 'tel:988'}
          >
            <Phone className="mr-2 h-4 w-4" />
            988 - Suicide & Crisis Lifeline
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.href = 'sms:741741?body=HOME'}
          >
            <Phone className="mr-2 h-4 w-4" />
            741741 - Crisis Text Line
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.location.href = 'tel:18006624357'}
          >
            <Phone className="mr-2 h-4 w-4" />
            1-800-662-4357 - SAMHSA Helpline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}