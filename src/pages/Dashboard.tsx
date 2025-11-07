import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomCard from "@/components/RoomCard";
import CreateRoomDialog from "@/components/CreateRoomDialog";
import heroImage from "@/assets/hero-study.jpg";
import thumbMath from "@/assets/thumb-math.jpg";
import thumbPhysics from "@/assets/thumb-physics.jpg";
import thumbBiology from "@/assets/thumb-biology.jpg";
import { useAuth } from "@/hooks/use-auth"; // Import the useAuth hook

const initialStudyRooms = [
  {
    id: "1",
    title: "Advanced Calculus",
    subject: "Mathematics",
    thumbnail: thumbMath,
    activeMembers: 12,
    totalDuration: "2h 30m",
  },
  {
    id: "2",
    title: "Quantum Physics",
    subject: "Physics",
    thumbnail: thumbPhysics,
    activeMembers: 8,
    totalDuration: "1h 45m",
  },
  {
    id: "3",
    title: "Cell Biology",
    subject: "Biology",
    thumbnail: thumbBiology,
    activeMembers: 15,
    totalDuration: "3h 10m",
  },
];

const Dashboard = () => {
  const [studyRooms, setStudyRooms] = useState(initialStudyRooms);
  const { user, signOut } = useAuth(); // Get user and signOut from context

  const handleCreateRoom = (room: { title: string; subject: string }) => {
    const newRoom = {
      id: String(studyRooms.length + 1),
      title: room.title,
      subject: room.subject,
      thumbnail: thumbMath, // Default thumbnail
      activeMembers: 0,
      totalDuration: "0h 0m",
    };
    setStudyRooms([...studyRooms, newRoom]);
  };
  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b border-border/50"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            StudySync
          </h1>
          
          {/* Conditional Auth Button */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Welcome, {user.username}
                </span>
                <Button variant="destructive" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[400px] overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>

        <div className="relative container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Collaborate & Learn
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Join real-time study sessions with peers around the world
            </p>

            <div className="flex gap-8 justify-center mt-8">
              <div className="flex items-center gap-2 text-foreground/80">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">35 Active Learners</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <Video className="w-5 h-5 text-secondary" />
                <span className="font-medium">3 Live Rooms</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <BookOpen className="w-5 h-5 text-accent" />
                <span className="font-medium">15+ Topics</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Study Rooms Section */}
      <section className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold">Active Study Rooms</h2>
              <p className="text-muted-foreground mt-1">Join a session and start learning</p>
            </div>
            <CreateRoomDialog onCreateRoom={handleCreateRoom} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <RoomCard {...room} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Dashboard;