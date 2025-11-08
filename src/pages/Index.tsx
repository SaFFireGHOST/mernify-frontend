import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Video, MessageSquare, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-study.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        
        <div className="container relative z-10 px-4 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Study Together,
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Achieve More
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground md:text-xl max-w-xl">
                Join virtual study rooms with real-time collaboration tools. Video chat, whiteboard, 
                and AI-powered assistance to make studying more productive and engaging.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/dashboard")}
                  className="group text-lg h-12 px-8"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                
              </div>
            </div>
            
            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
              <img 
                src={heroImage} 
                alt="Students studying together" 
                className="relative rounded-3xl shadow-2xl hover-lift w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              Everything You Need to Study Effectively
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to enhance your learning experience and boost productivity
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Video Collaboration</h3>
              <p className="text-muted-foreground">
                Connect face-to-face with study partners through high-quality video calls
              </p>
            </div>

            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">Interactive Whiteboard</h3>
              <p className="text-muted-foreground">
                Draw, sketch, and visualize concepts together in real-time
              </p>
            </div>

            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Real-time Chat</h3>
              <p className="text-muted-foreground">
                Stay connected with group chat and instant messaging features
              </p>
            </div>

            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI Study Assistant</h3>
              <p className="text-muted-foreground">
                Get instant help and explanations powered by advanced AI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="glass-card p-12 md:p-16 text-center max-w-4xl mx-auto animate-fade-in-up">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
              Ready to Transform Your Study Habits?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students already using our platform to collaborate, 
              learn, and achieve their academic goals together.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="group text-lg h-14 px-10"
            >
              Start Studying Now
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
