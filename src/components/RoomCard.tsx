import { Link } from "react-router-dom";
import { Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RoomCardProps {
  id: string;
  title: string;
  subject: string;
  thumbnail: string;
  activeMembers: number;
  totalDuration: string;
}

const RoomCard = ({ id, title, subject, thumbnail, activeMembers, totalDuration }: RoomCardProps) => {
  // Generate some sample user initials
  const sampleUsers = ["JD", "SM", "AK", "RP"].slice(0, Math.min(4, activeMembers));

  return (
    <Link to={`/room/${id}`}>
      <motion.div
        whileHover={{ y: -8 }}
        className="glass-card p-4 hover-lift cursor-pointer group"
      >
        {/* Thumbnail */}
        <div className="relative rounded-xl overflow-hidden mb-4">
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
            {subject}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{totalDuration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{activeMembers} active</span>
            </div>
          </div> */}

          {/* User Avatars */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <div className="flex -space-x-2">
              {sampleUsers.map((user, i) => (
                <Avatar key={i} className="w-8 h-8 border-2 border-card">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
           
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default RoomCard;
