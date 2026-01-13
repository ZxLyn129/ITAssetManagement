export interface Asset {
    id: string;
    name: string;
    type: string;
    status: number | string;
    assignedTo?: string;
    purchaseDate?: string;
    warrantyExpiry?: string;
    remarks?: string;

    statusText?: string;
    statusColor?: string;
    assignedUsername?: string;
}
