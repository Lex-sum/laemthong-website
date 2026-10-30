import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductDataImport } from "@/components/admin/bulk-upload/product-data-import";
import { ProductImagesImport } from "@/components/admin/bulk-upload/product-images-import";

export const metadata: Metadata = {
  title: "Bulk Upload",
};

export default function BulkUploadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Upload className="h-6 w-6" />
            Bulk Upload Products
          </h1>
          <p className="text-sm text-muted-foreground">
            Import product data and product images separately — data first, images any time after.
          </p>
        </div>
      </div>

      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data">1. Product Data (CSV)</TabsTrigger>
          <TabsTrigger value="images">2. Product Images</TabsTrigger>
        </TabsList>
        {/* forceMount keeps each tab's progress when switching tabs */}
        <TabsContent value="data" forceMount className="data-[state=inactive]:hidden">
          <ProductDataImport />
        </TabsContent>
        <TabsContent value="images" forceMount className="data-[state=inactive]:hidden">
          <ProductImagesImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
