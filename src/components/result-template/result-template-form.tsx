"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Search,
  FileText,
  Copy,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  apiClient,
  ResultTemplate,
  ResultTemplateRequest,
  ResultTemplateFilters,
} from "@/lib/api/client";

// Validation schema
const resultTemplateSchema = z.object({
  templateName: z
    .string()
    .min(1, "Tên mẫu kết quả không được để trống")
    .max(200, "Tên mẫu tối đa 200 ký tự"),
  resultTemplateCode: z
    .string()
    .max(100, "Mã mẫu kết quả tối đa 100 ký tự")
    .optional()
    .default(""),
  resultDescription: z
    .string()
    .min(1, "Mô tả kết quả không được để trống")
    .max(5000, "Mô tả kết quả tối đa 5000 ký tự"),
  resultConclude: z
    .string()
    .min(1, "Kết luận không được để trống")
    .max(2000, "Kết luận tối đa 2000 ký tự"),
  resultNote: z
    .string()
    .max(2000, "Ghi chú tối đa 2000 ký tự")
    .optional()
    .default(""),
});

type ResultTemplateFormData = z.infer<typeof resultTemplateSchema>;

// Form component for create/edit
function TemplateDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ResultTemplate | null;
  onSubmit: (data: ResultTemplateRequest) => void;
  isLoading: boolean;
}) {
  // Default templates with HTML format (bold titles and indented content)
  const defaultResultDescription = `<p style="padding-left: 0; margin-left: 0;"><strong>NHẬN XÉT ĐẠI THỂ:</strong></p><p style="padding-left: 20px;"></p><p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:</strong></p><p style="padding-left: 20px;"></p>`;
  const defaultResultConclude = `<p style="padding-left: 0; margin-left: 0;"><strong>CHẨN ĐOÁN MÔ BỆNH HỌC:</strong></p><p style="padding-left: 20px;"></p>`;
  const defaultResultNote = `<p style="padding-left: 0; margin-left: 0;"><strong>BÀN LUẬN:</strong></p><p style="padding-left: 20px;"></p><p style="padding-left: 0; margin-left: 0;"><strong>KHUYẾN NGHỊ:</strong></p><p style="padding-left: 20px;"></p><p style="padding-left: 0; margin-left: 0;"><strong>HỘI CHẨN:</strong></p><p style="padding-left: 20px;"></p>`;

  const form = useForm<ResultTemplateFormData>({
    resolver: zodResolver(resultTemplateSchema),
    defaultValues: {
      templateName: initialData?.templateName ?? "",
      resultTemplateCode: initialData?.resultTemplateCode ?? "",
      resultDescription:
        initialData?.resultDescription ?? defaultResultDescription,
      resultConclude: initialData?.resultConclude ?? defaultResultConclude,
      resultNote: initialData?.resultNote ?? defaultResultNote,
    },
  });

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      form.reset({
        templateName: initialData?.templateName ?? "",
        resultTemplateCode: initialData?.resultTemplateCode ?? "",
        resultDescription:
          initialData?.resultDescription ?? defaultResultDescription,
        resultConclude: initialData?.resultConclude ?? defaultResultConclude,
        resultNote: initialData?.resultNote ?? defaultResultNote,
      });
    }
  }, [open, initialData, form]);

  function handleSubmit(data: ResultTemplateFormData) {
    onSubmit(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? "Cập nhật mẫu kết quả"
              : "Tạo mẫu kết quả xét nghiệm mới"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Chỉnh sửa nội dung mẫu kết quả xét nghiệm."
              : "Nhập nội dung mẫu kết quả xét nghiệm."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <FormField
              control={form.control}
              name="resultTemplateCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã mẫu kết quả</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập mã mẫu kết quả (tùy chọn)..." {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {field.value?.length || 0} / 100 ký tự
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="templateName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên mẫu kết quả *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên mẫu kết quả..." {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {field.value?.length || 0} / 200 ký tự
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="resultDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả kết quả *</FormLabel>
                  <FormControl>
                    <div className="border rounded-md">
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Nhập mô tả chi tiết về kết quả xét nghiệm..."
                        minHeight="150px"
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {(field.value || "").replace(/<[^>]*>/g, "").length} / 5000
                    ký tự
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resultConclude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kết luận *</FormLabel>
                  <FormControl>
                    <div className="border rounded-md">
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Nhập kết luận về kết quả xét nghiệm..."
                        minHeight="120px"
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {(field.value || "").replace(/<[^>]*>/g, "").length} / 2000
                    ký tự
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resultNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <div className="border rounded-md">
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Nhập ghi chú về kết quả xét nghiệm (tùy chọn)..."
                        minHeight="150px"
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {(field.value || "").replace(/<[^>]*>/g, "").length} / 2000
                    ký tự
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            <DialogFooter className="mt-4 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Main component
export default function ResultTemplateForm() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResultTemplate | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<ResultTemplate | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build filters
  const filters: ResultTemplateFilters = {
    keyword: searchTerm || undefined,
    limit: pageSize,
    offset: currentPage * pageSize,
    sortBy: "createdAt",
    sortOrder: "DESC",
  };

  // Fetch templates
  const {
    data: templatesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["result-templates", filters],
    queryFn: () =>
      searchTerm
        ? apiClient.searchResultTemplates(filters)
        : apiClient.getResultTemplates(filters),
  });

  const createMutation = useMutation({
    mutationFn: async (newTemplate: ResultTemplateRequest) => {
      const response = await apiClient.createResultTemplate(newTemplate);
      if (!response.success) {
        const errorMessage =
          typeof response.error === "string"
            ? response.error
            : (response.error as any)?.message || "Không thể tạo mẫu kết quả";
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      toast({
        title: "Thành công",
        description:
          response.message || "Mẫu kết quả đã được tạo thành công",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo mẫu kết quả",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ResultTemplateRequest>;
    }) => {
      const response = await apiClient.updateResultTemplate(id, data);
      if (!response.success) {
        const errorMessage =
          typeof response.error === "string"
            ? response.error
            : (response.error as any)?.message || "Không thể cập nhật mẫu kết quả";
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      toast({
        title: "Thành công",
        description:
          response.message || "Mẫu kết quả đã được cập nhật thành công",
      });
      setIsCreateDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật mẫu kết quả",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteResultTemplate(id);
      if (!response.success) {
        const errorMessage =
          typeof response.error === "string"
            ? response.error
            : (response.error as any)?.message || "Không thể xóa mẫu kết quả";
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      toast({
        title: "Thành công",
        description:
          response.message || "Mẫu kết quả đã được xóa thành công",
      });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa mẫu kết quả",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = (data: ResultTemplateRequest) => {
    createMutation.mutate(data);
  };

  const handleUpdateTemplate = (data: ResultTemplateRequest) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    }
  };

  const handleEdit = (template: ResultTemplate) => {
    setEditingTemplate(template);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteTemplate = (template: ResultTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.id);
    }
  };

  const handleCopyTemplate = (template: ResultTemplate) => {
    const templateText = `Tên mẫu: ${template.templateName}\n\nMô tả: ${
      template.resultDescription
    }\n\nKết luận: ${template.resultConclude}\n\nGhi chú: ${
      template.resultNote || "Không có"
    }`;
    navigator.clipboard.writeText(templateText);
    toast({
      title: "Đã sao chép",
      description: "Nội dung mẫu đã được sao chép vào clipboard",
    });
  };

  const totalPages = templatesData?.data
    ? Math.ceil(templatesData.data.total / pageSize)
    : 0;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <CardTitle className="text-xl font-semibold text-red-600">
            Lỗi tải dữ liệu
          </CardTitle>
          <CardDescription className="text-red-500">
            Không thể tải dữ liệu mẫu kết quả. Vui lòng thử lại sau.
          </CardDescription>
          <p className="mt-2 text-sm text-red-700">
            {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">
              Quản lý mẫu kết quả
            </CardTitle>
            <CardDescription>
              Tạo và quản lý các mẫu kết quả xét nghiệm
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingTemplate(null);
              setIsCreateDialogOpen(true);
            }}
            className="medical-gradient"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm mẫu
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm nội dung mẫu..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%]">Tên mẫu</TableHead>
                      <TableHead className="w-[30%]">Mô tả</TableHead>
                      <TableHead className="w-[25%]">Kết luận</TableHead>
                      <TableHead className="w-[15%]">Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templatesData?.data?.data &&
                    templatesData.data.data.length > 0 ? (
                      templatesData.data.data.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-medical-100 rounded-full flex-shrink-0">
                                <FileText className="h-4 w-4 text-medical-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">
                                  {template.templateName}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
                              {template.resultDescription}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {template.resultDescription?.length || 0} ký tự
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700 line-clamp-2 whitespace-pre-wrap">
                              {template.resultConclude}
                            </div>
                            {template.resultNote && (
                              <div className="text-xs text-muted-foreground mt-1 italic">
                                Ghi chú: {template.resultNote.substring(0, 50)}
                                ...
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(template.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(template.createdAt).toLocaleTimeString(
                                "vi-VN"
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyTemplate(template)}
                                title="Sao chép"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(template)}
                                title="Chỉnh sửa"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTemplate(template)}
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {searchTerm
                            ? "Không tìm thấy mẫu nào"
                            : "Chưa có mẫu kết quả nào"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Trang {currentPage + 1} / {totalPages} (Tổng:{" "}
                    {templatesData?.data?.total || 0} mẫu)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={currentPage >= totalPages - 1}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <TemplateDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        initialData={editingTemplate}
        onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa mẫu kết quả này không? Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {templateToDelete && (
            <div className="my-4 p-4 bg-gray-50 rounded-md space-y-2">
              <div>
                <span className="text-sm font-semibold">Tên mẫu: </span>
                <span className="text-sm">{templateToDelete.templateName}</span>
              </div>
              <div>
                <span className="text-sm font-semibold">Mô tả: </span>
                <span className="text-sm">
                  {templateToDelete.resultDescription}
                </span>
              </div>
              <div>
                <span className="text-sm font-semibold">Kết luận: </span>
                <span className="text-sm">
                  {templateToDelete.resultConclude}
                </span>
              </div>
              {templateToDelete.resultNote && (
                <div>
                  <span className="text-sm font-semibold">Ghi chú: </span>
                  <span className="text-sm">{templateToDelete.resultNote}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTemplateToDelete(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
