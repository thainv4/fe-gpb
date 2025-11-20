---
alwaysApply: true
---
# Quy tắc phát triển ứng dụng Next.js tối ưu

Bộ quy tắc này hướng dẫn các nhà phát triển full-stack xây dựng ứng dụng **Next.js** sử dụng **TypeScript**, **React**, **Shadcn UI**, **Radix UI**, và **Tailwind CSS**, đảm bảo hiệu suất cao, bảo mật, khả năng tiếp cận, và dễ bảo trì. Quy tắc được thiết kế cho các dự án từ nhỏ đến lớn, với trọng tâm là **Client-Side Rendering (CSR)**, **Interactive Components**, **Web Vitals**, và quy trình phát triển có hệ thống.

## Mục tiêu
- Tạo ứng dụng Next.js tối ưu về hiệu suất, bảo mật, và khả năng bảo trì.
- Đảm bảo mã sạch, dễ đọc, và tuân thủ các tiêu chuẩn hiện đại.
- Hỗ trợ khả năng tiếp cận (accessibility) và trải nghiệm người dùng tốt trên mọi thiết bị.

---

## Cấu trúc và tổ chức dự án (Project Structure and Organization Best Practices)

- **Tổ chức thư mục theo mô-đun**:
  - Chia dự án thành các thư mục chức năng, mỗi thư mục đại diện cho một tính năng hoặc thành phần độc lập.
  - Cấu trúc thư mục đề xuất:
    ```
    app/
      components/                 # Các component chung
        ui/                       # Component UI từ Shadcn UI
        auth-wizard/              # Tính năng xác thực
          auth-form.tsx           # Component chính
          subcomponents/          # Component con
          helpers.ts              # Hàm hỗ trợ
          types.ts                # Interface TypeScript
          content.ts              # Dữ liệu tĩnh
      lib/                        # Hàm tiện ích và logic chung
        utils.ts                 # Hàm tiện ích (e.g., cn từ Shadcn)
        api.ts                   # Hàm gọi API
        stores/                  # Zustand stores
      pages/                      # Các route của Next.js App Router
        api/                     # API routes
        [route]/                 # Dynamic routes
      public/                     # Tài nguyên tĩnh (hình ảnh, font)
        images/                  # Hình ảnh tối ưu (WebP)
      tests/                      # Các file kiểm thử
        components/             # Unit tests cho component
        integration/            # Integration tests
      stories/                    # Storybook stories
    ```

- **Nguyên tắc tổ chức**:
  - **Tách biệt logic và giao diện**: Đặt logic nghiệp vụ vào `lib/` và giao diện vào `components/`.
  - **Tính năng theo thư mục**: Mỗi tính năng (e.g., `auth-wizard`, `dashboard`) có thư mục riêng với đầy đủ component, subcomponent, helper, types, và content.
  - **Tài nguyên tĩnh**: Lưu hình ảnh, font trong `public/` với định dạng tối ưu (WebP cho hình ảnh).
  - **Kiểm thử gần mã nguồn**: Đặt file kiểm thử gần component (e.g., `auth-form.test.tsx` trong `auth-wizard/`), hoặc trong thư mục `tests/` cho kiểm thử lớn.
  - **Storybook cho tài liệu hóa**: Lưu các story trong `stories/` để tài liệu hóa component.

- **Quy ước đặt tên thư mục**:
  - Sử dụng chữ thường, dấu gạch ngang (e.g., `auth-wizard`, `user-profile`).
  - Tên thư mục phản ánh chức năng hoặc tính năng (e.g., `checkout-flow`, `blog-posts`).

- **Quản lý API routes**:
  - Đặt các route API trong `app/api/` với cấu trúc rõ ràng:
    ```
    app/api/
      auth/
        login/route.ts         # POST /api/auth/login
        register/route.ts      # POST /api/auth/register
      users/
        [id]/route.ts         # GET /api/users/:id
    ```

- **Ví dụ cấu trúc dự án**:
  - Một dự án mẫu với tính năng đăng nhập:
    ```
    app/
      components/
        ui/
          button.tsx           # Shadcn UI Button
          input.tsx            # Shadcn UI Input
        auth-wizard/
          auth-form.tsx        # Component chính
          subcomponents/
            auth-input.tsx     # Input con
          helpers.ts           # Hàm xử lý form
          types.ts             # Interface AuthFormProps
          content.ts           # Dữ liệu tĩnh (e.g., placeholder text)
      lib/
        api.ts                # Hàm gọi API (fetchUser, fetchAuth)
        utils.ts              # Hàm tiện ích (cn, sanitize)
        stores/
          auth.ts             # Zustand store cho trạng thái xác thực
      pages/
        auth/
          page.tsx            # Route /auth
        api/
          auth/login/route.ts # API đăng nhập
      public/
        images/
          logo.webp           # Hình ảnh tối ưu
      tests/
        auth-form.test.tsx    # Unit test cho auth-form
      stories/
        auth-form.stories.tsx # Storybook story
    ```

---

## Phong cách và cấu trúc mã

