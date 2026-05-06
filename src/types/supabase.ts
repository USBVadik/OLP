export type Database = {
  public: {
    Tables: {
      payment_links: {
        Row: {
          id: string;
          merchant_id: string;
          merchant_address: string;
          amount: string;
          token: string;
          destination_chain_id: number;
          destination_token_address: string | null;
          label: string | null;
          status: "active" | "expired" | "completed" | "failed";
          contract_invoice_id: string | null;
          receipt_emitter_address: string | null;
          registered_tx_hash: string | null;
          paid_tx_hash: string | null;
          paid_at: string | null;
          error_message: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          merchant_id: string;
          merchant_address: string;
          amount: string;
          token: string;
          destination_chain_id?: number;
          destination_token_address?: string | null;
          label?: string | null;
          status?: "active" | "expired" | "completed" | "failed";
          contract_invoice_id?: string | null;
          receipt_emitter_address?: string | null;
          registered_tx_hash?: string | null;
          paid_tx_hash?: string | null;
          paid_at?: string | null;
          error_message?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["payment_links"]["Insert"]
        >;
      };
      payments: {
        Row: {
          id: string;
          payment_link_id: string;
          payer_address: string;
          source_chain_id: number;
          destination_chain_id: number;
          token: string;
          amount: string;
          tx_hash: string | null;
          receipt_tx_hash: string | null;
          status: "pending" | "processing" | "completed" | "failed";
          preview_json: unknown | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["payments"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      merchants: {
        Row: {
          id: string;
          wallet_address: string;
          name: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["merchants"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["merchants"]["Insert"]>;
      };
    };
  };
};
