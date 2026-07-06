import type { RiderDocument } from "@vantoo/shared";
export declare class DocumentService {
    list(riderId: string): Promise<RiderDocument[]>;
    upload(riderId: string, input: {
        documentType: string;
        documentNumber?: string;
        fileUrl: string;
        expiresAt?: string;
    }): Promise<RiderDocument>;
    verify(documentId: string, adminUserId: string): Promise<RiderDocument>;
}
export declare const documentService: DocumentService;