- **Viết mã TypeScript ngắn gọn, kỹ thuật**:
  - Cung cấp ví dụ mã chính xác và thực tiễn.
  - Ví dụ:
    ```tsx
    // app/components/button.tsx
    interface ButtonProps {
      isLoading: boolean;
      onClick: () => void;
    }
    export function PrimaryButton({ isLoading, onClick }: ButtonProps) {
      return (
        <button disabled={isLoading} onClick={onClick}>
          {isLoading ? 'Đang xử lý...' : 'Gửi'}
        </button>
      );
    }
    ```

- **Sử dụng lập trình hàm và khai báo**:
  - Tránh sử dụng lớp (`classes`) để giữ mã đơn giản và phù hợp với React.
  - Ưu tiên các mẫu như `map`, `filter`, và `reduce`.

- **Tránh lặp mã**:
  - Sử dụng lặp lại và mô-đun hóa để tái sử dụng mã:
    ```tsx
    // lib/utils.ts
    export function cn(...classes: string[]) {
      return classes.filter(Boolean).join(' ');
    }
    ```

- **Tên biến mô tả**:
  - Sử dụng động từ phụ trợ (e.g., `isLoading`, `hasError`, `shouldFetch`).

- **Cấu trúc tệp trong mô-đun**:
  - Mỗi thư mục tính năng chứa:
    - Component chính (e.g., `auth-form.tsx`).
    - Subcomponents (trong `subcomponents/`).
    - Hàm hỗ trợ (`helpers.ts`).
    - Interface TypeScript (`types.ts`).
    - Dữ liệu tĩnh (`content.ts`).

---

## Quy ước đặt tên

- **Thư mục**:
  - Chữ thường, dấu gạch ngang (e.g., `components/auth-wizard`).

- **Component**:
  - Sử dụng **named exports**:
    ```tsx
    export function AuthForm() { ... }
    ```

- **Tệp**:
  - Tên tệp khớp với component chính (e.g., `auth-form.tsx`).

---

## Sử dụng TypeScript

- **TypeScript bắt buộc**:
  - Mọi mã phải sử dụng TypeScript.

- **Ưu tiên interface hơn type**:
  - Sử dụng `interface` cho props và dữ liệu có cấu trúc:
    ```tsx
    interface UserProps {
      id: string;
      name: string;
    }
    ```
  - Cho phép `type` cho union/intersection:
    ```tsx
    type Status = 'active' | 'inactive';
    ```

- **Tránh enum**:
  - Sử dụng đối tượng `as const`:
    ```tsx
    const Status = {
      Active: 'active',
      Inactive: 'inactive',
    } as const;
    type StatusType = typeof Status[keyof typeof Status];
    ```

- **Component hàm**:
  - Chỉ sử dụng functional components với interface:
    ```tsx
    interface ButtonProps {
      label: string;
    }
    function Button({ label }: ButtonProps) {
      return <button>{label}</button>;
    }
    ```

---

## Cú pháp và định dạng

- **Sử dụng từ khóa `function` cho hàm thuần túy**:
  - Ví dụ:
    ```tsx
    function calculateTotal(items: number[]) {
      return items.reduce((sum, item) => sum + item, 0);
    }
    ```

- **Tối giản cú pháp điều kiện**:
  - Tránh dấu ngoặc nhọn không cần thiết:
    ```tsx
    if (isLoading) return <div>Đang tải...</div>;
    ```

- **JSX khai báo**:
  - Viết JSX dễ đọc, cấu trúc rõ ràng:
    ```tsx
    return (
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <Item key={item.id} {...item} />
        ))}
      </div>
    );
    ```

---

## Shadcn UI Setup và Best Practices

- **Shadcn UI Installation**:
  - Cài đặt và cấu hình:
    ```bash
    # Cài đặt Shadcn UI
    npx shadcn-ui@latest init
    
    # Cài đặt components cần thiết
    npx shadcn-ui@latest add button
    npx shadcn-ui@latest add input
    npx shadcn-ui@latest add card
    npx shadcn-ui@latest add form
    npx shadcn-ui@latest add dialog
    npx shadcn-ui@latest add dropdown-menu
    npx shadcn-ui@latest add toast
    ```

- **Configuration Files**:
  - `components.json`:
    ```json
    {
      "$schema": "https://ui.shadcn.com/schema.json",
      "style": "default",
      "rsc": true,
      "tsx": true,
      "tailwind": {
        "config": "tailwind.config.js",
        "css": "app/globals.css",
        "baseColor": "slate",
        "cssVariables": true,
        "prefix": ""
      },
      "aliases": {
        "components": "@/components",
        "utils": "@/lib/utils"
      }
    }
    ```

  - `lib/utils.ts` (cn function):
    ```tsx
    import { type ClassValue, clsx } from "clsx"
    import { twMerge } from "tailwind-merge"
    
    export function cn(...inputs: ClassValue[]) {
      return twMerge(clsx(inputs))
    }
    ```

