import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  UserPlus,
  UserX,
  MessageSquare,
  Clock,
  Check,
  X,
  Calendar,
  Mail,
  AlertCircle,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useJoinRequests, useApproveJoinRequest, useRejectJoinRequest } from '@/hooks/useGroups';
import type { JoinRequest } from '@/lib/types';

interface JoinRequestsManagerProps {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
}

export const JoinRequestsManager = ({ groupId, groupName, isAdmin }: JoinRequestsManagerProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // API hooks
  const { data: joinRequestsData, isLoading, error } = useJoinRequests(
    groupId, 
    activeTab as 'pending' | 'approved' | 'rejected' | 'all'
  );
  const approveRequestMutation = useApproveJoinRequest();
  const rejectRequestMutation = useRejectJoinRequest();

  if (!isAdmin) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Admin Access Required</h3>
          <p className="text-white/60">Only group admins can manage join requests.</p>
        </CardContent>
      </Card>
    );
  }

  const handleApproveRequest = async (request: JoinRequest) => {
    try {
      await approveRequestMutation.mutateAsync({
        groupId,
        requestId: request._id
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      await rejectRequestMutation.mutateAsync({
        groupId,
        requestId: selectedRequest._id,
        reason: rejectionReason.trim() || undefined
      });
      
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      // Error handled in mutation
    }
  };

  const openRejectDialog = (request: JoinRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTabCounts = () => {
    if (!joinRequestsData?.requests) return { pending: 0, approved: 0, rejected: 0 };
    
    const requests = joinRequestsData.requests;
    return {
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  };

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Requests</h3>
          <p className="text-white/60 mb-4">Unable to load join requests. Please try again.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tabCounts = getTabCounts();

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Users className="w-5 h-5" />
          Join Requests
        </CardTitle>
        <CardDescription>
          Manage join requests for "{groupName}"
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Pending {tabCounts.pending > 0 && `(${tabCounts.pending})`}
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Approved {tabCounts.approved > 0 && `(${tabCounts.approved})`}
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Rejected {tabCounts.rejected > 0 && `(${tabCounts.rejected})`}
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner className="w-6 h-6" />
              <span className="ml-2 text-white/70">Loading requests...</span>
            </div>
          ) : (
            <TabsContent value={activeTab} className="space-y-4">
              {joinRequestsData?.requests && joinRequestsData.requests.length > 0 ? (
                <div className="space-y-4">
                  {joinRequestsData.requests.map((request) => (
                    <Card key={request._id} className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12 border-2 border-primary/20">
                            <AvatarImage src={request.user.avatar?.url} />
                            <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                              {request.user.firstName.charAt(0)}
                              {request.user.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-white">
                                  {request.user.firstName} {request.user.lastName}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-white/60">
                                  <Mail className="w-3 h-3" />
                                  <span>{request.user.email}</span>
                                </div>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>

                            {request.message && (
                              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium text-white">Message</span>
                                </div>
                                <p className="text-white/80 text-sm leading-relaxed">
                                  {request.message}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-white/50">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Requested: {formatDate(request.requestedAt)}</span>
                                </div>
                                {request.reviewedAt && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>Reviewed: {formatDate(request.reviewedAt)}</span>
                                  </div>
                                )}
                              </div>

                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveRequest(request)}
                                    disabled={approveRequestMutation.isPending}
                                    className="bg-success hover:bg-success/80 text-white"
                                  >
                                    {approveRequestMutation.isPending ? (
                                      <LoadingSpinner className="w-3 h-3 mr-1" />
                                    ) : (
                                      <Check className="w-3 h-3 mr-1" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openRejectDialog(request)}
                                    disabled={rejectRequestMutation.isPending}
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {request.status === 'rejected' && request.rejectionReason && (
                                <div className="bg-destructive/20 rounded-lg p-2 border border-destructive/30">
                                  <p className="text-xs text-destructive font-medium">Reason:</p>
                                  <p className="text-xs text-destructive/80">{request.rejectionReason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No {activeTab} requests
                  </h3>
                  <p className="text-white/60">
                    {activeTab === 'pending' 
                      ? "No pending join requests at the moment."
                      : `No ${activeTab} requests to show.`
                    }
                  </p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* Reject Request Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gradient-cyber">Reject Join Request</DialogTitle>
            <DialogDescription className="text-white/70">
              Provide a reason for rejecting this request (optional).
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedRequest.user.avatar?.url} />
                  <AvatarFallback className="bg-gradient-primary text-white font-semibold text-sm">
                    {selectedRequest.user.firstName.charAt(0)}
                    {selectedRequest.user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">
                    {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                  </p>
                  <p className="text-sm text-white/60">{selectedRequest.user.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Rejection Reason (Optional)</Label>
                <Textarea
                  placeholder="Explain why you're rejecting this request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-white/40">{rejectionReason.length}/200 characters</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectDialogOpen(false);
                    setRejectionReason('');
                    setSelectedRequest(null);
                  }}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  disabled={rejectRequestMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejectRequest}
                  className="flex-1"
                  disabled={rejectRequestMutation.isPending}
                >
                  {rejectRequestMutation.isPending ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Reject Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default JoinRequestsManager;