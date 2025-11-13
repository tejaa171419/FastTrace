import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type ExportFormat = 'csv' | 'pdf';

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
}

interface UseTransactionExportReturn {
  isExporting: boolean;
  exportTransactions: (format: ExportFormat, filters?: ExportFilters) => Promise<void>;
  error: string | null;
}

/**
 * Custom hook for exporting transactions to CSV or PDF
 * @returns Export functionality with loading and error states
 */
export const useTransactionExport = (): UseTransactionExportReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Export transactions in the specified format
   */
  const exportTransactions = async (
    format: ExportFormat,
    filters: ExportFilters = {}
  ): Promise<void> => {
    try {
      setIsExporting(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      params.append('format', format);

      // Make API call to export endpoint
      const response = await apiClient.get(
        `/api/payments/export?${params.toString()}`,
        {},
        {
          responseType: 'blob', // Important for file download
        }
      );

      // Create blob and download file
      const blob = new Blob([response], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `transactions_${timestamp}.${format}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Transactions exported as ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to export transactions';
      setError(errorMessage);
      
      toast({
        title: 'Export Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportTransactions,
    error,
  };
};

export default useTransactionExport;
