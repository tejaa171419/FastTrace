import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, 
  User, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Upload, 
  CheckCircle, 
  Edit3, 
  Eye, 
  Save,
  X,
  Mail,
  Phone,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import LoadingSpinner from "@/components/LoadingSpinner";

const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  occupation: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  // Address fields
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional()
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface FieldDisplayProps {
  label: string;
  value: string | undefined;
  icon?: React.ReactNode;
  isRequired?: boolean;
  isProtected?: boolean;
}

const FieldDisplay: React.FC<FieldDisplayProps> = ({ 
  label, 
  value, 
  icon, 
  isRequired = false, 
  isProtected = false 
}) => (
  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-sm font-medium text-foreground">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
          {isProtected && <Shield className="inline w-3 h-3 ml-1 text-amber-500" />}
        </p>
        <p className="text-sm text-muted-foreground">
          {value || (
            <span className="italic text-red-400">
              {isRequired ? "Required - Please complete" : "Not provided"}
            </span>
          )}
        </p>
      </div>
    </div>
    {isProtected && (
      <Badge variant="secondary" className="text-xs">
        Protected
      </Badge>
    )}
  </div>
);

const ImprovedPersonalInfoForm = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  const {
    user,
    isLoading,
    updateProfile,
    uploadAvatar,
    isUpdatingProfile,
    isUploadingAvatar,
    completionPercentage,
    isProfileComplete
  } = useProfile();

  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      gender: "prefer-not-to-say",
      occupation: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      bio: ""
    }
  });

  // Update form with user data when loaded
  useEffect(() => {
    if (user) {
      const formData = {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        gender: user.gender || "prefer-not-to-say",
        occupation: user.occupation || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        pincode: user.address?.pincode || "",
        country: user.address?.country || "India",
        bio: user.bio || ""
      };
      form.reset(formData);
      setPreviewUrl(user.avatar?.url || "");
    }
  }, [user, form]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  // Determine which fields are missing/incomplete
  const requiredFields = ['firstName', 'lastName', 'phone', 'dateOfBirth'];
  const incompleteRequiredFields = requiredFields.filter(field => {
    const value = user?.[field as keyof typeof user];
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  const optionalIncompleteFields = [
    { field: 'occupation', label: 'Occupation' },
    { field: 'bio', label: 'Bio' },
    { field: 'address.street', label: 'Street Address' },
    { field: 'address.city', label: 'City' },
    { field: 'address.state', label: 'State' },
    { field: 'address.pincode', label: 'PIN Code' }
  ].filter(({ field }) => {
    const value = field.includes('.') 
      ? user?.address?.[field.split('.')[1] as keyof typeof user.address]
      : user?.[field as keyof typeof user];
    return !value || (typeof value === 'string' && value.trim() === '');
  });

  const onSubmit = (data: PersonalInfoFormData) => {
    const updateData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: data.gender || undefined,
      occupation: data.occupation || undefined,
      bio: data.bio || undefined,
      address: {
        street: data.street || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        pincode: data.pincode || undefined,
        country: data.country || "India"
      }
    };
    
    updateProfile(updateData);
    setIsEditMode(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    
    // Clean up previous blob URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      uploadAvatar({
        avatarUrl: url,
        publicId: `avatar_${user?._id}_${Date.now()}`
      });
    } catch (error) {
      toast.error('Failed to upload avatar');
      // Clean up the blob URL on error
      URL.revokeObjectURL(url);
      setPreviewUrl(user?.avatar?.url || "");
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // Reset form to original values when canceling
      if (user) {
        const formData = {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: user.phone || "",
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
          gender: user.gender || "prefer-not-to-say",
          occupation: user.occupation || "",
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          pincode: user.address?.pincode || "",
          country: user.address?.country || "India",
          bio: user.bio || ""
        };
        form.reset(formData);
      }
    }
    setIsEditMode(!isEditMode);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="bg-card/90 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              {!isProfileComplete 
                ? `Complete your profile to unlock all features. ${incompleteRequiredFields.length} required field${incompleteRequiredFields.length !== 1 ? 's' : ''} remaining.`
                : "Your profile information is complete. You can update any details below."
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isProfileComplete && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                {completionPercentage}% Complete
              </Badge>
            )}
            <Button
              variant={isEditMode ? "destructive" : "outline"}
              size="sm"
              onClick={toggleEditMode}
              disabled={isUpdatingProfile}
            >
              {isEditMode ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Profile Completion Progress */}
        {!isProfileComplete && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile Completion</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}
        
        {isProfileComplete && (
          <div className="flex items-center gap-2 mt-4 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Profile Complete</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6 bg-card/90 backdrop-blur-lg">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={previewUrl} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {user?.firstName?.[0]}{user?.lastName?.[0] || <User className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary-dark transition-colors">
              {isUploadingAvatar ? (
                <Upload className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                className="hidden" 
                disabled={isUploadingAvatar}
              />
            </label>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Click the camera icon to upload a profile picture
            <br />
            <span className="text-xs">Max size: 5MB. Supported: JPG, PNG, GIF</span>
          </p>
        </div>

        {!isEditMode ? (
          // Display Mode - Show all data as read-only
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldDisplay
                  label="First Name"
                  value={user?.firstName}
                  isRequired
                  isProtected
                />
                <FieldDisplay
                  label="Last Name"
                  value={user?.lastName}
                  isRequired
                  isProtected
                />
                <FieldDisplay
                  label="Email Address"
                  value={user?.email}
                  icon={<Mail className="w-4 h-4" />}
                  isRequired
                  isProtected
                />
                <FieldDisplay
                  label="Phone Number"
                  value={user?.phone}
                  icon={<Phone className="w-4 h-4" />}
                  isRequired
                />
              </div>
            </div>

            <Separator />

            {/* Personal Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldDisplay
                  label="Date of Birth"
                  value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : undefined}
                  icon={<Calendar className="w-4 h-4" />}
                  isRequired
                />
                <FieldDisplay
                  label="Gender"
                  value={user?.gender ? user.gender.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : undefined}
                />
                <FieldDisplay
                  label="Occupation"
                  value={user?.occupation}
                  icon={<Briefcase className="w-4 h-4" />}
                />
              </div>
            </div>

            <Separator />

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h3>
              <div className="space-y-4">
                <FieldDisplay
                  label="Street Address"
                  value={user?.address?.street}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldDisplay
                    label="City"
                    value={user?.address?.city}
                  />
                  <FieldDisplay
                    label="State"
                    value={user?.address?.state}
                  />
                  <FieldDisplay
                    label="PIN Code"
                    value={user?.address?.pincode}
                  />
                </div>
                <FieldDisplay
                  label="Country"
                  value={user?.address?.country}
                />
              </div>
            </div>

            <Separator />

            {/* Bio */}
            <div>
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <FieldDisplay
                label="Bio"
                value={user?.bio}
              />
            </div>

            {/* Missing Information Alert */}
            {(incompleteRequiredFields.length > 0 || optionalIncompleteFields.length > 0) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">
                  Complete Your Profile
                </h4>
                {incompleteRequiredFields.length > 0 && (
                  <p className="text-sm text-amber-700 mb-2">
                    <strong>Required fields missing:</strong> {incompleteRequiredFields.join(', ')}
                  </p>
                )}
                {optionalIncompleteFields.length > 0 && (
                  <p className="text-sm text-amber-700">
                    <strong>Optional fields to complete:</strong> {optionalIncompleteFields.map(f => f.label).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          // Edit Mode - Show editable form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields - Only show if incomplete */}
              {incompleteRequiredFields.some(field => ['firstName', 'lastName'].includes(field)) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Complete Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incompleteRequiredFields.includes('firstName') && (
                      <FormField 
                        control={form.control} 
                        name="firstName" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your first name" className="bg-input border-border" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                    )}
                    {incompleteRequiredFields.includes('lastName') && (
                      <FormField 
                        control={form.control} 
                        name="lastName" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your last name" className="bg-input border-border" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Phone and Date of Birth - Only show if incomplete */}
              {incompleteRequiredFields.some(field => ['phone', 'dateOfBirth'].includes(field)) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Complete Required Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incompleteRequiredFields.includes('phone') && (
                      <FormField 
                        control={form.control} 
                        name="phone" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Phone Number *
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your phone number" className="bg-input border-border" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                    )}
                    {incompleteRequiredFields.includes('dateOfBirth') && (
                      <FormField 
                        control={form.control} 
                        name="dateOfBirth" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Date of Birth *
                            </FormLabel>
                            <FormControl>
                              <Input type="date" className="bg-input border-border" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Optional Fields - Show all for completion */}
              {optionalIncompleteFields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information (Optional)</h3>
                  
                  {/* Gender and Occupation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField 
                      control={form.control} 
                      name="gender" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} 
                    />
                    
                    <FormField 
                      control={form.control} 
                      name="occupation" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Occupation
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="What do you do for work?" className="bg-input border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} 
                    />
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-base font-medium">
                      <MapPin className="w-4 h-4" />
                      Address Information
                    </h4>
                    <FormField 
                      control={form.control} 
                      name="street" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter your street address" className="bg-input border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField 
                        control={form.control} 
                        name="city" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" className="bg-input border-border" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      <FormField 
                        control={form.control} 
                        name="state" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="State" className="bg-input border-border" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      <FormField 
                        control={form.control} 
                        name="pincode" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PIN Code</FormLabel>
                            <FormControl>
                              <Input placeholder="PIN Code" className="bg-input border-border" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                    </div>
                    
                    <FormField 
                      control={form.control} 
                      name="country" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" className="bg-input border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} 
                    />
                  </div>

                  {/* Bio */}
                  <FormField 
                    control={form.control} 
                    name="bio" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us a little about yourself..." className="min-h-[100px] bg-input border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-primary-dark" 
                  size="lg"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg"
                  onClick={toggleEditMode}
                  disabled={isUpdatingProfile}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default ImprovedPersonalInfoForm;