- **Component Structure**:
  - Tổ chức components theo Shadcn UI:
    ```
    components/
      ui/                    # Shadcn UI components
        button.tsx
        input.tsx
        card.tsx
        form.tsx
        dialog.tsx
        dropdown-menu.tsx
        toast.tsx
        ...
      custom/                # Custom components
        auth-form.tsx
        user-profile.tsx
        ...
    ```

- **Component Usage Patterns**:
  - Sử dụng Shadcn UI components:
    ```tsx
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
    
    function AuthForm() {
      return (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Đăng nhập</CardTitle>
          </CardHeader>
          <CardContent>
            <Form>
              <FormField
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Đăng nhập
              </Button>
            </Form>
          </CardContent>
        </Card>
      );
    }
    ```

- **Theme Customization**:
  - Custom theme với CSS variables:
    ```css
    /* app/globals.css */
    @layer base {
      :root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --card: 0 0% 100%;
        --card-foreground: 222.2 84% 4.9%;
        --popover: 0 0% 100%;
        --popover-foreground: 222.2 84% 4.9%;
        --primary: 221.2 83.2% 53.3%;
        --primary-foreground: 210 40% 98%;
        --secondary: 210 40% 96%;
        --secondary-foreground: 222.2 84% 4.9%;
        --muted: 210 40% 96%;
        --muted-foreground: 215.4 16.3% 46.9%;
        --accent: 210 40% 96%;
        --accent-foreground: 222.2 84% 4.9%;
        --destructive: 0 84.2% 60.2%;
        --destructive-foreground: 210 40% 98%;
        --border: 214.3 31.8% 91.4%;
        --input: 214.3 31.8% 91.4%;
        --ring: 221.2 83.2% 53.3%;
        --radius: 0.5rem;
      }
      
      .dark {
        --background: 222.2 84% 4.9%;
        --foreground: 210 40% 98%;
        --card: 222.2 84% 4.9%;
        --card-foreground: 210 40% 98%;
        --popover: 222.2 84% 4.9%;
        --popover-foreground: 210 40% 98%;
        --primary: 217.2 91.2% 59.8%;
        --primary-foreground: 222.2 84% 4.9%;
        --secondary: 217.2 32.6% 17.5%;
        --secondary-foreground: 210 40% 98%;
        --muted: 217.2 32.6% 17.5%;
        --muted-foreground: 215 20.2% 65.1%;
        --accent: 217.2 32.6% 17.5%;
        --accent-foreground: 210 40% 98%;
        --destructive: 0 62.8% 30.6%;
        --destructive-foreground: 210 40% 98%;
        --border: 217.2 32.6% 17.5%;
        --input: 217.2 32.6% 17.5%;
        --ring: 224.3 76.3% 94.1%;
      }
    }
    ```

- **Component Composition**:
  - Tạo composite components:
    ```tsx
    // components/custom/data-table.tsx
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    
    interface DataTableProps<T> {
      data: T[];
      columns: ColumnDef<T>[];
      searchKey?: string;
      onEdit?: (item: T) => void;
      onDelete?: (item: T) => void;
    }
    
    export function DataTable<T>({ data, columns, searchKey, onEdit, onDelete }: DataTableProps<T>) {
      return (
        <div className="space-y-4">
          {searchKey && (
            <Input
              placeholder={`Tìm kiếm ${searchKey}...`}
              className="max-w-sm"
            />
          )}
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.id}>{column.header}</TableHead>
                ))}
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.cell ? column.cell(item) : item[column.accessorKey]}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-2">
                      {onEdit && (
                        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                          Sửa
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="destructive" size="sm" onClick={() => onDelete(item)}>
                          Xóa
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    ```

- **Form Integration**:
  - Sử dụng với React Hook Form và Zod:
    ```tsx
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import { z } from 'zod';
    import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    
    const userSchema = z.object({
      name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
      email: z.string().email('Email không hợp lệ'),
      age: z.number().min(18, 'Tuổi phải từ 18 trở lên'),
    });
    
    type UserFormData = z.infer<typeof userSchema>;
    
    function UserForm() {
      const form = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
          name: '',
          email: '',
          age: 18,
        },
      });
    
      function onSubmit(data: UserFormData) {
        console.log(data);
      }
    
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Gửi</Button>
          </form>
        </Form>
      );
    }
    ```

- **Toast Notifications**:
  - Sử dụng toast cho feedback:
    ```tsx
    import { useToast } from '@/hooks/use-toast';
    import { Button } from '@/components/ui/button';
    
    function ActionButton() {
      const { toast } = useToast();
    
      function handleSuccess() {
        toast({
          title: 'Thành công',
          description: 'Thao tác đã được thực hiện thành công.',
        });
      }
    
      function handleError() {
        toast({
          title: 'Lỗi',
          description: 'Đã xảy ra lỗi, vui lòng thử lại.',
          variant: 'destructive',
        });
      }
    
      return (
        <div className="space-x-2">
          <Button onClick={handleSuccess}>Thành công</Button>
          <Button onClick={handleError} variant="destructive">Lỗi</Button>
        </div>
      );
    }
    ```

