export type BulkUploadResultItem = {
  filename: string;
  success: boolean;
  callId?: string;
  error?: string;
};

export type BulkUploadResponse = {
  results: BulkUploadResultItem[];
  summary: { total: number; succeeded: number; failed: number };
};
