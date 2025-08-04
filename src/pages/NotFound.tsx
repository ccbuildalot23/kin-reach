import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Heart, Home, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/90 backdrop-blur border-purple-200">
        <CardContent className="p-8 text-center space-y-6">
          {/* Supportive Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-white" />
          </div>
          
          {/* Compassionate Message */}
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              You took a wrong turn, but that's okay
            </h1>
            <p className="text-gray-600">
              Sometimes we get lost on the journey. Let's get you back to safety.
            </p>
          </div>

          {/* Recovery-focused navigation */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Your Safe Space
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/crisis-alert')}
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              <Phone className="w-4 h-4 mr-2" />
              Need Help Right Now?
            </Button>
          </div>

          {/* Encouraging footer */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Remember: Getting lost doesn't mean you're lost 💙
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Crisis support available 24/7: Call 988
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
