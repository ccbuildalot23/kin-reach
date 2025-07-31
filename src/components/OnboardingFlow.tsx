import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Heart, CheckCircle, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SupportPerson {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  isActive: boolean;
}

interface OnboardingFlowProps {
  onComplete: (supportNetwork: SupportPerson[], messageTemplate: string) => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [supportNetwork, setSupportNetwork] = useState<SupportPerson[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '', relationship: '' });
  const [messageTemplate, setMessageTemplate] = useState('');
  const [selectedMessage, setSelectedMessage] = useState('preset1');
  const [customMessage, setCustomMessage] = useState('');

  const presetMessages = {
    preset1: "I'm having a hard time and could use some support",
    preset2: "I need to hear a friendly voice right now",
    preset3: "I'm struggling and need help",
    custom: customMessage
  };

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

    setSupportNetwork([...supportNetwork, contact]);
    setNewContact({ name: '', phoneNumber: '', relationship: '' });
    
    toast({
      title: "Support person added",
      description: `${contact.name} is now in your network.`,
      className: "bg-accent text-accent-foreground",
    });
  };

  const removeContact = (id: string) => {
    setSupportNetwork(supportNetwork.filter(contact => contact.id !== id));
  };

  const nextStep = () => {
    if (currentStep === 1 && supportNetwork.length === 0) {
      toast({
        title: "Add at least one person",
        description: "Choose someone you trust to be part of your support network.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === 2) {
      const message = selectedMessage === 'custom' ? customMessage : presetMessages[selectedMessage as keyof typeof presetMessages];
      setMessageTemplate(message);
    }
    
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const completeOnboarding = () => {
    const finalMessage = selectedMessage === 'custom' ? customMessage : presetMessages[selectedMessage as keyof typeof presetMessages];
    onComplete(supportNetwork, finalMessage);
  };

  const testButton = () => {
    toast({
      title: "This is how it works!",
      description: `When you tap REACH OUT, ${supportNetwork.map(c => c.name).join(" and ")} will get your message.`,
      className: "bg-accent text-accent-foreground",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="warm-card w-full max-w-md">
        {/* Step 1: Add Support Network */}
        {currentStep === 1 && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Who's Your Person?</CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose people you trust - those who make you feel safe and supported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    placeholder="Their name"
                    className="warm-input"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newContact.phoneNumber}
                    onChange={(e) => setNewContact({...newContact, phoneNumber: e.target.value})}
                    placeholder="Their phone number"
                    className="warm-input"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship (optional)</Label>
                  <Input
                    id="relationship"
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

              {supportNetwork.length > 0 && (
                <div className="space-y-2">
                  <Label>Your Support Network</Label>
                  {supportNetwork.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.relationship || 'Support person'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(contact.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={nextStep} className="w-full">
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </>
        )}

        {/* Step 2: Choose Message */}
        {currentStep === 2 && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">What Would You Like to Say?</CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose a message that feels right. You can always change this later
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedMessage} onValueChange={setSelectedMessage}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50">
                    <RadioGroupItem value="preset1" id="preset1" />
                    <Label htmlFor="preset1" className="flex-1 cursor-pointer">
                      "I'm having a hard time and could use some support"
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50">
                    <RadioGroupItem value="preset2" id="preset2" />
                    <Label htmlFor="preset2" className="flex-1 cursor-pointer">
                      "I need to hear a friendly voice right now"
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50">
                    <RadioGroupItem value="preset3" id="preset3" />
                    <Label htmlFor="preset3" className="flex-1 cursor-pointer">
                      "I'm struggling and need help"
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="flex-1 cursor-pointer">
                        Write your own message
                      </Label>
                    </div>
                    {selectedMessage === 'custom' && (
                      <Textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Type your own message here..."
                        className="warm-input"
                      />
                    )}
                  </div>
                </div>
              </RadioGroup>

              <div className="flex space-x-3">
                <Button onClick={prevStep} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3: You're Ready */}
        {currentStep === 3 && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground flex items-center justify-center space-x-2">
                <CheckCircle className="w-8 h-8 text-accent" />
                <span>You're Ready</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your support network is now just one tap away. That takes courage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <Heart className="w-12 h-12 text-accent mx-auto mb-2" />
                  <p className="font-medium text-accent">Remember: It's always okay to ask for help</p>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Your people:</strong> {supportNetwork.map(c => c.name).join(", ")}</p>
                  <p><strong>Your message:</strong> "{selectedMessage === 'custom' ? customMessage : presetMessages[selectedMessage as keyof typeof presetMessages]}"</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={testButton} variant="outline" className="w-full">
                  Test Your Button
                </Button>
                <Button onClick={completeOnboarding} className="w-full">
                  Start Using Connect Button
                  <Heart className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};