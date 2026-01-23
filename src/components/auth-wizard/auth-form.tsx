"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useHisIntegration } from "@/hooks/use-his";
import {
  Loader2,
  Shield,
  Building2,
  CheckCircle,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const loginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập hoặc email là bắt buộc"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

const hisLoginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập HIS là bắt buộc"),
  password: z.string().min(1, "Mật khẩu HIS là bắt buộc"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type HisLoginFormData = z.infer<typeof hisLoginSchema>;

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("jwt");
  const [showPassword, setShowPassword] = useState(false);
  const [showHisPassword, setShowHisPassword] = useState(false);
  const { toast } = useToast();
  const { login } = useAuthStore();
  const {
    hisLoginWithCredentials,
    isLoggingInWithCredentials: isHisLoggingInWithCredentials,
    token: hisToken,
    tokenStatus,
    isLoggedIn: isHisLoggedIn,
  } = useHisIntegration();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const hisForm = useForm<HisLoginFormData>({
    resolver: zodResolver(hisLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);

    try {
      // Clear old session data before login
      if (typeof window !== "undefined") {
        localStorage.removeItem("tab-storage");
        localStorage.removeItem("current-room-storage");
        sessionStorage.clear();
      }

      // Call real API using API client
      const { apiClient } = await import("@/lib/api/client");
      const result = await apiClient.login({
        username: data.username,
        password: data.password,
      });

      if (result.success && result.data) {
        // Store in auth store (API client already has token from login method)
        login(result.data.accessToken, result.data.refreshToken, {
          id: result.data.user.id,
          username: result.data.user.username,
          email: result.data.user.email || '',
          fullName: result.data.user.fullName,
          role: result.data.user.role,
          isActive: typeof result.data.user.isActive === 'boolean' ? (result.data.user.isActive ? 1 : 0) : result.data.user.isActive,
        });

        // Save hisTokenCode to sessionStorage if available
        if (result.data.hisTokenCode && typeof window !== "undefined") {
          sessionStorage.setItem("hisTokenCode", result.data.hisTokenCode);
        }

        toast({
          title: "Đăng nhập thành công",
          description: `Chào mừng ${result.data.user.username}!`,
        });

        // Use window.location.href to ensure fresh page load
        window.location.href = "/dashboard";
      } else {
        // Don't throw error, let catch block handle it
        throw result;
      }
    } catch (error) {
      let errorMessage = "Đã xảy ra lỗi, vui lòng thử lại";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        // Handle API response error
        if ("error" in error && error.error) {
          if (typeof error.error === "object" && "message" in error.error) {
            errorMessage = String(error.error.message);
          } else {
            errorMessage = String(error.error);
          }
        } else if ("message" in error && error.message) {
          errorMessage = String(error.message);
        } else {
          errorMessage =
            "Đăng nhập thất bại - Vui lòng kiểm tra console để xem chi tiết";
        }
      }

      toast({
        title: "Đăng nhập thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleHisLoginWithCredentials(data: HisLoginFormData) {
    hisLoginWithCredentials({
      username: data.username,
      password: data.password,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-medical-100 p-4">
      <Card className="w-full max-w-md medical-shadow">
        <CardHeader className="text-center">
          <div className="flex justify-center">
              <Image
                src="/logo-bvbm-wh.png"
                alt="Bạch Mai Hospital Logo"
                width={80}
                height={80}
          
              />
            </div>
          <CardTitle className="text-2xl font-bold text-medical-900">
            Bạch Mai LIS
          </CardTitle>
          <CardDescription className="text-medical-600">
            Hệ thống quản lý thông tin phòng xét nghiệm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="jwt" className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                JWT Login
                            </TabsTrigger>
                            <TabsTrigger value="his" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                HIS Login
                            </TabsTrigger>
                        </TabsList> */}

            <TabsContent value="jwt">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-medical-900">Đăng nhập</h2>
              </div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên đăng nhập</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập tên đăng nhập"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mật khẩu</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu"
                              {...field}
                              disabled={isLoading}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full medical-gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      "Đăng nhập"
                    )}
                  </Button>
                </form>
              </Form>
              <div className="mt-4">
                <Link href="/auth/register">
                  <Button type="button" variant="outline" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Đăng ký tài khoản
                  </Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="his" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-medical-500 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Đăng nhập HIS</h3>
                  <p className="text-sm text-gray-600">
                    Đăng nhập trực tiếp vào hệ thống HIS của bệnh viện
                  </p>
                </div>

                {/* HIS Token Status */}
                {isHisLoggedIn && hisToken && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Đã đăng nhập HIS
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      User: {hisToken.userName} ({hisToken.userLoginName})
                    </p>
                    {tokenStatus && (
                      <p className="text-xs text-green-600">
                        Token còn hiệu lực: {tokenStatus.minutesUntilExpire}{" "}
                        phút
                      </p>
                    )}
                  </div>
                )}

                {/* HIS Login Form */}
                <Form {...hisForm}>
                  <form
                    onSubmit={hisForm.handleSubmit(
                      handleHisLoginWithCredentials
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={hisForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên đăng nhập HIS</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập tên đăng nhập HIS"
                              {...field}
                              disabled={isHisLoggingInWithCredentials}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={hisForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu HIS</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showHisPassword ? "text" : "password"}
                                placeholder="Nhập mật khẩu HIS"
                                {...field}
                                disabled={isHisLoggingInWithCredentials}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowHisPassword(!showHisPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                disabled={isHisLoggingInWithCredentials}
                              >
                                {showHisPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full medical-gradient"
                      disabled={isHisLoggingInWithCredentials}
                    >
                      {isHisLoggingInWithCredentials && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Building2 className="mr-2 h-4 w-4" />
                      Đăng nhập HIS
                    </Button>
                  </form>
                </Form>

                <div className="text-xs text-gray-500 text-center">
                  <p>Đăng nhập trực tiếp vào hệ thống HIS</p>
                  <p>Không cần đăng nhập JWT trước</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
