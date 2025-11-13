import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, User, Calendar, IndianRupee } from 'lucide-react';
import { settlementPaymentService } from '../../lib/services/settlementPaymentService';

interface PendingSettlement {
  id: string;
  from: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: { url?: string };
  };
  groupId: {
    _id: string;
    name: string;
  };
  amount: number;
  currency: string;
  method: string;
  description: string;
  createdAt: string;
}

interface Props {
  settlement: PendingSettlement;
  onConfirm: () => void;
  onReject: () => void;
}

export const PendingSettlementNotification: React.FC<Props> = ({
  settlement,
  onConfirm,
  onReject
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleConfirm = async () => {
    if (!showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }

    try {
      setIsConfirming(true);
      await settlementPaymentService.confirmSettlement(
        settlement.id,
        confirmMessage || 'Payment received successfully'
      );
      onConfirm();
    } catch (error: any) {
      alert(`Failed to confirm settlement: ${error.message}`);
    } finally {
      setIsConfirming(false);
      setShowConfirmDialog(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setIsRejecting(true);
      await settlementPaymentService.rejectSettlement(settlement.id, rejectionReason);
      onReject();
    } catch (error: any) {
      alert(`Failed to reject settlement: ${error.message}`);
    } finally {
      setIsRejecting(false);
      setShowRejectDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
      {/* Header with Alert Icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">
            Settlement Payment Received
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Confirmation required to update your balance
          </p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-lg p-4 mb-3 space-y-2">
        {/* From User */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">From:</span>
          <span className="font-medium text-gray-900">
            {settlement.from.firstName} {settlement.from.lastName}
          </span>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="font-bold text-green-600 text-lg">
            ₹{settlement.amount.toFixed(2)}
          </span>
        </div>

        {/* Group */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Group:</span>
          <span className="font-medium text-gray-900">
            {settlement.groupId.name}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Sent:</span>
          <span className="text-sm text-gray-700">
            {formatDate(settlement.createdAt)}
          </span>
        </div>

        {/* Description */}
        {settlement.description && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600 italic">
              "{settlement.description}"
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add a confirmation message (optional):
          </label>
          <textarea
            value={confirmMessage}
            onChange={(e) => setConfirmMessage(e.target.value)}
            placeholder="e.g., Thank you! Payment received."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows={2}
          />
        </div>
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for rejection: *
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please explain why you're rejecting this payment..."
            className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:ring-red-500 focus:border-red-500"
            rows={3}
            required
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!showRejectDialog && !showConfirmDialog && (
          <>
            <button
              onClick={handleConfirm}
              disabled={isConfirming || isRejecting}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {isConfirming ? 'Confirming...' : 'Confirm Receipt'}
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={isConfirming || isRejecting}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
          </>
        )}

        {showConfirmDialog && (
          <>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isConfirming ? 'Confirming...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowConfirmDialog(false)}
              disabled={isConfirming}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        {showRejectDialog && (
          <>
            <button
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRejecting ? 'Rejecting...' : 'Submit Rejection'}
            </button>
            <button
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={isRejecting}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Warning Message */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        ⚠️ Only confirm if you've actually received the payment
      </p>
    </div>
  );
};
