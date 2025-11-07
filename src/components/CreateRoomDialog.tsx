import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const createRoomSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "Room name is required" })
    .max(100, { message: "Room name must be less than 100 characters" }),
  subject: z.string()
    .trim()
    .min(1, { message: "Subject is required" })
    .max(50, { message: "Subject must be less than 50 characters" }),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

interface CreateRoomDialogProps {
  onCreateRoom: (room: { title: string; subject: string }) => void;
}

const CreateRoomDialog = ({ onCreateRoom }: CreateRoomDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: "",
      subject: "",
    },
  });

  const onSubmit = (data: CreateRoomFormData) => {
    onCreateRoom({
      title: data.title,
      subject: data.subject,
    });
    toast({
      title: "Study room created!",
      description: `${data.title} has been created successfully.`,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Create Study Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Study Room</DialogTitle>
          <DialogDescription>
            Set up a new collaborative study session. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Advanced Calculus"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Mathematics"
                      {...field}
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Room</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