- **Best Practices**:
  - **Component Naming**: Sử dụng PascalCase cho component names
  - **Props Interface**: Luôn define interface cho component props
  - **Accessibility**: Shadcn UI components đã có accessibility built-in
  - **Customization**: Sử dụng `cn()` function để merge classes
  - **Composition**: Tạo composite components từ Shadcn UI primitives
  - **Theme**: Sử dụng CSS variables cho consistent theming

---

## UI và định dạng

- **Thiết kế responsive**:
  - Áp dụng **mobile-first**:
    ```tsx
    <div className="p-4 sm:p-6 md:p-8">Nội dung</div>
    ```

- **Khả năng tiếp cận**:
  - Sử dụng ARIA attributes:
    ```tsx
    <button aria-label="Gửi biểu mẫu">Gửi</button>
    ```
  - Kiểm tra accessibility với **Lighthouse** hoặc **axe**.

---

## Tối ưu hóa hiệu suất

- **Ưu tiên Client-Side Rendering (CSR)**:
  - Sử dụng `'use client'` cho tất cả interactive components:
    ```tsx
    'use client';
    import { useState, useEffect } from 'react';
    
    export function UserList() {
      const [users, setUsers] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      
      useEffect(() => {
        async function fetchUsers() {
          const data = await fetchUsers();
          setUsers(data);
          setIsLoading(false);
        }
        fetchUsers();
      }, []);
      
      if (isLoading) return <div>Đang tải...</div>;
      return <div>{users.map((user) => <User key={user.id} {...user} />)}</div>;
    }
    ```

- **Client-side data fetching với React Query**:
  - Ví dụ:
    ```tsx
    'use client';
    import { useQuery } from '@tanstack/react-query';
    
    export default function Page() {
      const { data, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: () => fetch('/api/users').then(res => res.json()),
      });
      
      if (isLoading) return <div>Đang tải...</div>;
      if (error) return <div>Lỗi: {error.message}</div>;
      
      return <UserList users={data} />;
    }
    ```

- **Tải động với Client-side**:
  - Sử dụng dynamic imports với client-side rendering:
    ```tsx
    import dynamic from 'next/dynamic';
    const HeavyComponent = dynamic(() => import('./heavy-component'), { 
      ssr: false,
      loading: () => <div>Đang tải component...</div>
    });
    ```

- **Tối ưu hình ảnh**:
  - Sử dụng **WebP**, **lazy loading**, và **responsive images**:
    ```tsx
    import Image from 'next/image';
    <Image
      src="/example.webp"
      alt="Example"
      width={800}
      height={600}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, 50vw"
      srcSet="/example-400.webp 400w, /example-800.webp 800w"
    />
    ```
  - Khuyến nghị sử dụng **CDN hình ảnh** (e.g., Cloudinary).

- **Performance Monitoring**:
  - Web Vitals tracking:
    ```tsx
    // lib/performance-monitor.ts
    import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
    import { log } from './logger';
    
    export function reportWebVitals(metric: any) {
      log.info('Web Vitals', {
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType
      });
    }
    
    // Trong _app.tsx hoặc layout.tsx
    export function reportWebVitals(metric: any) {
      if (metric.label === 'web-vital') {
        console.log(metric);
      }
    }
    ```

- **Client-side Caching Strategy**:
  - Sử dụng React Query cho caching:
    ```tsx
    'use client';
    import { useQuery } from '@tanstack/react-query';
    
    export function BlogPost({ slug }: { slug: string }) {
      const { data: post, isLoading } = useQuery({
        queryKey: ['post', slug],
        queryFn: () => fetchPost(slug),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      });
      
      if (isLoading) return <div>Đang tải...</div>;
      return <article>{post.content}</article>;
    }
    ```

- **Tối ưu Web Vitals cho CSR**:
  - Tập trung vào FID, CLS, LCP với client-side hydration
  - Sử dụng **Lighthouse** để kiểm tra performance
  - Optimize bundle size với code splitting

- **Client-side State Management**:
  - Sử dụng Zustand cho global state:
    ```tsx
    'use client';
    import { create } from 'zustand';
    
    interface AppState {
      posts: Post[];
      setPosts: (posts: Post[]) => void;
    }
    
    export const useAppStore = create<AppState>((set) => ({
      posts: [],
      setPosts: (posts) => set({ posts }),
    }));
    ```

---

## Logging và Debugging

- **Logging Strategy**:
  - Sử dụng **Winston** cho structured logging:
    ```tsx
    // lib/logger.ts
    import { createLogger, format, transports } from 'winston';
    
    const logger = createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
        new transports.Console()
      ]
    });
    
    export const log = {
      info: (message: string, context?: Record<string, unknown>) => 
        logger.info(message, { context, timestamp: Date.now() }),
      warn: (message: string, context?: Record<string, unknown>) => 
        logger.warn(message, { context, timestamp: Date.now() }),
      error: (message: string, error?: Error, context?: Record<string, unknown>) => 
        logger.error(message, { error: error?.stack, context, timestamp: Date.now() }),
      debug: (message: string, context?: Record<string, unknown>) => 
        logger.debug(message, { context, timestamp: Date.now() })
    };
    ```

