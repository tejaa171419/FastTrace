import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Phone, MessageSquare, Globe, CheckCircle, AlertCircle, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
const contactSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^[+]?[0-9\s\-()]+$/, "Please enter a valid phone number"),
  whatsapp: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  linkedin: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional()
});
type ContactFormData = z.infer<typeof contactSchema>;
interface ContactInfo {
  id: string;
  type: 'email' | 'phone' | 'whatsapp' | 'website' | 'linkedin' | 'emergency';
  value: string;
  label: string;
  isVerified: boolean;
  isPrimary: boolean;
  isPublic: boolean;
}
const ContactInformation = () => {
  const [contacts, setContacts] = useState<ContactInfo[]>([{
    id: "1",
    type: "email",
    value: "user@example.com",
    label: "Primary Email",
    isVerified: true,
    isPrimary: true,
    isPublic: true
  }, {
    id: "2",
    type: "phone",
    value: "+91-9876543210",
    label: "Mobile Number",
    isVerified: false,
    isPrimary: true,
    isPublic: false
  }]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactInfo | null>(null);
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
      phone: "",
      whatsapp: "",
      website: "",
      linkedin: "",
      emergencyContact: "",
      emergencyPhone: ""
    }
  });
  const onSubmit = (data: ContactFormData) => {
    const newContacts: ContactInfo[] = [];
    if (data.email) {
      newContacts.push({
        id: Date.now().toString(),
        type: "email",
        value: data.email,
        label: "Email",
        isVerified: false,
        isPrimary: false,
        isPublic: true
      });
    }
    if (data.phone) {
      newContacts.push({
        id: (Date.now() + 1).toString(),
        type: "phone",
        value: data.phone,
        label: "Phone Number",
        isVerified: false,
        isPrimary: false,
        isPublic: false
      });
    }
    if (data.whatsapp) {
      newContacts.push({
        id: (Date.now() + 2).toString(),
        type: "whatsapp",
        value: data.whatsapp,
        label: "WhatsApp",
        isVerified: false,
        isPrimary: false,
        isPublic: true
      });
    }
    if (data.website) {
      newContacts.push({
        id: (Date.now() + 3).toString(),
        type: "website",
        value: data.website,
        label: "Website",
        isVerified: false,
        isPrimary: false,
        isPublic: true
      });
    }
    if (data.linkedin) {
      newContacts.push({
        id: (Date.now() + 4).toString(),
        type: "linkedin",
        value: data.linkedin,
        label: "LinkedIn",
        isVerified: false,
        isPrimary: false,
        isPublic: true
      });
    }
    if (data.emergencyContact && data.emergencyPhone) {
      newContacts.push({
        id: (Date.now() + 5).toString(),
        type: "emergency",
        value: `${data.emergencyContact} - ${data.emergencyPhone}`,
        label: "Emergency Contact",
        isVerified: false,
        isPrimary: false,
        isPublic: false
      });
    }
    setContacts([...contacts, ...newContacts]);
    setShowAddForm(false);
    form.reset();
    toast.success("Contact information added successfully!");
  };
  const deleteContact = (id: string) => {
    setContacts(contacts.filter(contact => contact.id !== id));
    toast.success("Contact information removed!");
  };
  const verifyContact = (id: string) => {
    setContacts(contacts.map(contact => contact.id === id ? {
      ...contact,
      isVerified: true
    } : contact));
    toast.success("Contact verified successfully!");
  };
  const setPrimary = (id: string, type: string) => {
    setContacts(contacts.map(contact => ({
      ...contact,
      isPrimary: contact.id === id && contact.type === type
    })));
    toast.success("Primary contact updated!");
  };
  const togglePublic = (id: string) => {
    setContacts(contacts.map(contact => contact.id === id ? {
      ...contact,
      isPublic: !contact.isPublic
    } : contact));
    toast.success("Privacy setting updated!");
  };
  const getContactIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'phone':
        return <Phone className="w-5 h-5" />;
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5" />;
      case 'website':
        return <Globe className="w-5 h-5" />;
      case 'linkedin':
        return <Globe className="w-5 h-5" />;
      case 'emergency':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };
  const getContactColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'text-blue-600';
      case 'phone':
        return 'text-primary';
      case 'whatsapp':
        return 'text-success';
      case 'website':
        return 'text-purple-600';
      case 'linkedin':
        return 'text-blue-700';
      case 'emergency':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  return <div className="space-y-6">
      {/* Header Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Mail className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Manage your contact details for communication and emergency purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-accent/10 border-accent/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can control which contact information is public and visible to others in your groups.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Contact List */}
      <div className="space-y-4">
        {contacts.map(contact => <Card key={contact.id} className="glass-card">
            <CardContent className="p-6 bg-card/90 backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full ${getContactColor(contact.type)}`}>
                    {getContactIcon(contact.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-card-foreground">
                        {contact.label}
                      </h3>
                      {contact.isPrimary && <Badge variant="default">Primary</Badge>}
                      {contact.isVerified ? <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge> : <Badge variant="outline">Unverified</Badge>}
                      <Badge variant={contact.isPublic ? "secondary" : "outline"}>
                        {contact.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">
                      {contact.value}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-muted-foreground">Public</label>
                    <Switch checked={contact.isPublic} onCheckedChange={() => togglePublic(contact.id)} className="bg-zinc-50 text-zinc-950" />
                  </div>
                  {!contact.isVerified && <Button variant="outline" size="sm" onClick={() => verifyContact(contact.id)} className="bg-blue-600 hover:bg-blue-500 text-gray-950">
                      Verify
                    </Button>}
                  {!contact.isPrimary && ['email', 'phone'].includes(contact.type) && <Button variant="outline" size="sm" onClick={() => setPrimary(contact.id, contact.type)}>
                      Set Primary
                    </Button>}
                  <Button variant="outline" size="sm" onClick={() => deleteContact(contact.id)} className="bg-zinc-50 text-gray-950">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Add New Contact Form */}
      {showAddForm ? <Card className="glass-card">
          <CardHeader>
            <CardTitle>Add Contact Information</CardTitle>
            <CardDescription>
              Add your contact details to help others reach you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Primary Contacts */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-card-foreground">Primary Contacts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="phone" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91-9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                </div>

                {/* Social & Professional */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-card-foreground">Social & Professional</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="whatsapp" render={({
                  field
                }) => <FormItem>
                          <FormLabel>WhatsApp Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91-9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="website" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourwebsite.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                  <FormField control={form.control} name="linkedin" render={({
                field
              }) => <FormItem>
                        <FormLabel>LinkedIn Profile</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-card-foreground">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="emergencyContact" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Emergency Contact (Relation)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="emergencyPhone" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Emergency Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+91-9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="bg-primary hover:bg-primary-dark">
                    Add Contact Information
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                setShowAddForm(false);
                form.reset();
              }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card> : <Button onClick={() => setShowAddForm(true)} className="w-full bg-primary hover:bg-primary-dark" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact Information
        </Button>}
    </div>;
};
export default ContactInformation;