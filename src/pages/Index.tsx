import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Video, MessageSquare, BookOpen, Mic, Bot,Clock } from "lucide-react";
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
                Study together like never before! Watch videos in sync, ask AI or friends for help, and explain ideas using voice and a shared whiteboard.
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
      {/* Features Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              Everything You Need to Study Effectively
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to make learning collaborative, engaging, and effortless
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {/* Video Synchronization */}
            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Video Synchronization</h3>
              <p className="text-muted-foreground">
                Watch study videos together in perfect sync. Pause, play, and learn as a group.
              </p>
            </div>

            {/* Real-time Voice */}
            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Mic className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">Real-time Voice</h3>
              <p className="text-muted-foreground">
                Explain concepts naturally using voice while watching or discussing together.
              </p>
            </div>

            {/* Real-time Chat */}
            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Real-time Chat</h3>
              <p className="text-muted-foreground">
                Ask questions, share ideas, and stay connected through instant messaging.
              </p>
            </div>

            {/* Interactive Whiteboard */}
            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Interactive Whiteboard</h3>
              <p className="text-muted-foreground">
                Draw, write, and visualize concepts together for better understanding.
              </p>
            </div>

            {/* AI Study Assistant */}
            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">AI Study Assistant</h3>
              <p className="text-muted-foreground">
                Get instant explanations and answers powered by advanced AI, accessible to everyone in the room.
              </p>
            </div>

            {/* Timestamped Comments */}
            <div className="glass-card p-6 hover-lift space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Timestamped Comments</h3>
              <p className="text-muted-foreground">
                Leave comments linked to specific moments in the video and jump back to them anytime while revising.
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