- **API Request/Response Logging**:
  - Wrapper cho fetch với logging:
    ```tsx
    // lib/api-logger.ts
    export async function fetchWithLogging(url: string, options?: RequestInit) {
      const startTime = Date.now();
      const method = options?.method || 'GET';
      
      log.info('API Request', { method, url, body: options?.body });
      
      try {
        const response = await fetch(url, options);
        const duration = Date.now() - startTime;
        log.info('API Response', { method, url, status: response.status, duration: `${duration}ms` });
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        log.error('API Request Failed', error as Error, { method, url, duration: `${duration}ms` });
        throw error;
      }
    }
    ```

- **Component Performance Logging**:
  - HOC để wrap component với logging:
    ```tsx
    // lib/performance-logger.ts
    export function withLogging<T extends Record<string, unknown>>(
      Component: React.ComponentType<T>,
      componentName: string
    ) {
      return function LoggedComponent(props: T) {
        React.useEffect(() => {
          if (process.env.NODE_ENV === 'development') {
            log.debug(`Component Rendered: ${componentName}`, { props: Object.keys(props) });
          }
        });
        return <Component {...props} />;
      };
    }
    ```

- **Debug Utilities**:
  - Development-only debug tools:
    ```tsx
    // lib/debug-utils.ts
    export const debug = {
      log: (message: string, data?: unknown) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEBUG] ${message}`, data);
        }
      },
      props: (componentName: string, props: Record<string, unknown>) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEBUG] ${componentName} Props:`, props);
        }
      },
      state: (componentName: string, state: Record<string, unknown>) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEBUG] ${componentName} State:`, state);
        }
      }
    };
    ```

- **Logging Best Practices**:
  - **Log Levels**: ERROR (lỗi nghiêm trọng), WARN (cảnh báo), INFO (thông tin quan trọng), DEBUG (chi tiết debugging)
  - **Structured Logging**: Luôn log với context và metadata
  - **Sensitive Data**: Không log password, token, secret - sử dụng `[REDACTED]`
  - **Performance**: Tránh log quá nhiều trong production

---

## Xử lý lỗi và xác thực

- **Enhanced Error Handling**:
  - Custom error types với context:
    ```tsx
    export class ApiError extends Error {
      constructor(
        message: string,
        public statusCode: number,
        public context?: Record<string, unknown>
      ) {
        super(message);
        this.name = 'ApiError';
      }
    }
    
    export class ValidationError extends Error {
      constructor(
        message: string,
        public field?: string,
        public value?: unknown
      ) {
        super(message);
        this.name = 'ValidationError';
      }
    }
    ```

- **Global Error Handler**:
  - Xử lý lỗi tập trung:
    ```tsx
    // lib/error-handler.ts
    export function handleApiError(error: unknown): ApiError {
      if (error instanceof ValidationError) {
        return new ApiError('Validation failed', 400, { field: error.field });
      }
      if (error instanceof ApiError) {
        return error;
      }
      return new ApiError('Internal server error', 500);
    }
    ```

- **Early returns và guard clauses**:
  - Ví dụ:
    ```tsx
    function fetchUser(id: string) {
      if (!id) throw new ValidationError('ID không hợp lệ', 'id', id);
      return fetch(`/api/users/${id}`);
    }
    ```

- **Xác thực với Zod**:
  - Enhanced validation với error handling:
    ```tsx
    import { z } from 'zod';
    const UserSchema = z.object({
      email: z.string().email('Email không hợp lệ'),
      password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    });
    
    function handleSubmit(data: unknown) {
      try {
        const parsed = UserSchema.parse(data);
        return parsed;
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError(
            error.errors[0].message,
            error.errors[0].path[0] as string,
            data
          );
        }
        throw error;
      }
    }
    ```

- **Error boundaries với logging**:
  - Enhanced error boundary:
    ```tsx
    'use client';
    import { log } from '@/lib/logger';
    
    export class ErrorBoundary extends React.Component<
      React.PropsWithChildren<{}>,
      { hasError: boolean; error?: Error }
    > {
      constructor(props: React.PropsWithChildren<{}>) {
        super(props);
        this.state = { hasError: false };
      }
    
      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }
    
      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        log.error('React Error Boundary Caught Error', error, {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'ErrorBoundary'
        });
      }
    
      render() {
        if (this.state.hasError) {
          return (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <h2 className="text-lg font-semibold text-red-800">Đã xảy ra lỗi</h2>
              <p className="text-red-600">Vui lòng thử lại sau</p>
              <button 
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          );
        }
        return this.props.children;
      }
    }
    ```

---

## Quản lý trạng thái và lấy dữ liệu

- **Quản lý trạng thái**:
  - Sử dụng **Zustand**:
    ```tsx
    import { create } from 'zustand';
    interface AuthState {
      isAuthenticated: boolean;
      login: (token: string) => void;
    }
    export const useAuthStore = create<AuthState>((set) => ({
      isAuthenticated: false,
      login: (token) => set({ isAuthenticated: true }),
    }));
    ```

- **Lấy dữ liệu với Client-side**:
  - Sử dụng **TanStack React Query** cho tất cả data fetching:
    ```tsx
    'use client';
    import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
    
    function UserList() {
      const queryClient = useQueryClient();
      
      const { data, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: () => fetch('/api/users').then((res) => res.json()),
        refetchOnWindowFocus: false,
        retry: 3,
      });
      
      const createUserMutation = useMutation({
        mutationFn: (newUser) => fetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(newUser),
        }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
        },
      });
      
      if (isLoading) return <div>Đang tải...</div>;
      if (error) return <div>Lỗi: {error.message}</div>;
      
      return (
        <div>
          {data.map((user) => <div key={user.id}>{user.name}</div>)}
          <button onClick={() => createUserMutation.mutate({ name: 'New User' })}>
            Thêm người dùng
          </button>
        </div>
      );
    }
    ```

- **Client-side URL Management**:
  - Sử dụng `'nuqs'` cho URL state management:
    ```tsx
    'use client';
    import { useSearchParams, useRouter } from 'next/navigation';
    import { useState, useEffect } from 'react';
    
    function SearchFilter() {
      const searchParams = useSearchParams();
      const router = useRouter();
      const [search, setSearch] = useState(searchParams.get('q') || '');
      
      useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (search) {
          params.set('q', search);
        } else {
          params.delete('q');
        }
        router.push(`?${params.toString()}`);
      }, [search, router, searchParams]);
      
      return (
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm..."
        />
      );
    }
    ```

---

## SEO và Meta Tags cho Client-side

- **Client-side Metadata Management**:
  - Sử dụng `next/head` hoặc `useEffect` cho dynamic metadata:
    ```tsx
    'use client';
    import { useEffect } from 'react';
    import Head from 'next/head';
    
    export function DynamicPage({ title, description }: { title: string; description: string }) {
      useEffect(() => {
        document.title = title;
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', description);
        }
        
        // Update Open Graph
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
          ogTitle.setAttribute('content', title);
        }
      }, [title, description]);
      
      return (
        <>
          <Head>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
          </Head>
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </>
      );
    }
    ```

- **Client-side Structured Data**:
  - JSON-LD cho SEO với client-side rendering:
    ```tsx
    'use client';
    import { useEffect } from 'react';
    
    export function StructuredData({ data }: { data: any }) {
      useEffect(() => {
        // Remove existing structured data
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
          existingScript.remove();
        }
        
        // Add new structured data
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
        
        return () => {
          script.remove();
        };
      }, [data]);
      
      return null;
    }
    ```

---

## Internationalization (i18n) cho Client-side

- **Client-side i18n Setup**:
  - Sử dụng react-i18next cho client-side:
    ```tsx
    'use client';
    import { useTranslation } from 'react-i18next';
    import { useEffect } from 'react';
    
    function Component() {
      const { t, i18n } = useTranslation();
      
      useEffect(() => {
        // Detect user language
        const userLang = navigator.language.split('-')[0];
        i18n.changeLanguage(userLang);
      }, [i18n]);
      
      return (
        <div>
          <h1>{t('welcome')}</h1>
          <button onClick={() => i18n.changeLanguage('vi')}>
            Tiếng Việt
          </button>
          <button onClick={() => i18n.changeLanguage('en')}>
            English
          </button>
        </div>
      );
    }
    ```

- **Client-side Translation Management**:
  - Dynamic loading translations:
    ```tsx
    'use client';
    import { useState, useEffect } from 'react';
    
    function useClientTranslations(locale: string) {
      const [translations, setTranslations] = useState({});
      const [loading, setLoading] = useState(true);
      
      useEffect(() => {
        async function loadTranslations() {
          try {
            const response = await fetch(`/locales/${locale}.json`);
            const data = await response.json();
            setTranslations(data);
          } catch (error) {
            console.error('Failed to load translations:', error);
          } finally {
            setLoading(false);
          }
        }
        
        loadTranslations();
      }, [locale]);
      
      return { translations, loading };
    }
    ```

---

## Environment Variables

- **Environment Configuration**:
  - Type-safe environment variables:
    ```tsx
    // lib/env.ts
    const config = {
      database: {
        url: process.env.DATABASE_URL!,
      },
      auth: {
        secret: process.env.AUTH_SECRET!,
        googleClientId: process.env.GOOGLE_CLIENT_ID!,
      },
      api: {
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL!,
      }
    } as const;
    
    export default config;
    ```

- **Validation**:
  - Validate environment variables:
    ```tsx
    import { z } from 'zod';
    
    const envSchema = z.object({
      DATABASE_URL: z.string().url(),
      AUTH_SECRET: z.string().min(32),
      NEXT_PUBLIC_API_BASE_URL: z.string().url()
    });
    
    export const env = envSchema.parse(process.env);
    ```

---

## Database và ORM

- **Prisma Setup**:
  - Database schema:
    ```prisma
    // prisma/schema.prisma
    model User {
      id        String   @id @default(cuid())
      email     String   @unique
      name      String?
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt
    }
    ```

- **Database Client**:
  - Singleton pattern:
    ```tsx
    // lib/db.ts
    import { PrismaClient } from '@prisma/client';
    
    const globalForPrisma = globalThis as unknown as {
      prisma: PrismaClient | undefined;
    };
    
    export const prisma = globalForPrisma.prisma ?? new PrismaClient();
    
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
    ```

- **Database Queries**:
  - Type-safe queries:
    ```tsx
    // lib/queries/user.ts
    export async function getUser(id: string) {
      return prisma.user.findUnique({
        where: { id },
        include: { profile: true }
      });
    }
    
    export async function createUser(data: { email: string; name?: string }) {
      return prisma.user.create({
        data,
        include: { profile: true }
      });
    }
    ```

---

## Bảo mật

- **Enhanced Security**:
  - Xác thực đầu vào với sanitization:
    ```tsx
    // lib/security.ts
    import DOMPurify from 'dompurify';
    
    export function sanitizeHtml(html: string): string {
      return DOMPurify.sanitize(html);
    }
    
    export function sanitizeInput(input: string): string {
      return input.trim().replace(/[<>]/g, '');
    }
    
    // Sử dụng
    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userInput) }} />
    ```

- **API Security**:
  - Enhanced API protection:
    ```tsx
    // middleware.ts
    import { NextResponse } from 'next/server';
    import type { NextRequest } from 'next/server';
    
    export function middleware(request: NextRequest) {
      // Rate limiting
      const rateLimit = new Map();
      const ip = request.ip ?? '127.0.0.1';
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const maxRequests = 100;
      
      if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
      } else {
        const userLimit = rateLimit.get(ip);
        if (now > userLimit.resetTime) {
          rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
        } else if (userLimit.count >= maxRequests) {
          return new NextResponse('Too Many Requests', { status: 429 });
        } else {
          userLimit.count++;
        }
      }
      
      return NextResponse.next();
    }
    ```

- **CSRF Protection**:
  - Enhanced CSRF tokens:
    ```tsx
    export async function POST(request: Request) {
      const token = request.headers.get('x-csrf-token');
      const sessionToken = request.headers.get('x-session-token');
      
      if (!token || !sessionToken) {
        throw new Error('CSRF token không hợp lệ');
      }
      
      // Verify token
      const isValid = await verifyCSRFToken(token, sessionToken);
      if (!isValid) {
        throw new Error('CSRF token không hợp lệ');
      }
    }
    ```

---

## Kiểm thử và tài liệu hóa

- **Enhanced Testing Strategy**:
  - **Unit tests** với **Jest** và **React Testing Library**:
    ```tsx
    import { render, screen, fireEvent } from '@testing-library/react';
    import { axe, toHaveNoViolations } from 'jest-axe';
    
    expect.extend(toHaveNoViolations);
    
    test('renders Button with accessibility', async () => {
      render(<Button label="Gửi" />);
      expect(screen.getByText('Gửi')).toBeInTheDocument();
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    
    test('handles click events', () => {
      const handleClick = jest.fn();
      render(<Button label="Gửi" onClick={handleClick} />);
      
      fireEvent.click(screen.getByText('Gửi'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
    ```

  - **Integration tests** với **Playwright**:
    ```tsx
    import { test, expect } from '@playwright/test';
    
    test.describe('Authentication Flow', () => {
      test('submits form successfully', async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
      });
      
      test('handles form validation', async ({ page }) => {
        await page.goto('/auth');
        await page.click('button[type="submit"]');
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      });
    });
    ```

  - **API Testing**:
    ```tsx
    // tests/api/auth.test.ts
    import { createMocks } from 'node-mocks-http';
    import handler from '@/app/api/auth/login/route';
    
    test('POST /api/auth/login', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { email: 'test@example.com', password: 'password123' }
      });
      
      await handler(req, res);
      expect(res._getStatusCode()).toBe(200);
    });
    ```

- **Enhanced Documentation**:
  - **JSDoc** với examples:
    ```tsx
    /**
     * Hàm lấy danh sách người dùng với phân trang
     * @param page - Trang hiện tại (bắt đầu từ 1)
     * @param limit - Số lượng items per page (mặc định 10)
     * @param filters - Bộ lọc tùy chọn
     * @returns Promise<User[]> - Danh sách người dùng
     * @throws {ValidationError} Khi page < 1
     * @example
     * ```tsx
     * const users = await fetchUsers(1, 20, { status: 'active' });
     * ```
     */
    async function fetchUsers(
      page: number, 
      limit: number = 10, 
      filters?: UserFilters
    ): Promise<User[]> {
      if (page < 1) throw new ValidationError('Page must be >= 1');
      return fetch(`/api/users?page=${page}&limit=${limit}`, {
        body: JSON.stringify(filters)
      }).then(res => res.json());
    }
    ```

  - **Storybook** với controls:
    ```tsx
    import { Button } from '@/components/ui/button';
    import type { Meta, StoryObj } from '@storybook/react';
    
    const meta: Meta<typeof Button> = {
      title: 'Components/Button',
      component: Button,
      parameters: {
        layout: 'centered',
      },
      tags: ['autodocs'],
      argTypes: {
        variant: {
          control: { type: 'select' },
          options: ['default', 'destructive', 'outline', 'secondary']
        },
        size: {
          control: { type: 'select' },
          options: ['default', 'sm', 'lg', 'icon']
        }
      }
    };
    
    export default meta;
    type Story = StoryObj<typeof meta>;
    
    export const Primary: Story = {
      args: {
        children: 'Primary Button',
        variant: 'default'
      }
    };
    ```

---

## Code Review Checklist

- **Code Quality**:
  - [ ] TypeScript types are properly defined
  - [ ] Error handling is implemented
  - [ ] Accessibility attributes are present
  - [ ] Performance optimizations are applied
  - [ ] Security best practices are followed
  - [ ] Tests are written and passing
  - [ ] Documentation is updated

- **Architecture**:
  - [ ] Component structure follows project conventions
  - [ ] Logic is properly separated from UI
  - [ ] API calls are properly handled
  - [ ] State management is appropriate
  - [ ] Code is reusable and modular

- **Performance**:
  - [ ] No unnecessary re-renders
  - [ ] Images are optimized
  - [ ] Bundle size is reasonable
  - [ ] Web Vitals are acceptable
  - [ ] Caching strategy is implemented

---

## Deployment và CI/CD

- **GitHub Actions Workflow**:
  ```yaml
  # .github/workflows/ci.yml
  name: CI/CD Pipeline
  on: [push, pull_request]
  
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '18'
            cache: 'npm'
        
        - run: npm ci
        - run: npm run lint
        - run: npm run type-check
        - run: npm run test
        - run: npm run build
        
        - name: Run Lighthouse
          run: npm run lighthouse
        
        - name: Run Playwright
          run: npx playwright test
    
    deploy:
      needs: test
      runs-on: ubuntu-latest
      if: github.ref == 'refs/heads/main'
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '18'
            cache: 'npm'
        
        - run: npm ci
        - run: npm run build
        
        - name: Deploy to Vercel
          uses: amondnet/vercel-action@v25
          with:
            vercel-token: ${{ secrets.VERCEL_TOKEN }}
            vercel-org-id: ${{ secrets.ORG_ID }}
            vercel-project-id: ${{ secrets.PROJECT_ID }}
  ```

- **Environment Setup**:
  ```bash
  # Production deployment checklist
  - [ ] Environment variables configured
  - [ ] Database migrations applied
  - [ ] CDN configured
  - [ ] Monitoring setup
  - [ ] Error tracking enabled
  - [ ] Performance monitoring active
  ```

---

## Quy trình phát triển

1. **Phân tích sâu**:
   - Phân tích yêu cầu, xác định ràng buộc.

2. **Lập kế hoạch**:
   - Lập kế hoạch kiến trúc:
     ```markdown
     <PLANNING>
     - Component: AuthForm
     - Features: Form đăng nhập, xác thực Zod, error handling
     - Structure: Client component với React Query + Zustand state management
     - Rendering: Client-side rendering với 'use client'
     </PLANNING>
     ```

3. **Triển khai**:
   - Viết mã từng bước, tuân thủ quy tắc.

4. **Xem xét và tối ưu**:
   - Kiểm tra với **Lighthouse**, **axe**.

5. **Hoàn thiện**:
   - Đảm bảo mã an toàn, hiệu suất cao.

---

## Công cụ hỗ trợ

- **Linting và formatting**:
  - **ESLint**:
    ```json
    {
      "extends": ["next/core-web-vitals", "plugin:react/recommended", "plugin:jsx-a11y/recommended"],
      "rules": { "react/prop-types": "off" }
    }
    ```
  - **Prettier**:
    ```json
    {
      "semi": true,
      "trailingComma": "es5",
      "singleQuote": true
    }
    ```

- **CI/CD**:
  - Sử dụng **GitHub Actions** cho kiểm tra và triển khai.

- **Hệ thống thiết kế**:
  - Sử dụng **Storybook** để quản lý component.

---

## Kết luận
Bộ quy tắc này cung cấp hướng dẫn toàn diện để xây dựng ứng dụng Next.js hiệu suất cao, an toàn, và dễ bảo trì với **Client-Side Rendering (CSR)** làm trọng tâm. Với cấu trúc dự án rõ ràng, quy tắc này phù hợp cho các ứng dụng cần tương tác cao, real-time updates, và trải nghiệm người dùng mượt mà. Nếu cần thêm ví dụ hoặc hỗ trợ triển khai, hãy liên hệ nhóm phát triển.

### 🎯 **Ưu điểm của Client-Side Rendering**
- **Tương tác cao**: Components có thể tương tác ngay lập tức
- **Real-time updates**: Dễ dàng cập nhật dữ liệu theo thời gian thực
- **State management**: Quản lý state phức tạp với Zustand + React Query
- **Dynamic content**: Nội dung thay đổi linh hoạt theo user interaction
- **Offline support**: Có thể cache và hoạt động offline